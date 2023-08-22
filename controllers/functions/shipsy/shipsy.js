const promiseEngineConnection = require('../../../dbpromiseengine');
const getSBD = require('../Bufferdays/sbd');
const getDBD = require('../Bufferdays/dbd');
const getCutOff = require('../CutOff/cutoOff.js');
//const getGBD = require('../Bufferdays/gbd')
const getcPinData = require('../Cpindata/cpindata')
const utils = require("../Util/utils")
const otherEDD = require("../Othercouriers/othercourier.js");
const GetInventory = require("../Inventory/inventory.js");



const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

module.exports = {getIsAvailableInShipcity, shipsyEDD};

async function getIsAvailableInShipcity(cPin) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            promiseEngineConnection.query(
                "SELECT shipsyCity FROM shipsy_city WHERE cPin = ?", cPin,
                async function (error, shipsyCityResults, fields) {
                    if (error) {
                        console.error(error);
                    }
                    console.log('ShipsyCity');
                    if (shipsyCityResults.length) {
                        console.log('ShipsyCity Found');
                        resolve(JSON.parse(JSON.stringify(shipsyCityResults))[0]);
                    } else {
                        console.log('ShipsyCity Not Found');
                        resolve(false);
                    }
                });
        }
        catch (e) {
            console.error(e);
            resolve(false);
        }
    });
    return await promise
}


