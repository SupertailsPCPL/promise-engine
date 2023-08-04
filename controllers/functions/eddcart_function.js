const { get } = require("request");
const GetInventory = require("../controllers/functions/Inventory/inventory.js");
const otherEDD = require("../controllers/functions/Othercouriers/othercourier.js")
const Shipsy = require('../controllers/functions/shipsy/shipsy.js')
const utils = require("../controllers/functions/Util/utils.js")

module.exports = { EddMaincart,getEdd }


const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


//Sample data
EddMaincart(560077, "CBONA0021SA,CBONA0020SA,CBONA0019SA", "3,2,3");
//this is the start point of edd - Main Function
async function EddMaincart(cpin,skus,qty){
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
        console.log("skuArray");
        console.log(skuArray);

        let qtyArray = qty.split(',');
        console.log(qtyArray);
        

        if(skuArray.length !== qtyArray.length){
            return ({
                "skuId": "Error",
                "responseCode": "407",
                "errorDiscription": "SERVER ERROR",
                "error": "Number of skus and qty does not match"
            })
        }else{
            
            let whGroup1 = [];
            let whGroup2 = [];
            let whGroup3 = [];
            let final = [];
            let whGroup1Wt = 0;
            let whGroup2Wt = 0;
            let whGroup3Wt = 0;
            let shipsyWeight = 0;
            let shipsyItems = [];
            let shipsyWarehouse;

            console.log("before");
            
            const value = await Promise.all(skuArray.map(
                (skuId,index) => getEdd(cpin, skuId, qtyArray[index]),)).then((values) => {
                return (values);
            });
            console.log(value);
            console.log("loggggggggggggggggg");
            for (let i = 0; i < value.length; i++) {
                a = value[i];
                console.log(a);
                if (a.hasOwnProperty('courier')) {
                    if (a.courier === "shipsy") {
                        shipsyItems.push(a);
                        shipsyWeight +=a.skuWt;
                        shipsyWarehouse = a.warehouse;

                    }
                    else {
                        if (a.warehouse === 'WN-MBLR0001') {
                            whGroup1Wt += a.skuWt;
                            whGroup1.push(a);
                        }
                        else if (a.warehouse === 'WN-MDEL0002') {
                            whGroup3Wt += a.skuWt;
                            whGroup3.push(a);
                        }
                        else if (a.warehouse === 'WN-MBHI0003') {
                            whGroup2Wt += a.skuWt;
                            whGroup2.push(a);
                        }
                    }
                }
                else {
                    final.push(a);
                }
            }
            console.log('ooooooo')
            console.log(whGroup1);
            console.log(whGroup2);
            console.log(whGroup3);
            console.log(shipsyItems);

            if((shipsyWeight/1000) > 20){
                if (shipsyWarehouse === 'WN-MBLR0001') {
                for (let i = 0; i < shipsyItems.length; i++) {
                    const element = shipsyItems[i];
                    element.courier = "others";
                    whGroup1.push(element);
                    whGroup1Wt += element.weight;
                   }

                }
                else if (shipsyWarehouse === 'WN-MDEL0002') {
                for (let i = 0; i < shipsyItems.length; i++) {
                    const element = shipsyItems[i];
                    element.courier = "others";
                    whGroup2.push(element);
                    whGroup2Wt += element.weight;
                   }
                }
                else if (shipsyWarehouse === 'WN-MBHI0003') {
                for (let i = 0; i < shipsyItems.length; i++) {
                    const element = shipsyItems[i];
                    element.courier = "others";
                    whGroup3.push(element);
                    whGroup3Wt += element.weight;
                   }
                }
            }
            else{
                for (let i = 0; i < shipsyItems.length; i++) {
                    let element = shipsyItems[i];
                    element = {...element,"combinedWt":shipsyWeight}
                    final.push(element);
                   }
            }
            console.log("final output");
            console.log(final);
            return (final)
        }
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
        let inventoryDetails =  await GetInventory(eddResponse.skuId);
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
                    resolve(b);
                    }
                    else {
                        console.log("going with other courier ");
                        console.log(eddResponse)
                        const b = await otherEDD.otherEDD(cpin, eddResponse);
                        resolve(b);
                    }
        }catch(e){
            console.log(e);
        }
       });  
    }


    //cart EDD

