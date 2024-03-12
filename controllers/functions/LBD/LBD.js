const promiseEngineConnection = require('../../../dbPromiseEngine');


module.exports = GetLBD;

async function GetLBD(warehouse,cpin,skuWt) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM LBD WHERE cpin = ${cpin} AND WH='${warehouse}' AND minWt <= ${skuWt} AND maxWt > ${skuWt};`,
                async function (error, LBDResults, fields) {
                    if (error) {
                        console.error(error);
                    }
                    if (LBDResults?.length) {
                        dataRes = JSON.parse(JSON.stringify(LBDResults[0]))
                        // console.log(dataRes?.LBD ?? 0);
                        resolve(dataRes?.LBD ?? 0 );

                    } else {
                        console.log('LBD Not Found');
                        resolve(0);
                    }
                });
            }
            
        catch (e) {
            console.error(e);
            resolve(0);
        }
    });
    return await promise
}