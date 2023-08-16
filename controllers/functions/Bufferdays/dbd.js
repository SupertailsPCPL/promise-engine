const promiseEngineConnection = require('../../../dbpromiseengine');

module.exports = getDBD;

async function getDBD(cPin) {
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM DBD WHERE cPin = ${cPin}`,
                function (error, DBDresults, fields) {
                    if (error) { console.error(error); }
                    // console.log('-1-T10-DBD');
                    if (!DBDresults) {
                        resolve(0);
                    }
                    if (DBDresults.length) {
                        // console.log('-1-T10-DBD Found');
                        resolve(JSON.parse(JSON.stringify(DBDresults))[0].DBD);
                    } else {
                        // console.log('-1-T10-DBD Not Found');
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