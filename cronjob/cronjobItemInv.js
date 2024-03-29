const request = require('request');
const connectionPool = require('../dbPromiseEngine.js'); // Make sure dbpromiseEngine.js exports a connection pool

// Function to fetch the access token from the UniCommerce API
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const url = 'https://warehousenow.unicommerce.com/oauth/token';
    const params = {
      grant_type: 'password',
      client_id: 'my-trusted-client',
      username: 'harshlovespets@supertails.com',
      password: 'Super@2021'
    };

    // Making a GET request to the UniCommerce API to obtain the access token
    request.get({ url, qs: params }, (error, response, body) => {
      if (error) {
        console.error('Error while fetching access token:', error);
        resolve(null);
      } else {
        try {
          const data = JSON.parse(body);
          if (data && data.access_token) {
            resolve(data.access_token); // Return the access token
          } else {
            console.error('Access token not found in the response.');
            resolve(null);
          }
        } catch (parseError) {
          console.error('Error while parsing access token response:', parseError);
          resolve(null);
        }
      }
    });
  });
}

// Function to get the item master data from the database
async function GetItemMaster() {
  return new Promise((resolve, reject) => {
    try {
      // Use the connection pool to execute a query to fetch the item master data
      connectionPool.query(
        `Select * from EDDItemMaster`,
        function (error, Logsresults, fields) {
          if (error) {
            console.log(error);
            resolve(false);
          } else {
            // Convert the query result to JSON and return it
            resolve(JSON.parse(JSON.stringify(Logsresults)));
          }
        });
    } catch (e) {
      console.log(e);
      resolve(false);
    }
  });
}

// Function to make the UniCommerce API request to fetch inventory data
async function UniCommerceApiinventory(wareHouseId, skuid, accessToken) {
  try {
    const options = {
      url: 'https://warehousenow.unicommerce.com/services/rest/v1/inventory/inventorySnapshot/get',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Facility': wareHouseId,
        'Authorization': `bearer ${accessToken}`
      },
      body: JSON.stringify({
        "itemTypeSKUs": skuid
      })
    };

    // Making a POST request to the UniCommerce API to fetch inventory data
    const response = await new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          console.error(error);
          resolve(false);
        } else {
          // console.log(body);
          // if(typeof body != "string"){
            const data = JSON.parse(body);
            if (data.successful === true) {
              resolve(data.inventorySnapshots); // Return the inventory data
            } else {
              resolve(false);
            }
          // }
          // else{
          //   console.log(body);
          //   console.log("ggujgjbjbj",wareHouseId);
          //   resolve(false);
          // }
        }
      });
    });

    return response;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Function to bulk insert inventory data into the database
async function bulkInsertInventory(inventoryData, wareHouseId) {
  try {
    if (!inventoryData || inventoryData.length === 0) {
      // console.log(`Nothing to insert for warehouse: ${wareHouseId}.`);
      return;
    }

    // Prepare the values for bulk insertion
    const values = inventoryData.map((inventory) => [
      inventory.itemTypeSKU,
      inventory.inventory,
    ]);

    // SQL query to perform bulk insertion or update existing records
    const sql = `
      INSERT INTO promiseEngine.EdditemInventory (skuCode, \`${wareHouseId}\`)
      VALUES ?
      ON DUPLICATE KEY UPDATE \`${wareHouseId}\` = VALUES(\`${wareHouseId}\`)
    `;

    // Execute the SQL query to insert or update inventory data
    await connectionPool.query(sql, [values]);

    // console.log(`Bulk insertion completed for warehouse: ${wareHouseId}.`);
  } catch (error) {
    console.error(`Error during bulk insertion for warehouse: ${wareHouseId}:`, error);
  }
}

// Function to process inventory data for a single warehouse
async function processWarehouse(warehouseId, accessToken) {
  try {
    // Fetch the item master data from the database
    const itemMasterData = await GetItemMaster();

    // Filter out SIMPLE items from the item master data
    const simpleItemMaster = itemMasterData.filter(item => item.Type === "SIMPLE");

    const batchSize = 9000;

    // Process the item master data in batches to manage API request limits
    for (let i = 0; i < simpleItemMaster.length; i += batchSize) {
      const batch = simpleItemMaster.slice(i, i + batchSize);
      const skuIdsbatch = batch.flatMap(item => item?.skuId);

      // console.log(`Processing batch ${i} for warehouse: ${warehouseId}, batch size: ${batch.length}`);

      // Fetch inventory data from UniCommerce API for the batch of SKUs
      const inventorySnapshots = await UniCommerceApiinventory(warehouseId, skuIdsbatch, accessToken);

      // Bulk insert or update inventory data in the database
      await bulkInsertInventory(inventorySnapshots, warehouseId);
    }
  } catch (error) {
    console.error('Error:', error);
    return true
  }
}

// Function to run the inventory snapshot process for multiple warehouses
async function runInventorySnapshotForWarehouses() {
  try {
    // Fetch the access token from UniCommerce API
    const accessToken = await getAccessToken();
// console.log(accessToken);
    if (!accessToken) {
      console.error('Access token not available. Exiting inventory snapshot process.');
      return false;
    }

    // Process each warehouse to fetch and update inventory data
    const promises = [];
    promises.push(...warehouses.map(warehouseId => processWarehouse(warehouseId, accessToken)));
    // promises.push(...warehouseIds.map(warehouseId => processBundleItems(warehouseId, accessToken)));

    await Promise.all(promises);
    // console.log("aj doneee");
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// // List of warehouses for inventory snapshot process
const warehouses = ['WHDSDEL01','WHBLRDSBTM','CWH-BLR001','WN-MBHI0003','WN-MBLR0001','WN-MDEL0002','WHHYD001','PWH001','PWH002','BLRDSKN1','WH004','WH005','WH006','WH007','WH008','WH009','WH010','WH011','WH012','WH013','WH014','WH015','WH016','WH017','WH018','WH019','WH020','WH021','WH022','WH023','WH024','WH025',"WN-BLR-0002"]
// List of warehouses for inventory snapshot process
// const warehouses=["WHBLRDSBTM"]
  module.exports = runInventorySnapshotForWarehouses;

  // runInventorySnapshotForWarehouses()