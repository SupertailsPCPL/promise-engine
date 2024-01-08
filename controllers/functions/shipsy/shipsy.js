const promiseEngineConnection = require('../../../dbPromiseEngine');
const getSBD = require('../Bufferdays/sbd');
const getDBD = require('../Bufferdays/dbd');
const getCutOff = require('../CutOff/cutoOff.js');
//const getGBD = require('../Bufferdays/gbd')
const getcPinData = require('../Cpindata/cpindata')
const utils = require("../Util/utils")
const otherEDD = require("../Othercouriers/othercourier.js");
const { cp } = require('fs');


const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

module.exports = { getIsAvailableInShipcity, shipsyEDD };

async function getIsAvailableInShipcity(cPin) {
    let promise = new Promise(async (resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM promiseEngine.shipsy_city WHERE cPin = ${cPin} order by priority`,
                async function (error, shipsyCityResults, fields) {
                    if (error) {
                        console.error(error);
                    }
                    console.log('ShipsyCity');
                    if (shipsyCityResults.length) {
                        console.log('ShipsyCity Found');
                        let dataRes = JSON.parse(JSON.stringify(shipsyCityResults));
                        console.log(dataRes);
                        resolve(dataRes);
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


async function shipsyEDD(cpin, eddResponse, shipsy, LDB, enable2HourDelivery) {
    console.log(cpin, eddResponse, shipsy, LDB);
    var state = "";
    var city = "";
    let EDD = 0;
    let SBD = 0;
    let DBD = 0;
    let whareHouseId = "";
    let GBD = 0;
    let qty = eddResponse.qty;

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
    console.log(eddResponse);
    if (shipsy == "Delhi") {
        whareHouseId = "WN-MDEL0002";
    }
    else if (shipsy == "Mumbai") {
        whareHouseId = "WN-MBHI0003";
    }
    else if (shipsy == "Bangalore") {
        whareHouseId = "WN-MBLR0001";
    }
    else {
        whareHouseId = shipsy;
    }
    console.log(eddResponse);
    console.log(eddResponse[`${whareHouseId}`], eddResponse.qty);
    console.log("eddResponse adadsasdda");
    eddResponse = { ...eddResponse, "warehouse": `${whareHouseId}` }
    console.log(eddResponse);
    if (eddResponse[`${whareHouseId}`] < eddResponse.qty) {
        return false;
    }
    console.log("SBD Data");
    console.log(Date());
    SBD = await getSBD(whareHouseId);
    console.log("SBD Data Completed");
    console.log(Date());
    eddResponse = { ...eddResponse, "SBD": `${SBD}` };
    console.log("eddResponse post sbd");



    var currentDate = new Date();
    // currentDate.setHours(currentDate.getHours());
    // currentDate.setMinutes(currentDate.getMinutes());

    currentDate.setHours(currentDate.getHours() + 5);
    currentDate.setMinutes(currentDate.getMinutes() + 30);
    let cutOffData = await getCutOff();
    // console.log("cutoff aj");
    // console.log(cutOffData);
    // console.log(eddResponse.warehouse);
    let SDDLBD = LDB ?? 0;
    console.log("as,dsalsalalslas");
    console.log(LDB);
    eddResponse = { ...eddResponse, "LDB": `${LDB}` };

    let cutOffTime = cutOffData[`shipsy-${eddResponse.warehouse}`]?.split(':') ?? [14, 0];
    SDDLBD = SDDLBD + cutOffData[`shipsy-${eddResponse.warehouse}-bufferdays`] ?? 0;

    // console.log("cutOffTime",cutOffTime);
    let cuttOfHour = parseInt(cutOffTime[0]);
    let cuttOfMin = parseInt(cutOffTime[1]);
    // console.log("cuttOfHour",cuttOfHour,"cuttOfMin",cuttOfMin);
    var cutoff = new Date();
    cutoff.setDate(currentDate.getDate());
    cutoff.setHours(cuttOfHour);
    cutoff.setMinutes(cuttOfMin)
    cutoff.setSeconds(0);
    eddResponse = { ...eddResponse, ...cutOffData }
    var timeLeftToCuttOff = (cutoff.getTime() - currentDate.getTime());
    timeLeftToCuttOff = Math.ceil(timeLeftToCuttOff / (1000 * 60));
    timeLeftToCuttOff = timeLeftToCuttOff < 0 ? 1440 - Math.abs(timeLeftToCuttOff) : timeLeftToCuttOff;

    eddResponse = { ...eddResponse, "currentDate": `${currentDate}`, "cutoff": `${cutoff}`, "timeLeftInMinutes": `${timeLeftToCuttOff}`, "EDD": `${EDD}` };
    console.log("eddResponse post all time events");

    var total = parseInt(SBD) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD) + parseInt(SDDLBD);
    console.log("adsladsldsalasdlasdladslasdllas");
    console.log("parseInt(SBD) , parseInt(DBD) , parseInt(GBD) , parseInt(EDD) , parseInt(SDDLBD)");
    console.log(parseInt(SBD), parseInt(DBD), parseInt(GBD), parseInt(EDD), parseInt(SDDLBD) ?? 0);
    let getByDate = "9 PM";
    let is2HourDelivery = false;
    if (eddResponse.warehouse == "PWH002" ) {
       let valid_postal_codes = [
            '560001', '560002', '560004', '560005', '560007', '560008', '560009', '560051',
            '560052', '560053', '560011', '560016', '560017', '560066', '560069', '560071',
            '560075', '560084', '560087', '560093', '560025', '560027', '560029', '560030',
            '560095', '560102', '560103', '560033', '560034', '560035', '560036', '560037',
            '560038', '560041', '560042', '560043', '560047', '560048'
        ]
        if(valid_postal_codes.includes(cpin)){
            var currentHour = currentDate.getHours();
            total = total;
            if (currentHour >= 8 && currentHour < 10) {
                getByDate = "12 PM";
                is2HourDelivery = true;
            } else if (currentHour >= 10 && currentHour < 12) {
                getByDate = "2 PM";
                is2HourDelivery = true;
            } else if (currentHour >= 12 && currentHour < 14) {
                getByDate = "4 PM";
                is2HourDelivery = true;
            } else if (currentHour >= 14 && currentHour < 16) {
                getByDate = "6 PM";
                is2HourDelivery = true;
            } else if (currentHour >= 16 && currentHour < 18) {
                getByDate = "8 PM";
                is2HourDelivery = true;
            }
            else if (currentHour >= 18 && currentHour < 24) {
                getByDate = "9 PM";
                total += 1;
                is2HourDelivery = false;
            }
            else {
                getByDate = "9 PM"
            }
        }
    }
    else 
    if (eddResponse.warehouse == "CWH-BLR001" ) {
        var currentHour = currentDate.getHours();
        total = total;
        if (currentHour >= 8 && currentHour < 10) {
            getByDate = "12 PM";
            is2HourDelivery = true;
        } else if (currentHour >= 10 && currentHour < 12) {
            getByDate = "2 PM";
            is2HourDelivery = true;
        } else if (currentHour >= 12 && currentHour < 14) {
            getByDate = "4 PM";
            is2HourDelivery = true;
        } else if (currentHour >= 14 && currentHour < 16) {
            getByDate = "6 PM";
            is2HourDelivery = true;
        } else if (currentHour >= 16 && currentHour < 18) {
            getByDate = "8 PM";
            is2HourDelivery = true;
        }
        else if (currentHour >= 18 && currentHour < 24) {
            getByDate = "9 PM";
            total += 1;
            is2HourDelivery = false;
        }
        else {
            getByDate = "9 PM"
        }
    } else {
        if (cutoff > currentDate) {
            total = total;
        }
        else {
            total += 1;
        }
    }
    date = currentDate.getDate();
    currentDate.setDate(date + total);
    if (eddResponse['shipsy-disable-Sunday-Delivery']) {
        console.log(eddResponse['shipsy-disable-Sunday-Delivery']);
        console.log("in is adsas Sunday");
        //Checking Whether current day is equal to ndd disable day
        let isDay = weekday[currentDate.getDay()] == eddResponse['shipsy-disable-Sunday-Delivery'];
        if (isDay) {
            console.log("in is day");
            console.log("total", total);
            total += 1;
            console.log("total", total);
            date = currentDate.getDate();
            currentDate.setDate(date + total);
        }
    }
    eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (utils.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : " "}`, "deliveryDay": `${(total) === 0 ? `${getByDate}, Today` : (total) === 1 ? `${getByDate}, Tomorrow` : weekday[currentDate.getDay()]}`, "FLEDD": 0, "LLEDD": 0, "courier": "shipsy", "is2HourDelivery": is2HourDelivery, "imageLike": `${utils.getImageLink(total)}` };
    console.log('yayyyy done');
    console.log(eddResponse);
    return eddResponse;
}