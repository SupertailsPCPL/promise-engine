const getcPinData = require('../Cpindata/cpindata')

module.exports = dropShipEDD;

async function dropShipEDD(cpin, eddResponse) {
    var state = "";
    var city = "";
    // DBD = await getDBD(cpin);
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
    eddResponse = { ...eddResponse, "state": `${state.toUpperCase()}`, "city": `${city.toUpperCase()}` };
    // console.log("eddResponse post dbd gbd and cpin data");
    // console.log(eddResponse);


    var total = 7;
    var currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 5);
    currentDate.setMinutes(currentDate.getMinutes() + 30);

    date = currentDate.getDate();
    currentDate.setDate(date + total);
    eddResponse = { ...eddResponse,"warehouse":"DropShip" , "responseCode": "200", "dayCount": `${total}`, "deliveryDate": `${total > 1 ? (getDateFormated(currentDate.getDate()) + " " + monthNames[currentDate.getMonth()]) : "By 9PM"}`, "deliveryDay": `${(total) === 0 ? "Today" : (total) === 1 ? "Tomorrow" : weekday[currentDate.getDay()]}`, "FLEDD": 7, "LLEDD": 0, "courier": "dropship", "imageLike": `${getImageLink(total)}` };
    // console.log('yayyyy done with dropship');
    // console.log(eddResponse);
    return eddResponse
}