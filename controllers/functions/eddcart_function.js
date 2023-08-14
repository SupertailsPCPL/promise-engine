const { get } = require("request");
const GetInventory = require("./Inventory/inventory.js");
const otherEDD = require("./Othercouriers/othercourier.js")
const Shipsy = require('./shipsy/shipsy.js')
const util = require("./Util/utils.js");
//const dropShipEDD = require('./DropshipEdd/dropship.js');

module.exports = { EddMaincart, getEdd }

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

//Sample data
//EddMaincart(583279, "CCOCO0009MP,CCOCO0014TR", "1,2");
//this is the start point of eddcart - Main Function
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
            let shipsyItems = [];
            let shipsyWarehouse;
            let whGroups = {
                'WN-MBLR0001': { group: [], wt: 0 },
                'WN-MDEL0002': { group: [], wt: 0 },
                'WN-MBHI0003': { group: [], wt: 0 },
                'WN-DRKOL01': { group: [], wt: 0 },
                'PWH001': { group: [], wt: 0 },
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
                'WH018': { group: [], wt: 0 }
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
                    if (a.courier === "shipsy") {
                        shipsyItems.push(a);
                        shipsyWarehouse = a.warehouse;
                        shipsyWeight += a.skuWt;
                    } else {
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

            if ((shipsyWeight !== 0 && shipsyWeight / 1000) > 20) {
                const group = whGroups[shipsyWarehouse].group;
                const wtKey = whGroups[shipsyWarehouse].wt;

                for (let i = 0; i < shipsyItems.length; i++) {
                    const element = shipsyItems[i];
                    element.courier = "others";
                    group.push(element);
                    wtKey += element.weight;
                }
            } else {
                for (let i = 0; i < shipsyItems.length; i++) {
                    const element = shipsyItems[i];
                    element.combinedWt = shipsyWeight;
                    final.push(element);
                }
            }

            for (const warehouseId in whGroups) {
                const group = whGroups[warehouseId].group;
                for (let i = 0; i < group.length; i++) {
                    const currentDate = new Date();
                    currentDate.setHours(currentDate.getHours());
                    currentDate.setMinutes(currentDate.getMinutes());
                    //currentDate.setHours(currentDate.getHours() + 5);
                    //currentDate.setMinutes(currentDate.getMinutes() + 30);
                    let wh = group[i].warehouse;
                    const courierData = await otherEDD.getCourier(group[i].cpin, whGroups[warehouseId].wt); // group[i].warehouse not required
                    let daycount = parseInt(courierData[`${wh}`]); + parseInt(group[i].SBD) + parseInt(group[i].DBD);
                    console.log("EDD Daataa");
                    console.log(courierData[`${wh}`]); 
                    //parseInt(courierData.EDD)
                    const cutoff = new Date();
                    cutoff.setDate(currentDate.getDate());

                    if (group[i].warehouse === "WN-MBHI0003") {
                        cutoff.setHours(14);
                    } else {
                        cutoff.setHours(15);
                    }

                    cutoff.setMinutes(0);
                    cutoff.setSeconds(0);

                    if (cutoff < currentDate) {
                        daycount = daycount + 1;
                    }

                    group[i].dayCount = daycount;
                    group[i].combinedWt = whGroups[warehouseId].wt;
                    const date = currentDate.getDate();
                    currentDate.setDate(date + daycount);
                    group[i].deliveryDate = `${daycount > 1 ? util.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()] : "between 4PM - 10PM"}`;
                    group[i].deliveryDay = `${(daycount) === 0 ? "Today" : (daycount) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`;
                    final.push(group[i]);

                }
            }
            console.log("final");
            console.log(final);
            return final;
        }
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
            let inventoryDetails = await GetInventory(eddResponse.skuId);
            if (inventoryDetails) {
                eddResponse = {
                    ...eddResponse,
                    ...inventoryDetails,
                    "skuWt": qty * inventoryDetails.weight
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

            if (shipsy !== false) {
                console.log("going with shipsy ");
                const b = await Shipsy.shipsyEDD(cpin, eddResponse, shipsy.shipsyCity);
                resolve(b);
            }
            // else if(eddResponse.skuId.includes('DS')){
                    //     console.log("going with dropShip");
                    //     const b = await dropShipEDD(cpin, eddResponse);
                    //     return b;
                    // }
            else {
                console.log("going with other courier ");
                console.log(eddResponse)
                const b = await otherEDD.otherEDD(cpin, eddResponse);
                resolve(b);
            }
        } catch (e) {
            console.log(e);
        }
    });
}
