const promiseEngineConnection = require('../../../dbpromiseengine');

module.exports = getcPinData;

async function getcPinData(cPin) {
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM cpinData WHERE cPin = ?`, cPin,
                async function (error, cpinDataresults, fields) {
                    if (error) { console.error(error); }
                    if (cpinDataresults.length) {
                        console.log('cpinData');
                        console.log(cpinDataresults);
                        resolve(JSON.parse(JSON.stringify(cpinDataresults))[0]);
                    } else {
                        // console.log(cPin);
                        console.log(cpinDataresults);
                        console.log('cpinData Not Found');
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