async function shipsyEDD(cpin, eddResponse, shipsy) {
    var state = "";
    var city = "";
    let EDD = 0;
    let SBD = 0;
    let DBD = 0;
    let whareHouseId = "";
    let GBD = 0;
    let qty = eddResponse.qty;
    let p1InvQty = 0;


    console.log("DBD data");
    console.log(Date());
    DBD = await getDBD(cpin);
    console.log("DBD data completed");
    console.log(Date());

    console.log("Cpin data");
    console.log(Date());
    var cpinData = await getcPinData(cpin);
    console.log("Cpin data completed");
    console.log(Date());
    if (cpinData === false) {
        return ({
            "skuid": eddResponse.skuid,
            "responseCode": "401",
            "error": "Invalid Cpin",
            "errorDiscription": "Please enter a valid Pincode"
        })
    }
    userState = cpinData.state;
    state = cpinData.stateFullName;
    city = cpinData.city;
    eddResponse = { ...eddResponse, "state": `${state.toUpperCase()}`, "city": `${city.toUpperCase()}`, "DBD": `${DBD}`, "GBD": `${GBD}` };
    console.log("eddResponse post dbd gbd and cpin data");
    
    if (shipsy == "Delhi") {
        whareHouseId = "WN-MDEL0002";
    }
    else if (shipsy == "Mumbai") {
        whareHouseId = "WN-MBHI0003";
    }
    else if (shipsy == "Bangalore") {
        whareHouseId = "WN-MBLR0001";
    }
    console.log(eddResponse[`${whareHouseId}`],eddResponse.qty);
    console.log("eddResponse adadsasdda");
    eddResponse = {...eddResponse, "warehouse": `${whareHouseId}`}
    console.log(eddResponse);
    if(eddResponse[`${whareHouseId}`] < eddResponse.qty){
        const b = await otherEDD.otherEDD(cpin, eddResponse);
        return b;
    }
    //This is for handling shpsy simple and bundle skusss
    //what was before
    // if (eddResponse.Type === "SIMPLE") {
    //     p1InvQty = eddResponse[`${whareHouseId}`]
    //     console.log("Inv");
    //     console.log(p1InvQty);
    //     eddResponse = { ...eddResponse, "warehouse": `${whareHouseId}`, "InvQty": p1InvQty };
    //     console.log("skuData post whid and invqty");
    //     console.log(eddResponse);
    //     if (p1InvQty < qty) {
    //         console.log("going with other courier ");
    //         const b = await otherEDD.otherEDD(cpin, eddResponse);
    //         return b;
    //     }
    // }
    // else {
    //     console.log("hey enter bundle inv check");
    //     let eddv = JSON.parse(eddResponse.componentSkusData);
    //     for (let i = 0; i < eddv.length; i++) {
    //         let element = eddv[i];;
    //         console.log(element);
    //         console.log("Elelmetttttttt");
    //         console.log(element.skuid);
    //         console.log(element);
    //         let invQty = await GetInventory(element.skuid);
    //         p1InvQty = invQty[`${whareHouseId}`]
    //         eddResponse = { ...eddResponse, "warehouse": `${whareHouseId}` };
    //         console.log("skuData post whid and invqty");
    //         console.log(eddResponse);
    //         if (p1InvQty < element.qty) {
    //             console.log("going with other courier ");
    //             const b = await otherEDD(cpin, eddResponse);
    //             return b;
    //         }
    //     }
    // }

    console.log("SBD Data");
    console.log(Date());
    SBD = await getSBD(whareHouseId);
    console.log("SBD Data Completed");
    console.log(Date());
    eddResponse = { ...eddResponse, "SBD": `${SBD}` };
    console.log("eddResponse post sbd");
   


    var currentDate = new Date();
    currentDate.setHours(currentDate.getHours());
    currentDate.setMinutes(currentDate.getMinutes());

    // currentDate.setHours(currentDate.getHours() + 5);
    // currentDate.setMinutes(currentDate.getMinutes() + 30);
    let cutOffData = await getCutOff();
    // console.log("cutoff aj");
    // console.log(cutOffData);
    // console.log(eddResponse.warehouse);
    let cutOffTime = cutOffData[`shipsy-${eddResponse.warehouse}`].split(':');
    // console.log("cutOffTime",cutOffTime);
    let cuttOfHour = parseInt(cutOffTime[0]);
    let cuttOfMin = parseInt(cutOffTime[1]);
    // console.log("cuttOfHour",cuttOfHour,"cuttOfMin",cuttOfMin);
    var cutoff = new Date();
    cutoff.setDate(currentDate.getDate());
    cutoff.setHours(cuttOfHour);
    cutoff.setMinutes(cuttOfMin)
    cutoff.setSeconds(0);
    eddResponse = { ...eddResponse, ...cutOffData}
    var timeLeftToCuttOff = (cutoff.getTime() - currentDate.getTime());
    timeLeftToCuttOff = Math.ceil(timeLeftToCuttOff / (1000 * 60));
    timeLeftToCuttOff = timeLeftToCuttOff < 0 ? 1440 - Math.abs(timeLeftToCuttOff) : timeLeftToCuttOff;

    eddResponse = { ...eddResponse, "currentDate": `${currentDate}`, "cutoff": `${cutoff}`, "timeLeftInMinutes": `${timeLeftToCuttOff}`, "EDD": `${EDD}`};
    console.log("eddResponse post all time events");
   
    var total = parseInt(SBD) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD);
    
    if (cutoff > currentDate) {
        total = total;
    }
    else {
        total += 1;
    }
    // if(eddResponse.warehouse == "WN-MBHI0003"){
    //     total +=1
    // }
    date = currentDate.getDate();
    currentDate.setDate(date + total);
     if(eddResponse['shipsy-disable-Sunday-Delivery'])
     {
        console.log(eddResponse['shipsy-disable-Sunday-Delivery']);
        console.log("in is adsas Sunday");
        //Checking Whether current day is equal to ndd disable day
        let isDay = weekday[currentDate.getDay()] == eddResponse['shipsy-disable-Sunday-Delivery'];
     if(isDay){
        console.log("in is day");
        console.log("total",total);
        total += 1;
        console.log("total",total);
        date = currentDate.getDate();
        currentDate.setDate(date + total);
     }}
    eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (utils.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : "between 4PM - 10PM"}`, "deliveryDay": `${(total) === 0 ? "Today" : (total) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`, "FLEDD": 0, "LLEDD": 0, "courier": "shipsy", "imageLike": `${utils.getImageLink(total)}` };
    console.log('yayyyy done');
    console.log(eddResponse);
    return eddResponse;
}