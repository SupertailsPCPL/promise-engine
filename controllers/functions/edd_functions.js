const GetInventory = require("./Inventory/inventory.js");
const otherEDD = require("./Othercouriers/othercourier.js")
const Shipsy = require('./shipsy/shipsy.js')

module.exports = { EddMain,getEdd }

//Sample data
EddMain(509106, "CTOBC0001SKDS,CBONA0021SA,CBONA0020SA",1);

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
        

        const value = await Promise.all(skuArray.map(
            skuId => getEdd(cpin, skuId, qty),
        )).then((values) => {
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
        let eddResponse;
        eddResponse={...eddResponse,"cpin":cpin,"skuId":skuId,"qty":qty};
        console.log(eddResponse.skuId);
        let inventoryDetails =  await GetInventory(eddResponse.skuId);
            
            console.log("aksskakskaa");
            console.log(inventoryDetails);
            console.log(inventoryDetails.weight);

        if(inventoryDetails){
            eddResponse = {
                    ...eddResponse,
                    ...inventoryDetails,
                    "skuWt":qty * inventoryDetails.weight
                };
                
            }
            else {
                    return ({
                        "skuid": skuId,
                        "responseCode": "402",
                        "errorDiscription": "Product Not Found",
                        "error": "SkuId not Found"
                    });
                }
                let shipsy = await Shipsy.getIsAvailableInShipcity(cpin);
                
                if (shipsy!==false) {
                    console.log("going with shipsy ");
                    const b = await Shipsy.shipsyEDD(cpin, eddResponse, shipsy.shipsyCity);
                    console.log(b);
                    resolve(b);
                    }
                    else {
                        console.log("going with other courier ");
                        const b = await otherEDD.otherEDD(cpin, eddResponse);
                        console.log(b)
                        resolve(b);
                    }
        }catch(e){
            console.log(e);
        }
       });  
    }

