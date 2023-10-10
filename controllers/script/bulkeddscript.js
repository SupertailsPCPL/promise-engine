// const XLSX = require('xlsx');
// const CartEddFunctions = require("../functions/eddcart_function");
// const request = require('request'); // Use request-promise-native for async/await support

// async function getOldEdd(cpin, sku, qty) {
//     try {
//         const options = {
//             method: 'GET',
//             uri: `https://promise-engine-371111.el.r.appspot.com/cartedd?cpin=${cpin}&skuid=${sku}&qty=${qty}`,
//             json: true, // Automatically parse response as JSON
//         };
//         const response = await request(options);
//         return response;
//     } catch (error) {
//         console.log(error);
//         throw error; // Re-throw the error for error handling higher up the call stack
//     }
// }

// async function bulkEddScript() {
//     const workbook = XLSX.readFile('controllers/script/EDDINPUT1.xlsx');
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const range = XLSX.utils.decode_range(sheet['!ref']);
//     const startRow = range.s.r + 1;
//     const endRow = range.e.r;

//     for (let row = startRow; row <= endRow; row++) {
//         const cpinCell = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })];
//         const skuCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
//         const qtyCell = sheet[XLSX.utils.encode_cell({ r: row, c: 3 })];

//         const cpin = cpinCell.v;
//         const sku = skuCell.v;
//         const qty = qtyCell.v;

//         try {
//             const oldEdd = await getOldEdd(cpin, sku, qty);
//             const response = await CartEddFunctions.EddMaincart(cpin, sku, qty);

//             for (let i = 0; i < response.length; i++) {
//                 const Edd = response[i]?.EDD ?? "out of stock";
//                 const sbd = response[i]?.SBD ?? "out of stock";
//                 const gbd = response[i]?.GBD ?? "out of stock";
//                 const dbd = response[i]?.DBD ?? "out of stock";
//                 const wh = response[i]?.warehouse ?? "out of stock";
//                 const cutoff = response[i]?.cutoff ?? "out of stock";
//                 const courier = response[i]?.courier ?? "out of stock";
//                 const combinedWt = response[i]?.combinedWt ?? "out of stock";

//                 sheet[XLSX.utils.encode_cell({ r: row, c: 5 + i })] = { t: 's', v: Edd };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 14 + i })] = { t: 's', v: sbd };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 23 + i })] = { t: 's', v: gbd };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 32 + i })] = { t: 's', v: dbd };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 41 + i })] = { t: 's', v: wh };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 50 + i })] = { t: 's', v: cutoff };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 59 + i })] = { t: 's', v: courier };
//                 sheet[XLSX.utils.encode_cell({ r: row, c: 68 + i })] = { t: 's', v: combinedWt };
//             }

//             XLSX.writeFile(workbook, 'controllers/script/EDDINPUT1.xlsx');
//         } catch (error) {
//             console.log("Error:", error);
//         }
//     }
// }

// bulkEddScript();
