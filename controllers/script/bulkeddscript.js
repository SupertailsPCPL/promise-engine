const XLSX = require('xlsx');
const CartEddFunctions = require("../functions/eddcart_function");
const workbook = XLSX.readFile('controllers/script/eddData.xlsx');
const fs = require('fs');


// file for where you want to store the response
const filePath = 'controllers/script/response.txt';

// Choose the sheet you want to read from (e.g., the first sheet)
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Define the range of cells containing the data
const range = XLSX.utils.decode_range(sheet['!ref']);
const startRow = range.s.r + 1; // Skip the header row
const endRow = range.e.r ;

// Loop through the rows and extract the phone number, name, and type
for (let row = startRow; row <= endRow; row++) {
    const cpinCell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const skusCell = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
    const qtyCell = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })];

    const cpin = cpinCell.v;
    const skus = skusCell.v;
    const qty = qtyCell.v;

    console.log('cPin:', cpin);
    console.log('Skus:', skus);
    console.log('Qty:', qty);
    try {
        CartEddFunctions.EddMaincart(cpin, skus, qty)
        .then(response => {
            fs.appendFile(filePath, `${JSON.stringify(response)} \n`, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        })
    } catch (error) {
        console.log("Error:", error);
    }

}