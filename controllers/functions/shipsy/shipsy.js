const promiseEngineConnection = require('../../../dbPromiseEngine');
const getSBD = require('../Bufferdays/sbd');
const getDBD = require('../Bufferdays/dbd');
const getCutOff = require('../CutOff/cutoOff.js');
//const getGBD = require('../Bufferdays/gbd')
const getcPinData = require('../Cpindata/cpindata')
const utils = require("../Util/utils")
const otherEDD = require("../Othercouriers/othercourier.js");


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
                    // console.log('ShipsyCity');
                    if (shipsyCityResults.length) {
                        // console.log('ShipsyCity Found');
                        let dataRes = JSON.parse(JSON.stringify(shipsyCityResults));
                        // console.log(dataRes);
                        resolve(dataRes);
                    } else {
                        // console.log('ShipsyCity Not Found');
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


async function shipsyEDD(cpin, eddResponse, shipsy, LDB, enable2HourDelivery,deliveryMins) {
    console.log(cpin, eddResponse, shipsy, LDB);
    var state = "";
    var city = "";
    let EDD = 0;
    let SBD = 0;
    let DBD = 0;
    let whareHouseId = "";
    let GBD = 0;
    let qty = eddResponse.qty;

    // console.log("DBD data");
    // console.log(Date());
    DBD = await getDBD(cpin);
    // console.log("DBD data completed");
    // console.log(Date());

    // console.log("Cpin data");
    // console.log(Date());
    var cpinData = await getcPinData(cpin);
    // console.log("Cpin data completed");
    // console.log(Date());
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
    // console.log("eddResponse post dbd gbd and cpin data");
    // console.log(eddResponse);
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
    // console.log(eddResponse);
    // console.log(eddResponse[`${whareHouseId}`], eddResponse.qty);
    // console.log("eddResponse adadsasdda");
    eddResponse = { ...eddResponse, "warehouse": `${whareHouseId}` }
    // console.log(eddResponse);
    if (eddResponse[`${whareHouseId}`] < eddResponse.qty) {
        return false;
    }
    // console.log("SBD Data");
    // console.log(Date());
    SBD = await getSBD(whareHouseId);
    // console.log("SBD Data Completed");
    // console.log(Date());
    eddResponse = { ...eddResponse, "SBD": `${SBD}` };
    // console.log("eddResponse post sbd");



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
    // console.log("as,dsalsalalslas");
    // console.log(LDB);
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
    // console.log("eddResponse post all time events");

    var total = parseInt(SBD) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD) + parseInt(SDDLBD);
    // console.log("adsladsldsalasdlasdladslasdllas");
    // console.log("parseInt(SBD) , parseInt(DBD) , parseInt(GBD) , parseInt(EDD) , parseInt(SDDLBD)");
    // console.log(parseInt(SBD), parseInt(DBD), parseInt(GBD), parseInt(EDD), parseInt(SDDLBD) ?? 0);
    let getByDate = "9 PM";
    let is2HourDelivery = false;
    let is120Min = false;
    let deliveryTime= new Date();;
    deliveryTime.setHours(currentDate.getHours() + 5);
    deliveryTime.setMinutes(currentDate.getMinutes() + 30);
    deliveryTime.setMilliseconds(0)
    deliveryTime.setSeconds(0)
    if (enable2HourDelivery == "SLOTTED") {
        // console.log("enable2HourDelivery");
        // console.log(cpin,enable2HourDelivery);
        var currentHour = currentDate.getHours();
        total = total;
        let rollingEndTime = eddResponse[`2HourDelivery-${eddResponse.warehouse}-end-time`]?.split(':')[0] ?? 18;

        if (currentHour >= 8 && currentHour < 10) {
            getByDate = "12 PM";
            is2HourDelivery = true;
            deliveryTime.setHours(12);
            deliveryTime.setMinutes(0);
        } else if (currentHour >= 10 && currentHour < 12) {
            getByDate = "2 PM";
            is2HourDelivery = true;
            deliveryTime.setHours(14);
            deliveryTime.setMinutes(0);
        } else if (currentHour >= 12 && currentHour < 14) {
            getByDate = "4 PM";
            is2HourDelivery = true;
            deliveryTime.setHours(16);
            deliveryTime.setMinutes(0);
        } else if (currentHour >= 14 && currentHour < 16) {
            getByDate = "6 PM";
            is2HourDelivery = true;
            deliveryTime.setHours(18);
            deliveryTime.setMinutes(0);
        } else if (currentHour >= 16 && currentHour <  rollingEndTime) {
            getByDate = "8 PM";
            is2HourDelivery = true;
            deliveryTime.setHours(20);
            deliveryTime.setMinutes(0);
        }
        else if (currentHour >= rollingEndTime && currentHour < 24) {
            getByDate = "9 PM";
            total += 1;
            is2HourDelivery = false;
            deliveryTime.setDate(deliveryTime.getDate()+1);
            deliveryTime.setHours(21);
            deliveryTime.setMinutes(0);
        }
        else {
            getByDate = "9 PM";
            deliveryTime.setHours(21);
            deliveryTime.setMinutes(0);
        }
    } 
    else if (enable2HourDelivery == "ROLLING") {
        // console.log("enable2HourDelivery");
        // console.log(cpin,enable2HourDelivery);
        var currentHour = currentDate.getHours();
        var currentMinute = currentDate.getMinutes();
        total = total;
        let rollingStartTime = eddResponse[`2HourDelivery-${eddResponse.warehouse}-start-time`]?.split(':')[0] ?? 8;
        // let rollingStartTimeMinute = eddResponse[`2HourDelivery-${eddResponse.warehouse}-start-time`]?.split(':')[1] ?? 0;
        let rollingEndTime = eddResponse[`2HourDelivery-${eddResponse.warehouse}-end-time`]?.split(':')[0] ?? 17;
        // let rollingEndTimeMinute = eddResponse[`2HourDelivery-${eddResponse.warehouse}-end-time`]?.split(':')[1] ?? 0;
        // console.log(currentHour,"currentHour");
        // console.log(currentMinute,"currentMinute");
        // console.log(rollingStartTime,"rollingStartTime");
        // console.log(rollingStartTimeMinute,"rollingStartTimeMinute");
        // console.log(rollingEndTime,"rollingEndTime");
        // console.log(rollingEndTimeMinute,"rollingEndTimeMinute");
        // console.log(currentHour >= rollingStartTime);
        if (currentHour >= rollingStartTime && currentHour < rollingEndTime) {
            let timeChange = currentHour+ (deliveryMins/60);
            let finalTime =currentMinute >0 ? timeChange+1 : timeChange;
            deliveryTime.setHours(finalTime);
            deliveryTime.setMinutes(0);
            getByDate = `${convertTo12Hour(currentMinute >0 ? timeChange+1 : timeChange)} ${(currentMinute >0 ? timeChange+1 : timeChange) >= 12 ? "PM" : "AM"}`;
            is2HourDelivery = true;
            is120Min = true;
        }
        else if (currentHour >= rollingEndTime && currentHour < 24) {
            getByDate = "3 PM";
            total += 1;
            deliveryTime.setHours(15);
            deliveryTime.setMinutes(0);
            deliveryTime.setDate(deliveryTime.getDate()+1);
        }
        else {
            getByDate = "3 PM";
            deliveryTime.setHours(15);
            deliveryTime.setMinutes(0);
        }
        // console.log(getByDate);
    } 
    else 
    {
        if (cutoff > currentDate) {
            deliveryTime.setHours(21);
            deliveryTime.setMinutes(0);
            total = total;
        }
        else {
            deliveryTime.setHours(21);
            deliveryTime.setMinutes(0);
            deliveryTime.setDate(deliveryTime.getDate()+1);
            total += 1;
        }
    }
    date = currentDate.getDate();
    currentDate.setDate(date + total);
    if (eddResponse['shipsy-disable-Sunday-Delivery']) {
        // console.log(eddResponse['shipsy-disable-Sunday-Delivery']);
        // console.log("in is adsas Sunday");
        //Checking Whether current day is equal to ndd disable day
        let isDay = weekday[currentDate.getDay()] == eddResponse['shipsy-disable-Sunday-Delivery'];
        if (isDay) {
            // console.log("in is day");
            // console.log("total", total);
            total += 1;
            // console.log("total", total);
            date = currentDate.getDate();
            currentDate.setDate(date + 1);
            deliveryTime.setDate(deliveryTime.getDate()+2);
            deliveryTime.setHours(15);
            deliveryTime.setMinutes(0);
        }
    }
    // const currentDayy = weekday[currentDate.getDay()];
    // if(currentDayy == "Fri"){
    //         total += 1;
    //        date = currentDate.getDate();
    //        currentDate.setDate(date + 1);
    // }
    eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (utils.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : " "}`, "deliveryDay": `${(total) === 0 ? `${getByDate}, Today` : (total) === 1 ? `${getByDate}, Tomorrow` : weekday[currentDate.getDay()]}`, "FLEDD": 0, "LLEDD": 0, "courier": "shipsy", "is2HourDelivery": is2HourDelivery, "imageLike": `${utils.getImageLink(total)}` };
    let message = `${is120Min ? 'in':'by'} ${is120Min ? `${deliveryMins} mins`: eddResponse?.deliveryDay }${eddResponse?.deliveryDate?.trim()?.length>0?", ":""}${eddResponse?.deliveryDate?.trim()}`
    let AppMessage = `${is120Min ? `${deliveryMins} mins`: eddResponse?.deliveryDay }${eddResponse?.deliveryDate?.trim()?.length>0?", ":""}${eddResponse?.deliveryDate?.trim()}`
    let AppMessageAdverb = `${is120Min ? 'in':'by'}`
    eddResponse = { ...eddResponse,"message":message,"appMessage":AppMessage,"appMessageAdverb":AppMessageAdverb,"deliveryTime":deliveryTime}
    // console.log('yayyyy done');
    // console.log(eddResponse);
    return eddResponse;
}


function convertTo12Hour(hour) {
    if (hour >= 13 && hour <= 23) {
        return hour - 12;
    } else if (hour === 0) {
        return 12;
    } else {
        return hour;
    }
}

//  pm  fixed
//  delery time  
//  by 2pm 

//  superfast debuggerelivery in 120 mins