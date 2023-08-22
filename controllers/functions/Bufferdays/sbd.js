const promiseEngineConnection = require('../../../dbPromiseEngine');

module.exports = getSBD;

async function getSBD(wareHouseId) {
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM SBD WHERE WH = ?`, wareHouseId,
                async function (error, SBDresults, fields) {
                    if (error) { console.error(error); }
                    // console.log('9-T9-SBDresults');
                    // console.log(SBDresults);
                    if (SBDresults) {
                        // console.log('9-T9-SBDresults Found');
                        resolve(JSON.parse(JSON.stringify(SBDresults))[0].SBD);
                    } else {
                        // console.log('-9-T9-SBDresults Not Found');
                        resolve(0);
                    }
                });
        }
        catch (e) {
            console.error(e);
            resolve(0);
        }
    });
    return await promise;
}


