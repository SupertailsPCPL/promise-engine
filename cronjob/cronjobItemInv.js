const request = require('request');
const connectionPool = require('../dbpromiseEngine.js'); // Make sure dbpromiseEngine.js exports a connection pool

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
          const data = JSON.parse(body);
          if (data.successful === true) {
            resolve(data.inventorySnapshots); // Return the inventory data
          } else {
            resolve(false);
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

// Function to bulk insert inventory data into the database
async function bulkInsertInventory(inventoryData, wareHouseId) {
  try {
    if (!inventoryData || inventoryData.length === 0) {
      console.log(`Nothing to insert for warehouse: ${wareHouseId}.`);
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

    console.log(`Bulk insertion completed for warehouse: ${wareHouseId}.`);
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

      console.log(`Processing batch ${i} for warehouse: ${warehouseId}, batch size: ${batch.length}`);

      // Fetch inventory data from UniCommerce API for the batch of SKUs
      const inventorySnapshots = await UniCommerceApiinventory(warehouseId, skuIdsbatch, accessToken);

      // Bulk insert or update inventory data in the database
      await bulkInsertInventory(inventorySnapshots, warehouseId);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to bulk insert inventory data for bundle SKUs into the database
async function bulkInsertInventoryBundle(bundleSkuCode, inventoryData, wareHouseId) {
  try {
    if (Object.keys(inventoryData).length === 0) {
      console.log(`Nothing to insert for bundle SKU: ${bundleSkuCode} in warehouse: ${wareHouseId}.`);
      return;
    }

    // Prepare the values for bulk insertion
    const values = Object.entries(inventoryData).map(([skuCode, quantity]) => [skuCode, quantity]);

    // SQL query to perform bulk insertion or update existing records for bundle SKUs
    const sql = `
      INSERT INTO promiseEngine.EdditemInventory (skuCode, \`${wareHouseId}\`)
      VALUES ? AS new_data
      ON DUPLICATE KEY UPDATE \`${wareHouseId}\` = new_data.\`${wareHouseId}\`
    `;

    // Execute the SQL query to insert or update inventory data for bundle SKUs
    await connectionPool.query(sql, [values]);

    console.log(`Bulk insertion completed for bundle SKU: ${bundleSkuCode} in warehouse: ${wareHouseId}.`);
  } catch (error) {
    console.error(`Error during bulk insertion for bundle SKU: ${bundleSkuCode} in warehouse: ${wareHouseId}:`, error);
  }
}

// Function to process inventory data for bundle SKUs
async function processBundleItems(warehouseId, accessToken) {
  try {
    // Fetch the item master data from the database
    const itemMasterData = await GetItemMaster();

    // Filter out BUNDLE items from the item master data
    const bundleItemMaster = itemMasterData.filter(item => item.Type === "BUNDLE");

    // Process inventory data for each bundle SKU
    await Promise.all(bundleItemMaster.map(async bundleItem => {
      const componentSkusData = JSON.parse(bundleItem.componentSkusData);
      let minAvailableQuantity = Infinity;
      let bundleInventory = {};

      // Fetch inventory data for each component SKU of the bundle
      const componentInventoryPromises = componentSkusData.map(component => {
        return UniCommerceApiinventory(warehouseId, [component.skuid], accessToken);
      });

      // Wait for all the inventory data to be fetched
      const componentInventories = await Promise.all(componentInventoryPromises);

      console.log(bundleItem);
      componentInventories.forEach((componentInventory, index) => {
        if (componentInventory && componentInventory.length > 0) {
          const component = componentSkusData[index];
          const componentQuantity = component.qty;
          const componentAvailableQuantity = componentInventory[0].inventory;
          const effectiveInventory = Math.floor(componentAvailableQuantity / componentQuantity);

          if (effectiveInventory < minAvailableQuantity) {
            minAvailableQuantity = effectiveInventory;
            bundleInventory[bundleItem.skuId] = effectiveInventory;
          }
        }
      });

      if (Object.keys(bundleInventory).length > 0) {
        // Bulk insert or update inventory data for the bundle SKU
        await bulkInsertInventoryBundle(bundleItem.skuId, bundleInventory, warehouseId);
      }
    }));

    return true;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to run the inventory snapshot process for multiple warehouses
async function runInventorySnapshotForWarehouses(warehouseIds) {
  try {
    // Fetch the access token from UniCommerce API
    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error('Access token not available. Exiting inventory snapshot process.');
      return false;
    }

    // Process each warehouse to fetch and update inventory data
    const promises = [];
    promises.push(...warehouseIds.map(warehouseId => processWarehouse(warehouseId, accessToken)));
    // promises.push(...warehouseIds.map(warehouseId => processBundleItems(warehouseId, accessToken)));

    await Promise.all(promises);

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function runInventorySnapshotForWarehousesbundle(warehouseIds) {
  try {
    // Fetch the access token from UniCommerce API
    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error('Access token not available. Exiting inventory snapshot process.');
      return false;
    }

    // Process each warehouse to fetch and update inventory data
    const promises = [];
    // promises.push(...warehouseIds.map(warehouseId => processWarehouse(warehouseId, accessToken)));
    promises.push(...warehouseIds.map(warehouseId => processBundleItems(warehouseId, accessToken)));

    await Promise.all(promises);

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}


// // List of warehouses for inventory snapshot process
// const warehouses = ["WN-MDEL0002", "WN-MBHI0003", "WN-MBLR0001", "PWH001", "WH004", "WH005",  "WH006", "WH007", "WH008", "WH009", "WH010", "WH011", "WH012", "WH013", "WH014", "WH015", "WH016", "WH017", "WH018"];
// List of warehouses for inventory snapshot process
const warehouses = ["WH009", "WH010"];

// Start the inventory snapshot process for the specified warehouses
runInventorySnapshotForWarehousesbundle(warehouses)
  .then(result => {
    console.log('Inventory snapshot process completed:', result);
  })
  .catch(err => {
    console.error('Error during inventory snapshot process:', err);
  });

