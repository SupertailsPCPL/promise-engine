const GetInventory = require("./Inventory/inventory.js");
const otherEDD = require("./Othercouriers/othercourier.js");
const Shipsy = require('./shipsy/shipsy.js');
//const dropShipEDD = require('./DropshipEdd/dropship.js');
const connection = require('../../dbPromiseEngine')

module.exports = { EddMain, getEdd,getCityStateFromPinCode }

//Sample data
//this is the start point of edd - Main Function
async function EddMain(cpin, skus, qty) {
    try {
        if (!skus) {
            return ({
                "skuId": "No-Sku-Given",
                "responseCode": "402",
                "error": "Enter a SkuId",
                "errorDiscription": "SERVER ERROR"
            })
        }
        if (!cpin) {
            return ({
                "sku": skus,
                "responseCode": "401",
                "errorDiscription": "Pincode field cannot be blank",
                "error": "Enter a Cpin"
            })
        }

        let skuArray = skus.split(',');


        const value = await Promise.all(skuArray.map(
            skuId => getEdd(cpin, skuId, qty),
        )).then((values) => {
            return (values);
        });
        return value;

    }
    catch (e) {
        return ({
            "skuId": skus,
            "responseCode": "499",
            "errorDiscription": "Product will be delivered within 1 to 3 days",
            "error": `"ERROR ${e}"`
        })
    }


}


//calc edd
async function getEdd(cpin, skuId, qty) {
    return new Promise(async (resolve, reject) => {
        try {
            let eddResponse;
            eddResponse = { ...eddResponse, "cpin": cpin, "skuId": skuId, "qty": qty };
            // console.log(eddResponse.skuId);
            // console.log("GetInventory");
            // console.log(Date());
            let inventoryDetails = await GetInventory(eddResponse.skuId);
            // console.log("GetInventory completed");
            // console.log(Date());
            // console.log("aksskakskaa");
            // console.log(inventoryDetails);

            if (inventoryDetails) {
                eddResponse = {
                    ...eddResponse,
                    ...inventoryDetails,
                    "skuWt": qty * inventoryDetails.weight
                };

            }
            else {
                resolve ({
                    "skuid": skuId,
                    "responseCode": "402",
                    "errorDiscription": "Product Not Found",
                    "error": "SkuId not Found"
                });
            }
            // console.log("check for shipsy city");
            // console.log(Date());
            let shipsy = await Shipsy.getIsAvailableInShipcity(cpin);
            // console.log("check for shipsy city completed");
            // console.log(Date());
            // // console.log("ds aldasl ldsals laasl s");
            // console.log(shipsy);

            // if (shipsy !== false && qty * parseFloat(eddResponse.skuWt) <= 20) {
            if (shipsy !== false) {
                // console.log("going with shipsy ");
                let b ;
                for (let i = 0; i < shipsy.length; i++) {
                    const element = shipsy[i];   

                    // console.log("elementelement",element);
                         b = await Shipsy.shipsyEDD(cpin, eddResponse, element?.shipsyCity,element?.LBD,element?.is2HourDelivery,element?.deliveryMins ?? 120);
                         if(b){
                            // console.log("daldldladldlal",b);
                             break;
                         }
                }
                // console.log("final respomseeeee");
                // console.log(b);
                if(b){
                    // console.log("dajskdkdasadsdasooso");
                    resolve(b);
                }
                else{
                    // console.log("adskdsakakdadskkdaskadska");
                    // console.log("going with other courier ");
                    const b = await otherEDD.otherEDD(cpin, eddResponse);
                    resolve(b);
                    
                }
            }
            else{
                const b = await otherEDD.otherEDD(cpin, eddResponse);
                resolve(b);
            }
        } catch (e) {
            console.log(e);
        }
    });
}




async function getCityStateFromPinCode(pincode) {
    let promise = new Promise((resolve, reject) => {
        try {
            let query = `SELECT * FROM promiseEngine.cpinData where cPin = ${pincode}`;
            connection.query(
                query,
                async function (error, pincoderesults) {
                    if (error) {
                        resolve(false); 
                    }
                    if (pincoderesults) {
                        var data = JSON.parse(JSON.stringify(pincoderesults));
                        resolve(data);
                    } else {
                        resolve(false);
                    }
                });
        }
        catch (e) {
            resolve(false);
        }
    });
    return await promise;
}
