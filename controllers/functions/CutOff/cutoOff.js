const promiseEngineConnection = require('../../../dbpromiseengine');

module.exports = getCutOff;

async function getCutOff() {
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM promiseEngine.EDDGlobalVariables`,
                async function (error, CuttOffresults, fields) {
                    if (error) { console.error(error); }
                    // console.log('9-T9-CuttOffresults');
                    // console.log(CuttOffresults);
                    if (CuttOffresults) {
                        // console.log('9-T9-CuttOffresults Found');
                        resolve(JSON.parse(JSON.stringify(CuttOffresults))[0]);
                    } else {
                        // console.log('-9-T9-CuttOffresults Not Found');
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


