const GetInventory = require("./Inventory/inventory.js");
const otherEDD = require("./Othercouriers/othercourier.js")
const Shipsy = require('./shipsy/shipsy.js')

module.exports = { EddMain,getEdd }


EddMain(560001, "CBONA0021SA,CBONA0017SA", 4);


//this is the start point of edd - Main Function
async function EddMain(cpin,skus,qty){
    try{    
        if(!skus){
            return ({
                "skuId": "No-Sku-Given",
                "responseCode": "402",
                "error": "Enter a SkuId",
                "errorDiscription": "SERVER ERROR"
            })
        }
        if(!cpin){
            return ({
                "sku":skus,
                "responseCode": "401",
                "errorDiscription": "Pincode field cannot be blank",
                "error": "Enter a Cpin"
            })
        }
       
        let skuArray = skus.split(',');
        console.log(skuArray);

        const value = await Promise.all(skuArray.map(
            skuId => getEdd(cpin, skuId, qty),
        )).then((values) => {
            console.log(values)
            return (values);
        });
       
    }
    catch(e){
        return ({
            "skuId": skus,
            "responseCode": "499",
            "errorDiscription": "Product will be delivered within 1 to 3 days",
            "error": `"ERROR ${e}"`
        })
    }


}


//calc edd
async function getEdd(cpin,skuId,qty){
    return new Promise(async (resolve, reject) => {
        try{
        console.log(cpin,skuId,qty);
        let eddResponse;
        eddResponse={...eddResponse,"cpin":cpin,"skuId":skuId,"qty":qty};
        console.log(eddResponse);
        let inventoryDetails =  await GetInventory(eddResponse.skuId);
        console.log(inventoryDetails);
        if(inventoryDetails){
            eddResponse = {
                    ...eddResponse,
                    ...inventoryDetails
                };
                console.log(eddResponse);
            }
            else {
                    return ({
                        "skuid": skuid,
                        "responseCode": "402",
                        "errorDiscription": "Product Not Found",
                        "error": "SkuId not Found"
                    });
                }
                let shipsy = await Shipsy.getIsAvailableInShipcity(cpin);
                console.log(shipsy);
                if (shipsy!==false) {
                    console.log("going with shipsy ");
                    const b = await Shipsy.shipsyEDD(cpin, eddResponse, shipsy.shipsyCity);
                    resolve(b);
                    }
                    else {
                        console.log("going with other courier ");
                        const b = await otherEDD(cpin, eddResponse);
                        resolve(b);
                    }
        }catch(e){
            console.log(e);
        }
       });  
    }

