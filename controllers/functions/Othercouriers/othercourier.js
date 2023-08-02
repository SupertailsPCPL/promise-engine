const promiseEngineConnection = require('../../../dbpromiseengine');
const getSBD = require('../Bufferdays/sbd');
const getDBD = require('../Bufferdays/dbd');
//const getGBD = require('../Bufferdays/gbd')
const getcPinData = require('../Cpindata/cpindata')
const utils = require("../Util/utils")

module.exports = otherEDD;


async function getCourier(cpin, wareHouseId, skuWt) {
    // console.log(`SELECT * FROM courierV2 WHERE rpin = ${rPin} AND WH = '${wareHouseId}' AND minWt <= ${skuWt} AND maxWt >= ${skuWt} order by EDD;`,);
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM courierV2 WHERE rpin = ${cpin} AND WH = '${wareHouseId}' AND minWt <= ${skuWt} AND maxWt > ${skuWt} order by EDD;`,
                async function (error, courierresults, fields) {
                    if (error) { console.error(error); }
                    if (courierresults) {
                        // console.log('8-T6 courier');
                        resolve(JSON.parse(JSON.stringify(courierresults))[0]);
                    } else {
                        // console.log('-8-T6-courier Not Found');
                        resolve(false);
                    }
                });
        }
        catch (e) {
            console.error(e);
            // console.log('-8-T6-courier Not Found');

            resolve(false);
        }
    });
    return await promise;
}



async function getWareHousePriority(state) {
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM WarehousePriority WHERE state = ?`, state,
                async function (error, WarehousePriorityresults, fields) {
                    if (error) { console.error(error); }
                    if (WarehousePriorityresults.length) {
                        // console.log('4-T3 wharehouse priority');
                        // console.log(WarehousePriorityresults);
                        resolve(JSON.parse(JSON.stringify(WarehousePriorityresults))[0]);
                    } else {
                        // console.log('-4-T3-wharehouse Not Found');
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



async function otherEDD(cpin, eddResponse) {
    console.log(eddResponse);
    var state = "";
    var city = "";
    let EDD = 0;
    let SBD = 0;
    let DBD = 0;
    let userState = '';
    let GBD = 0;
    let skuWt = eddResponse.weight * eddResponse.qty;

    DBD = await getDBD(cpin);
    eddResponse = { ...eddResponse, "DBD":`${DBD}`};
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
    eddResponse = { ...eddResponse, "state": `${state.toUpperCase()}`, "city": `${city.toUpperCase()}`, "GBD": `${GBD}` };
    console.log("eddResponse post dbd gbd and cpin data");
    console.log(eddResponse);   
   
// if(await getIsAvailableInNDD(cpin) === eddResponse.warehouse){
//     EDD = 1;
//     LLEDD = 0;
//     L1BD = 0;
//     L2BD = 0;

//     eddResponse = { ...eddResponse, "LLEDD": `0`, "L1BD": `0` , "EDD": `1`, "L2BD": `0`};
//     SBD = await getSBD(whareHouseId);
//     eddResponse = { ...eddResponse, "SBD": `${SBD}` };
//     console.log("eddResponse post sbd");
//     console.log(eddResponse);

//     var total = parseInt(SBD) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD);
//     console.log("total");
//     console.log(total);

//     var currentDate = new Date();
//     currentDate.setHours(currentDate.getHours() + 5);
//     currentDate.setMinutes(currentDate.getMinutes() + 30);

//     var cutoff = new Date();
//     cutoff.setHours(14);
//     cutoff.setMinutes(0);
//     cutoff.setSeconds(0);

//     var timeLeftToCuttOff = (cutoff.getTime() - currentDate.getTime());
//     timeLeftToCuttOff = Math.ceil(timeLeftToCuttOff / (1000 * 60));
//     timeLeftToCuttOff = timeLeftToCuttOff < 0 ? 1440 - Math.abs(timeLeftToCuttOff) : timeLeftToCuttOff;

//     eddResponse = { ...eddResponse, "currentDate": `${currentDate}`, "cutoff": `${cutoff}`, "timeLeftInMinutes": `${timeLeftToCuttOff}` };
//     console.log("eddResponse post all time events");
//     console.log(eddResponse);

//     if (cutoff > currentDate) {
//         total = total;
//     }
//     else {
//         total += 1;
//     }
//     date = currentDate.getDate();
//     currentDate.setDate(date + total);
//     eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : "between 4PM - 10PM"}`, "deliveryDay": `${(total) === 0 ? "Today" : (total) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`, "courier": "others", "imageLike": `${getImageLink(total)}` };
//     console.log('yayyyy done');
//     console.log(eddResponse);
//     return eddResponse
// }

const wareHousePriorityData = await getWareHousePriority(userState);
    console.log(wareHousePriorityData);
    if (wareHousePriorityData == false) {
        return ({
            "skuId": eddResponse.skuid,
            "responseCode": "403",
            "errorDiscription": "Product will be delivered within 1 to 3 days",
            "error": "No WareHouse Priority Found For this CPin"
        })
    }
    var wareHousep1 = wareHousePriorityData.WHP1;
    var wareHousep2 = wareHousePriorityData.WHP2;
    var wareHousep3 = wareHousePriorityData.WHP3;
    whareHouseId = wareHousep1;

    SBD = await getSBD(whareHouseId);
    eddResponse = { ...eddResponse, "SBD": `${SBD}`};

    const courierData = await getCourier(cpin, whareHouseId, skuWt);
    if (courierData == false) {
        return ({
            "skuId": eddResponse.skuid,
            "responseCode": "406",
            "errorDiscription": "The product is not deliverble at this Pincode",
            "error": "No Courier found for this location"
        }
        );
    }else{
        EDD = courierData.EDD;
        eddResponse = { ...eddResponse, "EDD": `${EDD}` };
        
    }
    eddResponse = { ...eddResponse, "EDD": `${EDD}` };

    var total = parseInt(SBD) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD) ;
    console.log("total");
    console.log(total);

    var currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 5);
    currentDate.setMinutes(currentDate.getMinutes() + 30);

    var cutoff = new Date();
    cutoff.setDate(currentDate.getDate())
    cutoff.setMinutes(0);
    cutoff.setSeconds(0);

    var timeLeftToCuttOff = (cutoff.getTime() - currentDate.getTime());
    timeLeftToCuttOff = Math.ceil(timeLeftToCuttOff / (1000 * 60));
    timeLeftToCuttOff = timeLeftToCuttOff < 0 ? 1440 - Math.abs(timeLeftToCuttOff) : timeLeftToCuttOff;

    eddResponse = { ...eddResponse, "currentDate": `${currentDate}`, "cutoff": `${cutoff}`, "timeLeftInMinutes": `${timeLeftToCuttOff}` };
    console.log("eddResponse post all time events");
    console.log(eddResponse);

    if (cutoff > currentDate) {
        total = total;
    }
    else {
        total += 1;
    }
    date = currentDate.getDate();
    currentDate.setDate(date + total);
    eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (utils.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : "between 4PM - 10PM"}`, "deliveryDay": `${(total) === 0 ? "Today" : (total) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`, "courier": "others", "imageLike": `${utils.getImageLink(total)}` };
    console.log('yayyyy done');
    console.log(eddResponse);
    return eddResponse
}