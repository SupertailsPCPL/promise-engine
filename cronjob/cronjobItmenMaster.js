const request = require('request');
const csvtojson = require('csvtojson');
const connection = require('../dbPromiseEngine.js');

const csvFileUrl = 'https://warehousenow.unicommerce.com/open/redirection/export/aHR0cHM6Ly91bmljb21tZXJjZS1leHBvcnQtaW4uczMuYW1hem9uYXdzLmNvbS93YXJlaG91c2Vub3cvNjRlNDU4NTVhYTM5ZjYyZjExZjkzODk0L0V4cG9ydC1JdGVtJTIwTWFzdGVyLXdhcmVob3VzZW5vd18yMjA4MjAyMzEyMTAyMi5jc3YjIyM2NGU0NTg1NWFhMzlmNjJmMTFmOTM4OTQjIyMyMl8wOF8yMDIz'

const BATCH_SIZE = 1000; // Set the batch size according to your database limits

const convertCsvToJson = async () => {
  try {
    request(csvFileUrl, (error, response, body) => {
      if (error) {
        console.error('Error fetching CSV:', error);
      } else {
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
          })
          .catch((error) => {
            console.error('Error converting CSV to JSON:', error);
          });
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
};

const bulkInsertToTable = async (data) => {
  try {
    // Split the data into batches
    const batches = [];
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      batches.push(data.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      // Prepare the bulk insert query
      let query = 'INSERT INTO promiseEngine.EDDItemMaster(skuId, weight, Type, componentSkusData) VALUES ';
      const values = batch.map((item) => {
        return `('${item.skuId}', '${item.weight}', '${item.Type}', '${JSON.stringify(item.componentSkusData)}')`;
      });

      query += values.join(',');

      // Execute the bulk insert query
      await connection.query(query);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

module.exports = convertCsvToJson;

