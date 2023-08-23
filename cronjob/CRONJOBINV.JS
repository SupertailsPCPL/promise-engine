const request = require('request');
const connectionPool = require('../dbPromiseEngine.js'); // Make sure dbpromiseEngine.js exports a connection pool

const warehouses = ["WN-MDEL0002", "WN-MBHI0003", "WN-MBLR0001", "PWH001", "WH004", "WH005", "WH006", "WH007", "WH008", "WH009", "WH010", "WH011", "WH012", "WH013", "WH014", "WH015", "WH016", "WH017", "WH018"];

// runInventorySnapshotBatch111(warehouses)
//   .then(result => {
//     console.log('Inventory snapshot process completed:', result);
//   })
//   .catch(err => {
//     console.error('Error during inventory snapshot process:', err);
//   });


async function runInventorySnapshotBatch111(warehouses) {
    await runInventorySnapshotForWarehouses(warehouses);
    return true
}




// Function to run the inventory snapshot process for multiple warehouses
async function runInventorySnapshotForWarehouses(warehouseIds) {
    try {
        // Fetch the access token from UniCommerce API
        const accessToken = await getAccessToken();

        if (!accessToken) {
            console.error('Access token not available. Exiting inventory snapshot process.');
            return false;
        }

        // Process each warehouse to fetch and update inventory data
        const promises = [];
        console.log(warehouseIds);
        promises.push(...warehouseIds.map(warehouseId => processWarehouse(warehouseId, accessToken)));
        // promises.push(...warehouseIds.map(warehouseId => processBundleItems(warehouseId, accessToken)));

        await Promise.all(promises);

        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}


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


// Function to fetch the access token from the UniCommerce API
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        const url = 'https://warehousenow.unicommerce.com/oauth/token';
        const params = {
            grant_type: 'password',
            client_id: 'my-trusted-client',
            username: 'harshlovespets@supertails.com',
            password: 'Super@2021'
        };

        // Making a GET request to the UniCommerce API to obtain the access token
        request.get({ url, qs: params }, (error, response, body) => {
            if (error) {
                console.error('Error while fetching access token:', error);
                resolve(null);
            } else {
                try {
                    const data = JSON.parse(body);
                    if (data && data.access_token) {
                        resolve(data.access_token); // Return the access token
                    } else {
                        console.error('Access token not found in the response.');
                        resolve(null);
                    }
                } catch (parseError) {
                    console.error('Error while parsing access token response:', parseError);
                    resolve(null);
                }
            }
        });
    });
}



// Function to process inventory data for a single warehouse
async function processWarehouse(warehouseId, accessToken) {
    try {
        // Fetch the item master data from the database
        const simpleItemMaster = await GetItemMaster(true);

        // Filter out SIMPLE items from the item master data
        const batchSize = 9500;
        // Process the item master data in batches to manage API request limits
        for (let i = 0; i < simpleItemMaster.length; i += batchSize) {
            const batch = simpleItemMaster.slice(i, i + batchSize);
            const skuIdsbatch = batch.flatMap(item => item?.skuId);
            console.log(`Processing batch ${i} for warehouse: ${warehouseId}, batch size: ${batch.length}`);
            // Fetch inventory data from UniCommerce API for the batch of SKUs
            const inventorySnapshots = await UniCommerceApiinventory(warehouseId, skuIdsbatch, accessToken);
            // Bulk insert or update inventory data in the database
            await bulkInsertInventory(inventorySnapshots, warehouseId);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


// Function to bulk insert inventory data into the database
async function bulkInsertInventory(inventoryData, wareHouseId) {
    try {
        if (!inventoryData || inventoryData.length === 0) {
            console.log(`Nothing to insert for warehouse: ${wareHouseId}.`);
            return;
        }

        // Prepare the values for bulk insertion
        const values = inventoryData.map((inventory) => [
            inventory.itemTypeSKU,
            inventory.inventory,
        ]);

        // SQL query to perform bulk insertion or update existing records
        const sql = `
      INSERT INTO promiseEngine.EdditemInventory (skuCode, \`${wareHouseId}\`)
      VALUES ?
      ON DUPLICATE KEY UPDATE \`${wareHouseId}\` = VALUES(\`${wareHouseId}\`)
    `;

        // Execute the SQL query to insert or update inventory data
        await connectionPool.query(sql, [values]);

        console.log(`Bulk insertion completed for warehouse: ${wareHouseId}.`);
    } catch (error) {
        console.error(`Error during bulk insertion for warehouse: ${wareHouseId}:`, error);
    }
}

// Function to process inventory data for bundle SKUs
async function processBundleItems() {
    try {
        console.log("IAM INNNN");

        // Fetch the item master data from the database
        const bundleItemMaster = await GetItemMaster(false);
        console.log(bundleItemMaster.length);

        const batchSize = 100;
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
                    console.log(bundleItem);
                    console.log("outputInv");
                    console.log(outputInv);
                } else {
                    console.log("error", bundleItem);
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



processBundleItems()
    .then(result => {
        console.log('Inventory snapshot process completed:', result);
    })
    .catch(err => {
        console.error('Error during inventory snapshot process:', err);
    });

    
    async function insertOrUpdateInventory(inventoryObject) {
        console.log("inventoryObject");
        console.log(inventoryObject);
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
      