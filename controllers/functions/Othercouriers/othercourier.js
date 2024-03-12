const promiseEngineConnection = require('../../../dbPromiseEngine');
const getSBD = require('../Bufferdays/sbd');
const getDBD = require('../Bufferdays/dbd');
//const getGBD = require('../Bufferdays/gbd')
const getcPinData = require('../Cpindata/cpindata');
const utils = require("../Util/utils")
const getIsAvailableInNDD = require("../NDD/ndd.js")
const GetLBD = require("../LBD/LBD.js")
const getCutOff = require('../CutOff/cutoOff.js');

module.exports = { otherEDD, getCourier };

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


// wareHouseId is not required
async function getCourier(cpin, skuWt) {
    // console.log(`SELECT * FROM courierV2 WHERE rpin = ${rPin} AND WH = '${wareHouseId}' AND minWt <= ${skuWt} AND maxWt >= ${skuWt} order by EDD;`,);
    let promise = new Promise((resolve, reject) => {
        try {
            promiseEngineConnection.query(
                `SELECT * FROM courierV3 WHERE cpin = ${cpin} AND minWt <= ${skuWt} AND maxWt > ${skuWt};`,
                //`SELECT * FROM courierV2 WHERE rpin = ${cpin} AND WH = '${wareHouseId}' AND minWt <= ${skuWt / 1000} AND maxWt > ${skuWt / 1000} order by EDD;`,
                async function (error, courierresults, fields) {
                    if (error) { console.error(error); }
                    if (courierresults) {
                        // console.log('8-T6666 courier');
                        // console.log(courierresults[0]);
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
                `SELECT * FROM EDDwarehouse_priority WHERE state = ?`, state,
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
    var state = "";
    var city = "";
    let EDD = 0;
    let SBD = 0;
    let DBD = 0;
    let LBD = 0;
    let userState = '';
    let GBD = 0;
    let skuWt = eddResponse.skuWt;
    // eddResponse.skuWt = skuWt;
    // console.log("DBD data");
    // console.log(Date());
    DBD = await getDBD(cpin);
    // console.log("DBD data completed");
    // console.log(Date());
    eddResponse = { ...eddResponse, "DBD": `${DBD}` };
    // console.log("Cpin data");
    // console.log(Date());
    var cpinData = await getcPinData(cpin);
    // console.log("Cpin data completed");
    // console.log(Date());
    if (cpinData === false) {
        return ({
            "skuid": eddResponse[`${eddResponse.skuId}`],
            "responseCode": "401",
            "error": "Invalid Cpin",
            "errorDiscription": "Please enter a valid Pincode"
        })
    }
    userState = cpinData.state;
    state = cpinData.stateFullName;
    city = cpinData.city;
    eddResponse = { ...eddResponse, "state": `${state.toUpperCase()}`, "city": `${city.toUpperCase()}`, "GBD": `${GBD}` };
    // console.log("eddResponse post dbd gbd and cpin data");
    // console.log("hghgghhgghg");
    // console.log("state");
    // console.log(userState);
    // console.log("warehouse priority");
    // console.log(Date());
    const wareHousePriorityData = await getWareHousePriority(userState);
    // console.log("warehouse priority completed");
    // console.log(Date());
    // console.log(wareHousePriorityData);
    if (wareHousePriorityData == false) {
        return ({
            "skuId": eddResponse.skuid,
            "responseCode": "403",
            "errorDiscription": "Product will be delivered within 1 to 3 days",
            "error": "No WareHouse Priority Found For this CPin"
        })
    }
    // console.log("testing");
    const warehousePriorities = [
        "WHP1", "WHP2", "WHP3", "WHP4", "WHP5", "WHP6", "WHP7", "WHP8", "WHP9", "WHP10", "WHP11", "WHP12", "WHP13", "WHP14", "WHP15", "WHP16", "WHP17", "WHP18", "WHP19", "WHP20","WHP21","WHP22","WHP23","WHP24","WHP25","WHP26","WHP27"
    ];
    let eddqty = eddResponse.qty;
    // console.log(eddResponse);
    // console.log(eddqty);
    let whareHouseId;

    // console.log("wareHousePriorityData",wareHousePriorityData);
    for (const warehousePriority of warehousePriorities) {
        let warehouseId = wareHousePriorityData[`${warehousePriority}`];
        // console.log(warehousePriority,warehouseId);
        if (eddResponse[`${warehouseId}`] === null || eddResponse[`${warehouseId}`] === 0,!eddResponse[`${warehouseId}`]) {
            // console.log(warehouseId,"going in null");
            continue; // Skip to the next warehouse if warehouseId is empty or null
        }
        else if (eddqty <= eddResponse[`${warehouseId}`]) {
            whareHouseId = warehouseId;
            break;
        } else {
            // console.log(warehouseId,"jjbjbj");
            // console.log(eddResponse[`${warehouseId}`],eddqty);
            eddqty = eddqty - parseInt(eddResponse[`${warehouseId}`]??0);
        }
    }
    // console.log("final",whareHouseId);
    if (whareHouseId) {
        // console.log("Final whareHouseId");
        // console.log(whareHouseId);
    } else {
        return ({
            "skuId": eddResponse.skuId,
            "responseCode": "403",
            "errorDiscription": "Out of Stock",
            "error": "Out of Stock"
        });
    }
    if (whareHouseId == "PWH001") {
        return ({
            "skuId": eddResponse.skuId,
            "city": eddResponse.city,
            "state": eddResponse.state,
            "responseCode": "499",
            "warehouse":"PWH001",
            "deliveryDate":"  ",
            "deliveryDay": "3 to 7 days"
        })
    }
    eddResponse.warehouse = whareHouseId;
    // console.log("EDD Warehouse");
    // console.log(eddResponse.warehouse);
    // console.log("SBD Data");
    // console.log(Date());
    SBD = await getSBD(eddResponse.warehouse);
    // console.log("SBD Data completed");
    // console.log(Date());
    eddResponse = { ...eddResponse, "SBD": `${SBD}` };

    // console.log("Courier Data");
    // console.log(Date());
    // ware and pincode 
    // console.log("wt ads,ds akads ads kl adsldas da");
    // console.log(eddResponse);
    if (await getIsAvailableInNDD(cpin) === eddResponse.warehouse && skuWt <= 20) {
        // console.log("Going in NDD");
        EDD = 1;
        eddResponse = { ...eddResponse,courier:"NDD", "EDD": `${EDD}` };
    } else {

        eddResponse = { ...eddResponse, courier:"others" };

        const courierData = await getCourier(cpin, skuWt); // eddResponse.warehouse not required for the new table
        // console.log("Going in courier");
        // console.log("Courier Data completed");
        // console.log(Date());
        // console.log(eddResponse.warehouse);
        // console.log(skuWt);
        // console.log("courierData");
        // console.log(courierData);
        if (courierData == false ) {
            return ({
                "skuId": eddResponse.skuid,
                "responseCode": "406",
                "errorDiscription": "The product is not deliverble at this Pincode",
                "error": "No Courier found for this location"
            }
            );
        } else {
            EDD = courierData[`${whareHouseId}`];
            // console.log("EDD from courier");
            // console.log(EDD);
            //EDD = courierData.EDD;
            eddResponse = { ...eddResponse, "EDD": `${EDD}` };
        }

       LBD =  await GetLBD(whareHouseId,cpin,skuWt)
       eddResponse = { ...eddResponse, "LBD": `${LBD}` };

    }
        var total = parseInt(SBD ?? 0) + parseInt(DBD) + parseInt(GBD) + parseInt(EDD) + parseInt(LBD);
        // console.log("total");
        // console.log(total);

        var currentDate = new Date();
        // currentDate.setHours(currentDate.getHours());
        // currentDate.setMinutes(currentDate.getMinutes());
        currentDate.setHours(currentDate.getHours() + 5);
        currentDate.setMinutes(currentDate.getMinutes() + 30);
        let deliveryTime= new Date();;
        deliveryTime.setHours(currentDate.getHours() + 5);
        deliveryTime.setMinutes(currentDate.getMinutes() + 30);
        deliveryTime.setMilliseconds(0)
        deliveryTime.setSeconds(0)
        let cutOffData = await getCutOff();
        // console.log("cutoff");
        // console.log(cutOffData);
        // console.log(eddResponse.warehouse);
        let NDDLBD=0
        let cutOffTime ;
        if (eddResponse.courier == "others") {
            // console.log(cutOffData);
             cutOffTime = cutOffData[`others-${eddResponse.warehouse}`]?.split(':') ?? [12,0];
            }
        else{
            //Created ndd for three warehouse
            cutOffTime = cutOffData[`ndd-${eddResponse.warehouse}`]?.split(':') ?? [13,0];
            NDDLBD = cutOffData[`ndd-${eddResponse.warehouse}-bufferdays`] ?? 0;
        }
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

        eddResponse = { ...eddResponse, "currentDate": `${currentDate}`, "cutoff": `${cutoff}`, "timeLeftInMinutes": `${timeLeftToCuttOff}` };
        // console.log("eddResponse post all time events");

        if (cutoff > currentDate) {
            total = total;
            deliveryTime.setHours(21);
            deliveryTime.setMinutes(0);
            deliveryTime.setDate(deliveryTime.getDate()+total);

        }
        else {
            deliveryTime.setHours(21);
            deliveryTime.setMinutes(0);
            deliveryTime.setDate(deliveryTime.getDate()+1+total);
            total += 1;
        }

        // console.log("DASldasldsal dsalads l");
        total= total + NDDLBD;
        date = currentDate.getDate();
        currentDate.setDate(date + total);
        // console.log("currentDate.getDay()");
        // console.log(currentDate.getDate());
        if( eddResponse.courier == "NDD")
     {
        // console.log(eddResponse['ndd-disable-Sunday-Delivery']);
        // console.log("in is adsas Sunday");
        //Checking Whether current day is equql to ndd disable day 
        const currentDay = weekday[currentDate.getDay()];

        // Split the 'ndd-disable-Sunday-Delivery' value
        const disabledDays = eddResponse['ndd-disable-Sunday-Delivery']?.split(',');

        // Check if the current day is in the disabled days
        const isDayDisabled = disabledDays.includes(currentDay);
     if(isDayDisabled){
        // console.log("in is day");
        // console.log("total",total);
        total += 1;
        // console.log("total",total);
        date = currentDate.getDate();
        currentDate.setDate(date + 1);
        deliveryTime.setDate(deliveryTime.getDate()+1);
     }}
     if(eddResponse.warehouse != "WN-MBHI0003" && eddResponse.warehouse != "WN-MDEL0002" &&eddResponse.warehouse != "WN-MBLR0001"){
        const currentDay = weekday[currentDate.getDay()];
        if(currentDay == "Sun"){
            total += 1;
            date = currentDate.getDate();
            currentDate.setDate(date + 1);
            deliveryTime.setDate(deliveryTime.getDate()+1);
        }
     }
    // const currentDayy = weekday[currentDate.getDay()];
    //  if(currentDayy == "Fri"){
    //      total += 1;
    //         date = currentDate.getDate();
    //         currentDate.setDate(date + 1);
    //  }
    
    eddResponse = { ...eddResponse, "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (utils.getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : " "}`, "deliveryDay": `${(total) === 0 ? "9 PM, Today" : (total) === 1 ? "9 PM, Tomorrow" : weekday[currentDate.getDay()]}`, "imageLike": `${utils.getImageLink(total)}` };
    let message = `${total > 1 ? "":"by" } ${eddResponse?.deliveryDay}${eddResponse?.deliveryDate?.trim()?.length>0?", ":""}${eddResponse?.deliveryDate}`
    let AppMessageAdverb = "by"
    let AppMessage = `${eddResponse?.deliveryDay}${eddResponse?.deliveryDate?.trim()?.length>0?", ":""}${eddResponse?.deliveryDate}`
    eddResponse = {...eddResponse,message:message,"appMessage":AppMessage,"appMessageAdverb":AppMessageAdverb,"deliveryTime":deliveryTime}
        // console.log('yayyyy done other');
        // console.log(eddResponse);
        return eddResponse;
}