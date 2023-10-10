const promiseEngineConnection = require('../../../dbPromiseEngine')


module.exports = GetInventory;

//get inventory of all warehouse with sku weight by passing skuid
async function GetInventory(skuId) {
    let promise = new Promise((resolve, reject) => {
        try {
            let sku = skuId;
            if (skuId.endsWith('CMD')) {
                skuId = skuId.slice(0, -3);
            }
            else if (skuId.endsWith('REW')) {
                skuId = skuId.slice(0, -3);
            }
            else if (skuId.endsWith('23NE')) {
                skuId = skuId.slice(0, -4);
            }
            else if (skuId.endsWith('FG')) {
                skuId = skuId.slice(0, -2);
            }
            // console.log( `SELECT * FROM promiseEngine.EDDItemMaster inner join EdditemInventory on EDDItemMaster.skuId = EdditemInventory.skuCode AND skuId = ${skuId}`);
            promiseEngineConnection.query(
                `SELECT * FROM promiseEngine.EDDItemMaster inner join EdditemInventory on EDDItemMaster.skuId = EdditemInventory.skuCode AND skuId = ?`, skuId,
                async function (error, EDD_Inventory_Sample, fields) {
                    if (error) { console.error(error); }
                    console.log('Inventory_rsponse');
                    console.log(EDD_Inventory_Sample);
                    if (EDD_Inventory_Sample?.length) {
                        let data = JSON.parse(JSON.stringify(EDD_Inventory_Sample))[0];
                        data.skuId = sku;
                        resolve(data);
                    } else {
                        console.log("dasl dakad skasd k");
                        resolve(false);
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

