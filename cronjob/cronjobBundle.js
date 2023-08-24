const request = require('request');
const connectionPool = require('../dbPromiseEngine.js'); // Make sure dbpromiseEngine.js exports a connection pool

// Function to get the item master data from the database
async function GetItemMaster(isSimple) {
    return new Promise((resolve, reject) => {
        try {
            // Use the connection pool to execute a query to fetch the item master data
            connectionPool.query(
                `Select * from EDDItemMaster where Type = "${isSimple ? "SIMPLE" : "BUNDLE"}"`,
                function (error, Logsresults, fields) {
                    if (error) {
                        console.log(error);
                        resolve(false);
                    } else {
                        // Convert the query result to JSON and return it
                        resolve(JSON.parse(JSON.stringify(Logsresults)));
                    }
                });
        } catch (e) {
            console.log(e);
            resolve(false);
        }
    });
}



// Function to make the UniCommerce API request to fetch inventory data
async function UniCommerceApiinventory(wareHouseId, skuid, accessToken) {
    try {
        const options = {
            url: 'https://warehousenow.unicommerce.com/services/rest/v1/inventory/inventorySnapshot/get',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Facility': wareHouseId,
                'Authorization': `bearer ${accessToken}`
            },
            body: JSON.stringify({
                "itemTypeSKUs": skuid
            })
        };

        // Making a POST request to the UniCommerce API to fetch inventory data
        const response = await new Promise((resolve, reject) => {
            request(options, function (error, response, body) {
                if (error) {
                    console.error(error);
                    resolve(false);
                } else {
                    const data = JSON.parse(body);
                    if (data.successful === true) {
                        resolve(data.inventorySnapshots); // Return the inventory data
                    } else {
                        resolve(false);
                    }
                }
            });
        });

        return response;
    } catch (error) {
        console.error(error);
        return false;
    }
}
// Function to process inventory data for bundle SKUs
async function processBundleItems() {
    try {
        console.log("IAM INNNN");
        // Fetch the item master data from the database
        const bundleItemMaster = await GetItemMaster(false);
        const batchSize = 2000;
        let i = 0;
        for (let start = 0; start < bundleItemMaster.length; start += batchSize) {
            const end = Math.min(start + batchSize, bundleItemMaster.length);
            const batchItems = bundleItemMaster.slice(start, end);
            const promises = [];
            for (const bundleItem of batchItems) {
                const componentSkusData = JSON.parse(bundleItem.componentSkusData);
                const skuIds = componentSkusData.map(item => item.skuid);
                const skuIdsQuoted = skuIds.map(skuCode => `'${skuCode}'`).join(', ');
                promises.push(GetItemInv(skuIdsQuoted));
            }

            const invDataArray = await Promise.all(promises);
            for (let j = 0; j < batchItems.length; j++) {
                const bundleItem = batchItems[j];
                const invData = invDataArray[j];

                if (invData.length > 0) {
                    const componentSkusData = JSON.parse(bundleItem.componentSkusData);
                    const skuIds = componentSkusData.map(item => item.skuid);
                    const qtyMap = componentSkusData.reduce((map, skuData) => {
                        map[skuData.skuid] = skuData.qty;
                        return map;
                    }, {});
    
                    const outputInv = invData.reduce((output, data) => {
                        const skuCode = data.skuCode;
                        const qtyToUpdate = qtyMap[skuCode];
    
                        if (qtyToUpdate) {
                            for (const key in data) {
                                if (key !== 'skuCode' && data[key] !== null) {
                                    output[key] = Math.floor(data[key] / qtyToUpdate);
                                }
                            }
                        }
    
                        return output;
                    }, {});
    
                    outputInv.skuCode = bundleItem.skuId;
                    await insertOrUpdateInventory(outputInv);
                    // console.log(bundleItem);
                    // console.log("outputInv");
                    // console.log(outputInv);
                } else {
                    // console.log("error", bundleItem);
                    i++;
                }
            }
        }

        console.log("IAM OUT");
        console.log(i);
        return true;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to get the item master data from the database
async function GetItemInv(skus) {
    return new Promise((resolve, reject) => {
        try {
            // Use the connection pool to execute a query to fetch the item master data
            connectionPool.query(
                ` SELECT * FROM promiseEngine.EdditemInventory WHERE skuCode IN (${skus})`,
                function (error, Logsresults, fields) {
                    if (error) {
                        console.log(error);
                        resolve(false);
                    } else {
                        // Convert the query result to JSON and return it
                        resolve(JSON.parse(JSON.stringify(Logsresults)));
                    }
                });
        } catch (e) {
            console.log(e);
            resolve(false);
        }
    });
}
    
    async function insertOrUpdateInventory(inventoryObject) {
        const skuCode = inventoryObject.skuCode;
        delete inventoryObject.skuCode;
      
        // Convert 'null' string values to actual null values
        for (const key in inventoryObject) {
          if (inventoryObject[key] === 'null') {
            inventoryObject[key] = null;
          }
        }
      
        const columns = Object.keys(inventoryObject);
        const values = Object.values(inventoryObject);
      
        const insertColumns = [...columns, 'skuCode'].map(col => `\`${col}\``).join(', ');
        const insertValues = [...values, skuCode].map(val => (val === null ? 'null' : `'${val}'`)).join(', ');
      
        const updateStatements = columns
        .filter(col => col !== 'skuCode') // Exclude skuCode from updates
        .map(col => `\`${col}\` = VALUES(\`${col}\`)`)
        .join(', ');
      
      
        const query = `
          INSERT INTO \`promiseEngine\`.\`EdditemInventory\`
            (${insertColumns})
          VALUES
            (${insertValues})
          ON DUPLICATE KEY UPDATE
            ${updateStatements};
        `;
      
        return new Promise((resolve, reject) => {
            connectionPool.query(query, function (error, results, fields) {
            if (error) {
              console.log(error);
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
      }
      




      module.exports = processBundleItems;