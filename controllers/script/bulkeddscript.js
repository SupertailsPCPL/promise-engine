const XLSX = require('xlsx');
const CartEddFunctions = require("../functions/eddcart_function");
const workbook = XLSX.readFile('controllers/script/eddData.xlsx');
// const fs = require('fs');
const request = require('request');

async function getoldEdd(cpin, sku, qty) {
    let promise = new Promise((resolve, reject) => {
        try {
            let options = {
                'method': 'GET',
                'url': `https://promise-engine-371111.el.r.appspot.com/cartedd?cpin=${cpin}&skuid=${sku}&qty=${qty}`,
            };
            request(options, function (error, response) {
                if (error) { throw new Error(error); }
                let oldEdd = JSON.parse(response.body);
                resolve(oldEdd);
            });
        } catch (error) {
            console.log(error);
        }
    });
    return await promise;
}
// file for where you want to store the response
// const filePath = 'controllers/script/eddData.xlsx';
async function bulkEddScript(){
// Choose the sheet you want to read from (e.g., the first sheet)
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Define the range of cells containing the data
const range = XLSX.utils.decode_range(sheet['!ref']);
const startRow = range.s.r + 1; // Skip the header row
const endRow = range.e.r;

// Loop through the rows and extract the phone number, name, and type

for (let row = startRow; row <= endRow; row++) {
    const cpinCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const skuCell = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
    const qtyCell = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })];

    const cpin = cpinCell.v;
    const sku = skuCell.v;
    const qty = qtyCell.v;

    console.log('cPin:', cpin);
    console.log('Sku:', sku);
    console.log('Qty:', qty);
    try {
        let oldEdd = await getoldEdd(cpin,sku,qty);
        console.log(oldEdd);
       let response = await CartEddFunctions.EddMaincart(cpin, sku, qty)
            for(let i=0; i<response.length; i++){
                const Edd = (response[i]?.EDD ?? "out of stock");
                const sbd = (response[i]?.SBD ?? "out of stock");
                const gbd = (response[i]?.GBD ?? "out of stock");
                const dbd = (response[i]?.DBD ?? "out of stock");
                const wh = (response[i]?.warehouse ?? "out of stock");
                const cutoff = (response[i]?.cutoff ?? "out of stock");
                const courier = (response[i]?.courier ?? "out of stock");
                const combinedWt = (response[i]?.combinedWt ?? "out of stock");

                sheet[XLSX.utils.encode_cell({ r: row, c: 4 })] = { t: 's', v: Edd };
                sheet[XLSX.utils.encode_cell({ r: row, c: 5 })] = { t: 's', v: sbd };
                sheet[XLSX.utils.encode_cell({ r: row, c: 6 })] = { t: 's', v: gbd };
                sheet[XLSX.utils.encode_cell({ r: row, c: 7 })] = { t: 's', v: dbd };
                sheet[XLSX.utils.encode_cell({ r: row, c: 8 })] = { t: 's', v: wh };
                sheet[XLSX.utils.encode_cell({ r: row, c: 9 })] = { t: 's', v: cutoff };
                sheet[XLSX.utils.encode_cell({ r: row, c: 10 })] = { t: 's', v: courier };
                sheet[XLSX.utils.encode_cell({ r: row, c: 11 })] = { t: 's', v: combinedWt };

                // for(let i=0; i<oldEdd.length; i++){
                    const oldsbd = (oldEdd[i]?.SBD ?? "out of stock");
                    const oldgbd = (oldEdd[i]?.GBD ?? "out of stock");
                    const olddbd = (oldEdd[i]?.DBD ?? "out of stock");
                    const oldfledd = (oldEdd[i]?.FLEDD ?? "out of stock");
                    const oldlledd = (oldEdd[i]?.LLEDD ?? "out of stock");
                    const oldl1bd = (oldEdd[i]?.L1BD ?? "out of stock");
                    const oldl2bd = (oldEdd[i]?.L2BD ?? "out of stock");
                    const oldedd = (oldEdd[i]?.EDD ?? "out of stock");
                    const oldwh = (oldEdd[i]?.warehouse ?? "out of stock");
                    const oldcutoff = (oldEdd[i]?.cutoff ?? "out of stock");
                    const oldcourier = (oldEdd[i]?.courier ?? "out of stock");
                    const oldcombineWT = (oldEdd[i]?.combinedWt ?? "out of stock");
    
                    sheet[XLSX.utils.encode_cell({ r: row, c: 13 })] = { t: 's', v: oldsbd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 14 })] = { t: 's', v: oldgbd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 15 })] = { t: 's', v: olddbd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 16 })] = { t: 's', v: oldfledd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 17 })] = { t: 's', v: oldlledd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 18 })] = { t: 's', v: oldl1bd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 19 })] = { t: 's', v: oldl2bd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 20 })] = { t: 's', v: oldedd };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 21 })] = { t: 's', v: oldwh };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 22 })] = { t: 's', v: oldcutoff };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 23 })] = { t: 's', v: oldcourier };
                    sheet[XLSX.utils.encode_cell({ r: row, c: 24 })] = { t: 's', v: oldcombineWT };
                // }
            }
            // Save the modified workbook back to the file
            XLSX.writeFile(workbook, 'controllers/script/eddData.xlsx');


    } catch (error) {
        console.log("Error:", error);
    }

}
}


bulkEddScript();

