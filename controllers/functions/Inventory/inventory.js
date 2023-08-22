const promiseEngineConnection = require('../../../dbPromiseEngine')


module.exports = GetInventory;

//get inventory of all warehouse with sku weight by passing skuid
async function GetInventory(skuId) {
    let promise = new Promise((resolve, reject) => {
        try {
            // console.log( `SELECT * FROM promiseEngine.EDDItemMaster inner join EdditemInventory on EDDItemMaster.skuId = EdditemInventory.skuCode AND skuId = ${skuId}`);
            promiseEngineConnection.query(
                `SELECT * FROM promiseEngine.EDDItemMaster inner join EdditemInventory on EDDItemMaster.skuId = EdditemInventory.skuCode AND skuId = ?`, skuId,
                async function (error, EDD_Inventory_Sample, fields) {
                    if (error) { console.error(error); }
                    console.log('Inventory_rsponse');
                    if (EDD_Inventory_Sample) {
                        resolve(JSON.parse(JSON.stringify(EDD_Inventory_Sample))[0]);
                    } else {
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

