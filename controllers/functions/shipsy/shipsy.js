const promiseEngineConnection = require('../../../dbpromiseengine');
const getSBD = require('../Bufferdays/sbd');
const getDBD = require('../Bufferdays/dbd');
//const getGBD = require('../Bufferdays/gbd')
const getcPinData = require('../Cpindata/cpindata')
const utils = require("../Util/utils")


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
    DBD = await getDBD(cpin);
    var cpinData = await getcPinData(cpin);
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
    eddResponse = {...eddResponse, "warehouse": `${whareHouseId}`}
    SBD = await getSBD(whareHouseId);
    eddResponse = { ...eddResponse, "SBD": `${SBD}` };
    console.log("eddResponse post sbd");
   

    var total = parseInt(SBD) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD);

    var currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 5);
    currentDate.setMinutes(currentDate.getMinutes() + 30);

    var cutoff = new Date();
    cutoff.setDate(currentDate.getDate())
    whareHouseId == "WN-MBHI0003" ? cutoff.setHours(12) : cutoff.setHours(14);
    whareHouseId == "WN-MBHI0003" ? cutoff.setMinutes(30) : cutoff.setMinutes(0);
    cutoff.setSeconds(0);

    var timeLeftToCuttOff = (cutoff.getTime() - currentDate.getTime());
    timeLeftToCuttOff = Math.ceil(timeLeftToCuttOff / (1000 * 60));
    timeLeftToCuttOff = timeLeftToCuttOff < 0 ? 1440 - Math.abs(timeLeftToCuttOff) : timeLeftToCuttOff;

    eddResponse = { ...eddResponse, "currentDate": `${currentDate}`, "cutoff": `${cutoff}`, "timeLeftInMinutes": `${timeLeftToCuttOff}` };
    console.log("eddResponse post all time events");
    if (cutoff > currentDate) {
        total = total;
    }
    else {
        total += 1;
    }
    date = currentDate.getDate();
    currentDate.setDate(date + total);
    eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (utils.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : "between 4PM - 10PM"}`, "deliveryDay": `${(total) === 0 ? "Today" : (total) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`, "FLEDD": 0, "LLEDD": 0, "courier": "shipsy", "imageLike": `${utils.getImageLink(total)}` };
    console.log('yayyyy done');
    console.log(eddResponse);
    return eddResponse
}