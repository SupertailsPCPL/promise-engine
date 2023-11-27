const request = require('request');
const connectionPool = require('../dbPromiseEngine.js'); // Make sure dbpromiseEngine.js exports a connection pool

// Function to get the item master data from the database
async function GetItemMaster() {
    return new Promise((resolve, reject) => {
        try {
            // Use the connection pool to execute a query to fetch the item master data
            connectionPool.query(
                // `SELECT * FROM promiseEngine.EDDItemMaster where skuId in ('abg60X2')`,
                // `SELECT * FROM promiseEngine.EDDItemMaster;`,
                `Select * from EDDItemMaster where Type = "BUNDLE"`,
                (error, Logsresults, fields) => {
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
                if(skuIdsQuoted){
                    promises.push(GetItemInv(skuIdsQuoted));
                }
            }

            const invDataArray = await Promise.all(promises);
            console.log("dasldasladlslasl");
            for (let j = 0; j < batchItems.length; j++) {
                const bundleItem = batchItems[j];
                const invData = invDataArray[j];
                    console.log(bundleItem);
                if (invData.length > 0) {
                    const componentSkusData = JSON.parse(bundleItem.componentSkusData);
                    const skuIds = componentSkusData.map(item => item.skuid);
                    const qtyMap = componentSkusData.reduce((map, skuData) => {
                        map[skuData.skuid] = skuData.qty;
                        return map;
                    }, {});
                    console.log(invData);

                    const outputInv = invData.reduce((output, data) => {
                        const skuCode = data.skuCode;
                        const qtyToUpdate = qtyMap[skuCode];

                        if (qtyToUpdate) {
                            for (const key in data) {
                                if (key !== 'skuCode' && data[key] !== null) {
                                    // Calculate the minimum value for each key
                                    output[key] = output[key] === undefined
                                        ? Math.floor(data[key] / qtyToUpdate)
                                        : Math.min(output[key], Math.floor(data[key] / qtyToUpdate));
                                }
                            }
                        }
                        return output;
                    }, {});
                    outputInv.skuCode = bundleItem.skuId;
                    console.log("outputInv");
                    console.log(outputInv);
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
    console.log("daskdasksdak",skus);
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
                        console.log(true);
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
    try{
    const skuCode = inventoryObject.skuCode;
    delete inventoryObject.skuCode;

    if(Object.keys(inventoryObject).length > 0){
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
else{
    return false
}

}catch(e){
    console.log(e);
    return false
   
}
}





module.exports = processBundleItems;
