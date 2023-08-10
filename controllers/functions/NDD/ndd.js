const promiseEngineConnection = require('../../../dbpromiseengine');


module.exports = getIsAvailableInNDD;

async function getIsAvailableInNDD(cPin) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM NDD_Pincodes WHERE pincode = "${cPin}"`,
                async function (error, NDDResults, fields) {
                    if (error) {
                        console.error(error);
                    }
                    if (NDDResults.length) {
                        dataRes = JSON.parse(JSON.stringify(NDDResults[0]))
                        resolve(dataRes.wareHouseId);

                    } else {
                        console.log('NDD Not Found');
                        resolve(false);
                    }
                });
            }
            
        catch (e) {
            console.error(e);
            resolve(false);
        }
    });
    return await promise
}