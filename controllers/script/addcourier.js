const XLSX = require('xlsx');
const workbook = XLSX.readFile("controllers/script/Courier New 130823.xlsx");
const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10, // Number of connections in the pool
  host: '34.93.179.111',
  user: 'temp',
  database: 'promiseEngine',
  password: 'temp@123'
});

async function addData() {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const startRow = range.s.r + 1;
  const endrow = range.e.r;

  const query = `
    INSERT INTO promiseEngine.courierV3
    (cpin, minWt, maxWt, WH010, WH006, WH018, WH009, WH011, PWH001, WH012, WH015, WH017, WH004, WH005, WH008, WH013, WH014, \`WN-DRKOL01\`, WH007, WH016, \`WN-MBHI0003\`, \`WN-MBLR0001\`, \`WN-MDEL0002\`)
    VALUES ?
  `;

  let batchValues = [];

  for (let row = startRow; row <= endrow; row++) {
    // ... (Parsing cell values as before)

    // ... (Parsing cell values as before)


    const pinCell   = sheet[XLSX.utils.encode_cell({r:row, c:0})];
    const minwtCell = sheet[XLSX.utils.encode_cell({r:row, c:1})];
    const maxWtCell = sheet[XLSX.utils.encode_cell({r:row, c:2})];
    const WH010Cell = sheet[XLSX.utils.encode_cell({r:row, c:3})];
    const WH006Cell = sheet[XLSX.utils.encode_cell({r:row, c:4})];
    const WH018Cell = sheet[XLSX.utils.encode_cell({r:row, c:5})];
    const WH009Cell = sheet[XLSX.utils.encode_cell({r:row, c:6})];
    const WH011Cell = sheet[XLSX.utils.encode_cell({r:row, c:7})];
    const PWH001Cell = sheet[XLSX.utils.encode_cell({r:row, c:8})];
    const WH012Cell = sheet[XLSX.utils.encode_cell({r:row, c:9})];
    const WH015Cell = sheet[XLSX.utils.encode_cell({r:row, c:10})];
    const WH017Cell = sheet[XLSX.utils.encode_cell({r:row, c:11})];
    const WH004Cell = sheet[XLSX.utils.encode_cell({r:row, c:12})];
    const WH005Cell = sheet[XLSX.utils.encode_cell({r:row, c:13})];
    const WH008Cell = sheet[XLSX.utils.encode_cell({r:row, c:14})];
    const WH013Cell = sheet[XLSX.utils.encode_cell({r:row, c:15})];
    const WH014Cell = sheet[XLSX.utils.encode_cell({r:row, c:16})];
    const WNDRKOL01Cell = sheet[XLSX.utils.encode_cell({r:row, c:17})];
    const WH007Cell = sheet[XLSX.utils.encode_cell({r:row, c:18})];
    const WH016Cell = sheet[XLSX.utils.encode_cell({r:row, c:19})];
    const WNMBLR0001Cell = sheet[XLSX.utils.encode_cell({r:row, c:20})];
    const WNMDEL0002Cell = sheet[XLSX.utils.encode_cell({r:row, c:21})];
    const WNMBHI0003Cell = sheet[XLSX.utils.encode_cell({r:row, c:22})];

    
    const pin = pinCell.v;
    const minwt = minwtCell.v;
    const maxWt = maxWtCell.v;
    const WH010 = WH010Cell.v;
    const WH006 = WH006Cell.v;
    const WH018 = WH018Cell.v;
    const WH009 = WH009Cell.v;
    const WH011 = WH011Cell.v;
    const PWH001 = PWH001Cell.v;
    const WH012 = WH012Cell.v;
    const WH015 = WH015Cell.v;
    const WH017 = WH017Cell.v;
    const WH004 = WH004Cell.v;
    const WH005 = WH005Cell.v;
    const WH008 = WH008Cell.v;
    const WH013 = WH013Cell.v;
    const WH014 = WH014Cell.v;
    const WNDRKOL01 = WNDRKOL01Cell.v;
    const WH007 = WH007Cell.v;
    const WH016 = WH016Cell.v;
    const WNMBLR0001 = WNMBLR0001Cell.v;
    const WNMDEL0002 = WNMDEL0002Cell.v ;
    const WNMBHI0003 =  WNMBHI0003Cell.v ;



    


    batchValues.push([
      pin, minwt, maxWt, WH010, WH006, WH018, WH009, WH011, PWH001, WH012, WH015,
      WH017, WH004, WH005, WH008, WH013, WH014, WNDRKOL01, WH007, WH016,
      WNMBLR0001, WNMDEL0002, WNMBHI0003
    ]);

    // Insert in batches of 1000 or adjust as needed
    if (batchValues.length >= 1000) {
      try {
        await pool.query(query, [batchValues]);
        console.log(batchValues);
        console.log('Batch inserted successfully');
        batchValues = []; // Clear batch
        
      } catch (error) {
        console.error('Error inserting batch:', error);
        // You can choose to handle errors or stop the process
      }
    }
  }

  // Insert any remaining rows
  if (batchValues.length > 0) {
    try {
      await pool.query(query, [batchValues]);
      console.log('Final batch inserted successfully');
    } catch (error) {
      console.error('Error inserting final batch:', error);
      // You can choose to handle errors or stop the process
    }
  }
}

addData();
