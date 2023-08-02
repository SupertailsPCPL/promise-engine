module.exports = {getImageLink, getDateFormated}

const imageLinks = [
    "https://cdn.shopify.com/s/files/1/0565/8021/0861/files/Express_Delivery.png?v=1673120411",
    "https://cdn.shopify.com/s/files/1/0565/8021/0861/files/1Day_Delivery.png?v=1673120411",
    "https://cdn.shopify.com/s/files/1/0565/8021/0861/files/2Day_Delivery.png?v=1673120411",
    "https://cdn.shopify.com/s/files/1/0565/8021/0861/files/Standard_Delivery.png?v=1673120411"
]

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


function getImageLink(total) {
    console.log("entered img link funcrion");
    console.log(total);
    if (total === 0) {
        return imageLinks[0];
    }
    else if (total === 1) {
        return imageLinks[1];
    }
    else if (total === 2) {
        return imageLinks[2];
    }
    else {
        return imageLinks[3];
    }
}

function getDateFormated(date) {
    if (date === 1) {
        return "1st"
    }
    else if (date === 2) {
        return "2nd"
    }
    else if (date === 3) {
        return "3rd"
    }
    else if (date >= 4) {
        return `${date}th`
    }
}