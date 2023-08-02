// const promiseEngineConnection = require('../../../dbpromiseengine');

// module.exports = getGBD;

// async function getGBD(wareHouseId) {
//     let promise = new Promise((resolve, reject) => {
//         try {
//             promiseEngineConnection.query(
//                 `SELECT * FROM GBD WHERE WH = ?`, wareHouseId,
//                 async function (error, SBDresults, fields) {
//                     if (error) { console.error(error); }
//                     // console.log('9-T9-SBDresults');
//                     if (SBDresults.length) {
//                         // console.log('9-T9-SBDresults Found');
//                         console.log(SBDresults);
//                         resolve(JSON.parse(JSON.stringify(SBDresults))[0].SBD);
//                     } else {
//                         // console.log('-9-T9-SBDresults Not Found');
//                         resolve(0);
//                     }
//                 });
//         }
//         catch (e) {
//             console.error(e);
//             resolve(0);
//         }
//     });
//     return await promise;
// }


