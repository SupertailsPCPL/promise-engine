const request = require('request');
const connection = require('./dbpromiseEngine.js');


// const BATCH_SIZE = 1000; // Set the batch size according to your database limits

const InventorySnapshot = async () => {
  try {
   let itemMasterData = await GetItemMaster();
   console.log(itemMasterData);
   let simpleItemMaster = [];
   let bundleItemMaster = [];
   for (let i = 0; i < itemMasterData.length; i++) {
        if(itemMasterData[i].Type == "SIMPLE"){
            simpleItemMaster.push(itemMasterData[i])
        }
        else{
            bundleItemMaster.push(itemMasterData[i])
        }
   }
//    console.log(simpleItemMaster);
   console.log(simpleItemMaster[122]);
  } catch (error) {
    console.error('Error:', error);
  }
};

// const bulkInsertToTable = async (data) => {
//   try {
//     // Split the data into batches
//     const batches = [];
//     for (let i = 0; i < data.length; i += BATCH_SIZE) {
//       batches.push(data.slice(i, i + BATCH_SIZE));
//     }

//     for (const batch of batches) {
//       // Prepare the bulk insert query
//       let query = 'INSERT INTO promiseEngine.EDDItemMaster(skuId, weight, Type, componentSkusData) VALUES ';
//       const values = batch.map((item) => {
//         return `('${item.skuId}', '${item.weight}', '${item.Type}', '${JSON.stringify(item.componentSkusData)}')`;
//       });

//       query += values.join(',');

//       // Execute the bulk insert query
//       await connection.query(query);
//     }
//   } catch (error) {
//     console.error('Error:', error);
//   }
// };

// InventorySnapshot();





async function GetItemMaster(orderId) {
    let promise = new Promise((resolve, reject) => {
        try {
            connection.query(
                `Select * from EDDItemMaster`,
                function (error, Logsresults, fields) {
                    if (error) { console.log(error); }
                    if (Logsresults) {
                        resolve(JSON.parse(JSON.stringify(Logsresults)));
                    } else {
                        resolve(false);
                    }
                });
        }
        catch (e) {
            console.log(e);
            resolve(false);
        }
    });
    return await promise
}



//get inventory from warehouseID,skuid and acessToken from uni commerce api
UniCommerceApiinventory("WN-MBLR0001",["CFOWF0003MO","DTRJT0068JH"],"4a2767fb-1e7c-4ebc-9665-deb7754d4599")
async function UniCommerceApiinventory(wareHouseId, skuid, accessToken) {

    let promise = new Promise(async (resolve, reject) => {

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
            await request(options, function (error, response, body) {
                if (error) {
                    console.error(error);
                    resolve(false);
                } else {
                    if (!JSON.parse(JSON.stringify(body)).length) {
                        resolve(false);
                    }
                    else {
                        if (JSON.parse(body).successful === true) {
                            console.log(JSON.parse(body).inventorySnapshots);                            
                            resolve(JSON.parse(body).inventorySnapshots);
                        }
                        else {
                            resolve(false);
                        }
                    }
                }
            });
        }
        catch (e) {
            console.error(e);
            resolve(false);
        }
    });
    return await promise;
}