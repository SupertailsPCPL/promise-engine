const { get } = require("request");
const GetInventory = require("./Inventory/inventory.js");
const otherEDD = require("./Othercouriers/othercourier.js")
const Shipsy = require('./shipsy/shipsy.js')
const util = require("./Util/utils.js")

module.exports = { EddMaincart,getEdd }

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//Sample data
EddMaincart(509106, "CBONA0021SA,CBONA0019SA,CBONA0012SA", "2,2,1");
//this is the start point of eddcart - Main Function
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
                (skuId,index) => getEdd(cpin, skuId, qtyArray[index]))).then((values) => {
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
                        shipsyWarehouse=a.warehouse;
                        shipsyWeight +=a.skuWt;
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
                    console.log("courrrrr");
                    final.push(a);
                }
            }
            console.log(final)
            console.log('ooooooo')
            console.log(whGroup1);
            console.log(whGroup2);
            console.log(whGroup3);
            console.log(shipsyItems);
            console.log(shipsyWeight);
            console.log(shipsyWarehouse);

            if((shipsyWeight!== 0 && shipsyWeight/1000) > 20){
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
                    element = {...element, "combinedWt":shipsyWeight}
                    final.push(element);
                   }
            }
        
        if (whGroup1.length) {
            console.log(whGroup1[0].cpin, whGroup1[0].warehouse, whGroup1Wt);
            for (let i = 0; i < whGroup1.length; i++) {
                var currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 5);
                currentDate.setMinutes(currentDate.getMinutes() + 30);
                let courierData = await otherEDD.getCourier(whGroup1[i].cpin, whGroup1[i].warehouse, whGroup1Wt);
                var daycount = parseInt(courierData.EDD)+ parseInt(whGroup1[i].SBD) + parseInt(whGroup1[i].DBD);
                var cutoff = new Date();
                cutoff.setDate(currentDate.getDate())
                if(whGroup1[i].warehouse == "WN-MBHI0003" )
                {
                    cutoff.setHours(14);
                }       
                else{
                    
                    cutoff.setHours(15);
                }
                cutoff.setMinutes(0);
                cutoff.setSeconds(0);
                if (cutoff < currentDate) {
                    daycount = daycount + 1;
                }
                whGroup1[i].dayCount = daycount;
                whGroup1[i].combinedWt = whGroup1Wt;
                date = currentDate.getDate();
                currentDate.setDate(date + daycount);
                whGroup1[i].deliveryDate = `${daycount > 1 ? util.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()] : "between 4PM - 10PM"}`;
                whGroup1[i].deliveryDay = `${(daycount) === 0 ? "Today" : (daycount) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`;
                final.push(whGroup1[i]);
            }
        }
        if (whGroup2.length) {
            for (let i = 0; i < whGroup2.length; i++) {
                var currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 5);
                currentDate.setMinutes(currentDate.getMinutes() + 30);
                let courierData = await otherEDD.getCourier( whGroup2[i].cpin, whGroup2[i].warehouse ,whGroup2Wt);
                whGroup2[i].FLEDD = parseInt(courierData);
                var daycount = parseInt(courierData.EDD)+  parseInt(whGroup2[i].SBD) + parseInt(whGroup2[i].DBD);
                
                var cutoff = new Date();
                cutoff.setDate(currentDate.getDate());
                if(whGroup2[i].warehouse == "WN-MBHI0003" )
                {
                    cutoff.setHours(14);
                }       
                else{
                    
                    cutoff.setHours(15);
                }
                cutoff.setMinutes(0);
                cutoff.setSeconds(0);
                if (cutoff < currentDate) {
                    daycount = daycount + 1;
                }
                whGroup2[i].dayCount = daycount;
                whGroup2[i].combinedWt = whGroup2Wt;
                date = currentDate.getDate();
                currentDate.setDate(date + daycount);
                whGroup2[i].deliveryDate = `${daycount > 1 ? util.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()] : "between 4PM - 10PM"}`;
                whGroup2[i].deliveryDay = `${(daycount) === 0 ? "Today" : (daycount) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`;
                final.push(whGroup2[i]);
            }
        }
        if (whGroup3.length) {
            for (let i = 0; i < whGroup3.length; i++) {
                var currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 5);
                currentDate.setMinutes(currentDate.getMinutes() + 30);
                let courierData = await otherEDD.getCourier( whGroup3[i].cpin, whGroup3[i].warehouse, whGroup3Wt);
                var daycount = parseInt(courierData.EDD)+ parseInt(whGroup3[i].SBD)+ parseInt(whGroup3[i].DBD);
                

                var cutoff = new Date();
                cutoff.setDate(currentDate.getDate());
                if(whGroup3[i].warehouse == "WN-MBHI0003" )
                {
                    cutoff.setHours(14);
                }       
                else{
                    
                    cutoff.setHours(15);
                }
                cutoff.setMinutes(0);
                cutoff.setSeconds(0);
                if (cutoff < currentDate) {
                    daycount = daycount + 1;
                }
                whGroup3[i].dayCount = daycount;
                whGroup3[i].combinedWt = whGroup3Wt;
                date = currentDate.getDate();
                currentDate.setDate(date + daycount);
                whGroup3[i].deliveryDate = `${daycount > 1 ? util.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()] : "between 4PM - 10PM"}`;
                whGroup3[i].deliveryDay = `${(daycount) === 0 ? "Today" : (daycount) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`;
                final.push(whGroup3[i]);
            }
        }
        console.log("final")
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
