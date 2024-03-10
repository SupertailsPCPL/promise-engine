const request = require("request");
const GetInventory = require("./Inventory/inventory.js");
const otherEDD = require("./Othercouriers/othercourier.js")
const Shipsy = require('./shipsy/shipsy.js')
const util = require("./Util/utils.js");
//const dropShipEDD = require('./DropshipEdd/dropship.js');
const getCutOff = require('./CutOff/cutoOff.js');

module.exports = { EddMaincart, getEdd }

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//Sample data

async function EddMaincart(cpin, skus, qty) {
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
        console.log("skuArray");
        console.log(skuArray);
        console.log(qty);
        let qtyArray = qty.toString().split(',');
        console.log(qtyArray);


        if (skuArray.length !== qtyArray.length) {
            return ({
                "skuId": "Error",
                "responseCode": "407",
                "errorDiscription": "SERVER ERROR",
                "error": "Number of skus and qty does not match"
            })
        } else {
            let final = [];
            let shipsyWeight = 0;
            let NDDItemsWeight = 0;
            let shipsyItems = [];
            let NDDItems = [];
            let shipsyWarehouse;
            let NDDItemsWarehouse;
            let whGroups = {
                'WN-MBLR0001': { group: [], wt: 0 },
                'WN-MDEL0002': { group: [], wt: 0 },
                'WN-MBHI0003': { group: [], wt: 0 },
                'WHBLRDSBTM': { group: [], wt: 0 },
                'WN-DRKOL01': { group: [], wt: 0 },
                'PWH001': { group: [], wt: 0 },
                'BLRDSKN1': { group: [], wt: 0 },
                'WHDSDEL01': { group: [], wt: 0 },
                'WN-BLR-0002': { group: [], wt: 0 },
                'PWH002': { group: [], wt: 0 },
                'WH004': { group: [], wt: 0 },
                'WH005': { group: [], wt: 0 },
                'WH006': { group: [], wt: 0 },
                'WH007': { group: [], wt: 0 },
                'WH008': { group: [], wt: 0 },
                'WH009': { group: [], wt: 0 },
                'WH010': { group: [], wt: 0 },
                'WH011': { group: [], wt: 0 },
                'WH012': { group: [], wt: 0 },
                'WH013': { group: [], wt: 0 },
                'WH014': { group: [], wt: 0 },
                'WH015': { group: [], wt: 0 },
                'WH016': { group: [], wt: 0 },
                'WH017': { group: [], wt: 0 },
                'WH018': { group: [], wt: 0 },
                'CWH-BLR001': { group: [], wt: 0 },
                'WHHYD001': { group: [], wt: 0 },
                'WH019': { group: [], wt: 0 },
                'WH020': { group: [], wt: 0 },
                'WH021': { group: [], wt: 0 },
                'WH022': { group: [], wt: 0 },
                'WH023': { group: [], wt: 0 },
                'WH024': { group: [], wt: 0 },
                'WH025': { group: [], wt: 0 }
            };

            console.log("before");

            const value = await Promise.all(skuArray.map(
                (skuId, index) => getEdd(cpin, skuId, qtyArray[index]))).then((values) => {
                    return (values);
                });

            console.log(value);
            console.log("loggggggggggggggggg");

            for (let i = 0; i < value.length; i++) {
                const a = value[i];
                console.log(a);

                if (a.hasOwnProperty('courier')) {
                    if (a.courier === "shipsy" && a.warehouse == "CWH-BLR001") {
                        final.push(a);
                    } else if (a.courier === "shipsy") {
                        console.log("shippppp");
                        shipsyItems.push(a);
                        shipsyWarehouse = a.warehouse;
                        shipsyWeight += a.skuWt;
                    } 
                    else if (a.courier === "NDD") {
                        console.log("NDD");
                        NDDItems.push(a);
                        NDDItemsWarehouse = a.warehouse;
                        NDDItemsWeight += a.skuWt;
                    } 
                    else {
                        const warehouseInfo = whGroups[a.warehouse];
                        if (warehouseInfo) {
                            warehouseInfo.group.push(a);
                            warehouseInfo.wt += a.skuWt;
                        } else {
                            console.log("Invalid warehouse:", a.warehouse);
                        }
                    }
                } else {
                    console.log("courrrrr");
                    final.push(a);
                }
            }

            console.log(final);
            console.log('ooooooo');
            console.log(whGroups);
            console.log("shipsyWeight");
            console.log(shipsyWeight);
            console.log(shipsyWarehouse);
            if (shipsyWeight !== 0 && shipsyWeight > 20) {
                // let group = whGroups[shipsyWarehouse].group;
                // let wtKey = shipsyWeight;
                // console.log("Non Shipsy")
                // console.log(group);   
                for (let i = 0; i < shipsyItems.length; i++) {
                    console.log("haaa"); 
                    let element = shipsyItems[i];
                    // console.log(element);
                    element.courier = "others";
                    console.log("element");
                    console.log(element);
                    element = {...element, "combinedWt":shipsyWeight};
                    console.log("shipsyWeight");
                    console.log(shipsyWeight,element);
                    console.log(shipsyWarehouse);
                    whGroups[`${shipsyWarehouse}`].group = [...whGroups[`${shipsyWarehouse}`].group,element];
                    whGroups[`${shipsyWarehouse}`].wt = shipsyWeight;
                    // const b = await otherEDD.otherEDD(shipsyItems[i].cpin, element);
                    // element = {...element, "combinedWt":shipsyWeight};
                    // final.push(element);
                }
            }
            else {
                for (let i = 0; i < shipsyItems.length; i++) {
                    let element = shipsyItems[i];
                    element = {...element, "combinedWt":shipsyWeight}
                    final.push(element);
                }
            }
            if (NDDItemsWeight !== 0 && NDDItemsWeight > 20) {
                // let group = whGroups[shipsyWarehouse].group;
                // let wtKey = NDDItemsWeight;
                // console.log("Non Shipsy")
                // console.log(group);   
                for (let i = 0; i < NDDItems.length; i++) {
                    console.log("haaa"); 
                    let element = NDDItems[i];
                    // console.log(element);
                    element.courier = "others";
                    console.log("element");
                    console.log(element);
                    element = {...element, "combinedWt":NDDItemsWeight};
                    console.log("NDDItemsWeight");
                    console.log(NDDItemsWeight,element);
                    whGroups[`${NDDItemsWarehouse}`].group = [...whGroups[`${NDDItemsWarehouse}`].group,element];
                    whGroups[`${NDDItemsWarehouse}`].wt = NDDItemsWeight;
                    // const b = await otherEDD.otherEDD(NDDItems[i].cpin, element);
                    // element = {...element, "combinedWt":NDDItemsWeight};
                    // final.push(element);
                }
            }
            else {
                for (let i = 0; i < NDDItems.length; i++) {
                    let element = NDDItems[i];
                    element = {...element, "combinedWt":NDDItemsWeight}
                    final.push(element);
                }
            }
            for (const warehouseId in whGroups) {
                const group = whGroups[warehouseId].group;
                for (let i = 0; i < group.length; i++) {
                    const currentDate = new Date();
                    // currentDate.setHours(currentDate.getHours());
                    // currentDate.setMinutes(currentDate.getMinutes());
                    currentDate.setHours(currentDate.getHours() + 5);
                    currentDate.setMinutes(currentDate.getMinutes() + 30);
                    let wh = group[i].warehouse;
                    const courierData = await otherEDD.getCourier(group[i].cpin, whGroups[warehouseId].wt); // group[i].warehouse not required
                    let daycount = parseInt(courierData[`${wh}`]) + parseInt(group[i].SBD) + parseInt(group[i].DBD);
                    group[i].EDD = parseInt(courierData[`${wh}`]);
                    console.log("EDD Daataa");
                    console.log(group[i].SBD);
                    console.log(courierData[`${wh}`]); 
                    console.log("day count");
                    console.log(daycount);
                    //parseInt(courierData.EDD)
                    let cutOffData = await getCutOff();
                    console.log("cutoff");
                    console.log(cutOffData);
                    console.log(group[i].warehouse);

                    let cutOffTime ;
                    if (group[i].courier == "others") {
                         cutOffTime = cutOffData[`others-${group[i].warehouse}`]?.split(':') ?? [13,0];
                    }
                    else{
                        cutOffTime = cutOffData[`ndd-${group[i].warehouse}`]?.split(':') ?? [13,0];
                    }
                    console.log("cutOffTime",cutOffTime);
                    let cuttOfHour = parseInt(cutOffTime[0]);
                    let cuttOfMin = parseInt(cutOffTime[1]);
                    console.log("cuttOfHour",cuttOfHour,"cuttOfMin",cuttOfMin);
                    var cutoff = new Date();
                    cutoff.setDate(currentDate.getDate());
                    cutoff.setHours(cuttOfHour);    
                    cutoff.setMinutes(cuttOfMin)
                    cutoff.setSeconds(0);
                    console.log("final cutt of time",cutoff);
                    if (cutoff > currentDate) {
                        daycount = daycount;
                    }
                    else{
                        daycount +=1;
                    }

                    group[i].dayCount = daycount;
                    group[i].combinedWt = whGroups[warehouseId].wt;
                    const date = currentDate.getDate();
                    currentDate.setDate(date + daycount);
                    group[i].deliveryDate = `${daycount > 1 ? util.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()] : " "}`;
                    group[i].deliveryDay = `${(daycount) === 0 ? "9 PM, Today" : (daycount) === 1 ? "9 PM, Tomorrow" : weekday[currentDate.getDay()]}`;
                    final.push(group[i]);

                }
            }
            console.log("final");
            console.log(final);
            return final;
        }
    }
    catch (e) {
        console.log(e);
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
            let inventoryDetails = await GetInventory(eddResponse.skuId);
            console.log("sad kadks ka kakk skasdk");
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

            let shipsy = await Shipsy.getIsAvailableInShipcity(cpin);

            if (shipsy !== false) {
                console.log("going with shipsy ");
                 let b ;
                for (let i = 0; i < shipsy.length; i++) {
                    const element = shipsy[i];   
                    console.log("elementelement",element);
                         b = await Shipsy.shipsyEDD(cpin, eddResponse, element.shipsyCity,element?.LBD,element?.is2HourDelivery);
                         if(b){
                            // console.log("daldldladldlal",b);
                             break;
                         }
                }
                console.log("final respomseeeee");
                console.log(b);
                if(b){
                    // console.log("dajskdkdasadsdasooso");
                    resolve(b);
                }
            else {
                console.log("going with other courier ");
                console.log(eddResponse)
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
