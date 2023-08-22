// Import necessary modules
const request = require('request');
const connection = require('./dbpromiseengine.js');

// Function to fetch item master data from the database
async function GetItemMaster() {
    let promise = new Promise((resolve, reject) => {
      try {
        connection.query(
          `Select * from EDDItemMaster`,
          function (error, Logsresults, fields) {
            if (error) {
              console.log(error);
              resolve(false);
            } else {
              resolve(JSON.parse(JSON.stringify(Logsresults)));
            }
          });
      }
      catch (e) {
        console.log(e);
        resolve(false);
      }
    });
    return await promise;
  }

// Function to fetch inventory data from UniCommerce API
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

    // Use a Promise to handle the API request and response
    const response = await new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          console.error(error);
          resolve(false);
        } else {
          if (!JSON.parse(body).length) {
            resolve(false);
          } else {
            if (JSON.parse(body).successful === true) {
              resolve(JSON.parse(body).inventorySnapshots);
            } else {
              resolve(false);
            }
          }
        }
      });
    });

    return response;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Function to perform bulk insertion of inventory data into the database
async function bulkInsertInventory(inventoryData, wareHouseId) {
  try {
    if (!inventoryData || inventoryData.length === 0) {
      console.log(`Nothing to insert for warehouse: ${wareHouseId}.`);
      return;
    }

    // Prepare the data for bulk insertion
    const values = inventoryData.map((inventory) => [
      inventory.itemTypeSKU, // Replace with the appropriate SKU column name in your table
      inventory.inventory, // Replace with the appropriate availableQuantity column name in your table
    ]);

    // The SQL query for bulk insertion with ON DUPLICATE KEY UPDATE
    const sql = `
      INSERT INTO promiseEngine.EdditemInventory (skuCode, \`${wareHouseId}\`)
      VALUES ?
      ON DUPLICATE KEY UPDATE \`${wareHouseId}\` = VALUES(\`${wareHouseId}\`)
    `;

    // Execute the bulk insertion query
    await connection.query(sql, [values]);

    console.log(`Bulk insertion completed for warehouse: ${wareHouseId}.`);
  } catch (error) {
    console.error(`Error during bulk insertion for warehouse: ${wareHouseId}:`, error);
  }
}

// Function to process inventory data for a single warehouse
async function processWarehouse(warehouseId,accessToken) {
  try {
    // Fetch item master data only once to avoid unnecessary repetitions
    const itemMasterData = await GetItemMaster();

    // Filter the item master data to get simple items for this warehouse
    const simpleItemMaster = itemMasterData.filter(item => item.Type === "SIMPLE");
    const batchSize = 9000;

    for (let i = 0; i < simpleItemMaster.length; i += batchSize) {
      const batch = simpleItemMaster.slice(i, i + batchSize);
      const skuIdsbatch = batch.flatMap(item => item?.skuId);

      console.log(`Processing batch ${i} for warehouse: ${warehouseId}, batch size: ${batch.length}`);
      // Fetch inventory data from UniCommerce API for the current batch and warehouse
      const inventorySnapshots = await UniCommerceApiinventory(warehouseId, skuIdsbatch, accessToken);

      // Insert or update the inventory data into the database for the current warehouse
      await bulkInsertInventory(inventorySnapshots, warehouseId);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to run the inventory snapshot for multiple warehouses concurrently
async function runInventorySnapshotForWarehouses(warehouseIds) {
  try {
    const accessToken = await getAcessTokenUniCommerceAPi()
    // Use Promise.all to run the processWarehouse function for each warehouse concurrently
    await Promise.all(warehouseIds.map(warehouseId => processWarehouse(warehouseId,accessToken)));
    return true; // Return true after all warehouses have been processed successfully
  } catch (error) {
    console.error('Error:', error);
    return false; // Return false if there is any error during the process
  }
}

// List of warehouses to process inventory data
const warehouses = ["WN-MDEL0002", "WN-MBHI0003", "WN-MBLR0001", "PWH001", "WH004", "WH005",  "WH006", "WH007", "WH008", "WH009", "WH010", "WH011", "WH012", "WH013", "WH014", "WH015", "WH016", "WH017", "WH018"];
// Start the inventory snapshot process for all warehouses and return the result
runInventorySnapshotForWarehouses(warehouses)
  .then(result => {
    console.log('Inventory snapshot process completed:', result);
  })
  .catch(err => {
    console.error('Error during inventory snapshot process:', err);
  });







//get access token from uni commerce api
async function getAcessTokenUniCommerceAPi() {
  console.log("entered access token");
  let promise = new Promise(async (resolve, reject) => {
      try {
          var url = 'https://warehousenow.unicommerce.com/oauth/token?grant_type=password&client_id=my-trusted-client&username=harshlovespets@supertails.com&password=Super@2021';
          var headers = {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
              'Content-Type': 'application/json'
          };

          request.get({ url: url, headers: headers }, async function (e, r, body) {
              if (e) {
                  console.error(e);
                  resolve(false)
              }

              if (r) {
                  var obj = JSON.parse(r.body);
                  console.log(obj);
                  resolve(obj.access_token);
                  console.log("done with access token");

              }
              else {
                  console.log(false);
              }
          });
      }
      catch (e) {
          console.error(e);
          resolve(false);
      }
  });
  return await promise;
}

