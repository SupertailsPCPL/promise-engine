const promiseEngineConnection = require('../../../dbpromiseengine')
const analyticsConnecttion = require('../../../dbanalytics')


module.exports = GetInventory;

//get inventory of all warehouse with sku weight by passing skuid
async function GetInventory(skuId) {
    let promise = new Promise((resolve, reject) => {
        try {
            analyticsConnecttion.query(
                `SELECT * FROM analytics.EDD_Inventory_Sample inner join analytics.itemMaster on  EDD_Inventory_Sample.SKU = itemMaster.skuCode AND SKU = ?`, skuId,
                async function (error, EDD_Inventory_Sample, fields) {
                    if (error) { console.error(error); }
                    console.log('Inventory_rsponse');
                    if (EDD_Inventory_Sample) {
                        // console.log('9-T9-SBDresults Found');
                        console.log(EDD_Inventory_Sample);
                        resolve(JSON.parse(JSON.stringify(EDD_Inventory_Sample))[0]);
                    } else {
                        // console.log('-9-T9-SBDresults Not Found');
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

