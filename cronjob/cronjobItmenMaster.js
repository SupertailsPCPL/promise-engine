const request = require('request');
const csvtojson = require('csvtojson');
const connection = require('../dbPromiseEngine')

// Function to fetch the access token from the UniCommerce API
async function getAccessToken() {
  const url = 'https://warehousenow.unicommerce.com/oauth/token?grant_type=password&client_id=my-trusted-client&username=harshlovespets@supertails.com&password=Super@2021';

  return new Promise((resolve, reject) => {
    request.get({ url }, (error, response, body) => {
      if (error) {
        console.error('Error while fetching access token:', error);
        resolve(null);
      } else {
        try {
          console.log(" asddsa sadasdsaads");        
          console.log(body);
          const data = JSON.parse(body);
          if (data && data.access_token) {
            resolve(data.access_token);
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

// Function to create an export job
async function createExportJob(accessToken) {
  try {
    const url = 'https://warehousenow.unicommerce.com/services/rest/v1/export/job/create';
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Facility': 'WN-MBLR0001',
        'Authorization': `bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "exportJobTypeName": "Item Master",
        "exportColums": [
          "skuCode",
          "itemName",
          "weight",
          "enabled",
          "type",
          "componentProductCode",
          "componentQuantity",
          "componentPrice",
          "skuType"
        ],
        "frequency": "ONETIME"
      })
    };
    console.log(options.body);
    // Making a POST request to the UniCommerce API to fetch inventory data
    const response = await new Promise((resolve, reject) => {
      request(options, function (error, response, body) {
        if (error) {
          console.error(error);
          resolve(false);
        } else {
          try {
            console.log("createExportJob createExportJob createExportJob");
            console.log(JSON.parse(body));
            const responseBody = JSON.parse(body);
            resolve(responseBody.jobCode);
          } catch (parseError) {
            console.error('Error while parsing export job response:', parseError);
            reject(parseError);
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

// Function to check export job status
async function checkExportJobStatus(accessToken, jobCode) {
  const url = 'https://warehousenow.unicommerce.com/services/rest/v1/export/job/status';
  const options = {
    'method': 'POST',
    'url': url,
    'headers': {
      'Authorization': `bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Cookie': 'unicommerce=app3'
    },
    body: JSON.stringify({
      "jobCode": jobCode
    })
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        console.error('Error while checking export job status:', error);
        reject(error);
      } else {
        try {
          const responseBody = JSON.parse(body);
          resolve(responseBody);
        } catch (parseError) {
          console.error('Error while parsing export job status response:', parseError);
          reject(parseError);
        }
      }
    });
  });
}

// Function to convert CSV to JSON
async function convertCsvToJson(csvFileUrl) {
  console.log("entered convertCsvToJson");
  try {
    request(csvFileUrl, (error, response, body) => {
      if (error) {
        console.error('Error fetching CSV:', error);
      } else {
        // csvtojson()
        //   .fromString(body)
        //   .then(async (jsonArray) => {
        //     // ... (The rest of the convertCsvToJson function remains the same)
        //   })
        csvtojson()
        .fromString(body)
        .then(async (jsonArray) => {
          const consolidatedData = jsonArray.reduce((result, item) => {
            const existingItem = result.find(
              (product) => product.skuId === item['Product Code']
            );

            if (existingItem) {
              if (item['Component Product Code']) {
                existingItem.componentSkusData.push({
                  skuid: item['Component Product Code'],
                  qty: parseInt(item['Component Quantity']) || 0,
                });
              }
            } else {
              const newItem = {
                skuId: item['Product Code'],
                weight: (parseFloat(item['Weight (gms)']) / 1000).toFixed(2),
                Type: item.Type,
                componentSkusData: [],
              };

              if (item['Component Product Code']) {
                newItem.componentSkusData.push({
                  skuid: item['Component Product Code'],
                  qty: parseInt(item['Component Quantity']) || 0,
                });
              }

              result.push(newItem);
            }

            return result;
          }, []);

          console.log(consolidatedData);

          // Perform bulk insert for faster database insert
          await bulkInsertToTable(consolidatedData);
          console.log('All data inserted successfully');
          return true
        })
          .catch((error) => {
            console.error('Error converting CSV to JSON:', error);
          });
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Recursive function to poll for job completion
async function pollJobCompletion(accessToken, jobCode) {
  try {
    const responseBody = await checkExportJobStatus(accessToken, jobCode);
    if (responseBody.status === "COMPLETE") {
      console.log(JSON.stringify(responseBody, null, 2));
      
      // After job completion, call convertCsvToJson with the filePath
      await convertCsvToJson(responseBody.filePath);
    } else {
      setTimeout(async () => {
        await pollJobCompletion(accessToken, jobCode);
      }, 5000); // Poll every 5 seconds
    }
  } catch (error) {
    console.error('Error while polling job completion:', error);
  }
}

//get inventory of all warehouse with sku weight by passing skuid
async function ItemMasterCronjob(skuId) {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      console.log("accessToken");
      console.log(accessToken);
      const jobCode = await createExportJob(accessToken);
      await pollJobCompletion(accessToken, jobCode);
      return "completed"
    }
  } catch (error) {
    console.error('Error:', error);
    return error
  }
};

// Start by getting the access token, creating an export job, and then polling for completion
module.exports = ItemMasterCronjob;


const bulkInsertToTable = async (data) => {
  BATCH_SIZE = 9000;
  try {
    // Split the data into batches
    const batches = [];
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Prepare the bulk insert query with ON DUPLICATE KEY UPDATE
      let query = 'INSERT INTO promiseEngine.EDDItemMaster(skuId, weight, Type, componentSkusData) VALUES ';
      const values = batch.map((item) => {
        return `('${item.skuId}', '${item.weight}', '${item.Type}', '${JSON.stringify(item.componentSkusData)}')`;
      });

      query += values.join(',');
      query += ' ON DUPLICATE KEY UPDATE ';
      query += 'skuId=VALUES(skuId), weight=VALUES(weight), Type=VALUES(Type), componentSkusData=VALUES(componentSkusData)';

      // Execute the bulk insert/update query
      await connection.query(query);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};