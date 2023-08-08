const XLSX = require('xlsx');
const CartEddFunctions = require("../functions/eddcart_function");
const workbook = XLSX.readFile('./');
const fs = require('fs');


// file for where you want to store the response
const filePath = 'response.txt';

// Choose the sheet you want to read from (e.g., the first sheet)
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Define the range of cells containing the data
const range = XLSX.utils.decode_range(sheet['!ref']);
const startRow = range.s.r + 2; // Skip the header row
const endRow = range.e.r + 1;

// Loop through the rows and extract the phone number, name, and type
for (let row = startRow; row <= endRow; row++) {
    const cpinCell = sheet[`A${row}`];
    const skusCell = sheet[`B${row}`];
    const qtyCell = sheet[`C${row}`];

    const cpin = cpinCell.v;
    const skus = skusCell.v;
    const qty = qtyCell.v;

    console.log('cPin:', cpin);
    console.log('Skus:', skus);
    console.log('Qty:', qty);
    try {
        let response = CartEddFunctions.EddMaincart(cpin, skus, qty);
        fs.appendFile(filePath, `${JSON.stringify(response)}\n`, (err) => { console.log(err) });
    } catch (error) {
        console.log("error");
        console.log(error)
    }
}