const { promises } = require('dns');
const request = require('request');



module.exports = { EddMain,getEdd }



//this is the start point of edd - Main Function
// EddMain(2212121, "dsadsdsads,sadsasda", 1)
async function EddMain(cpin,skus,qty){
    try{    
        if(!skus){
            return ({
                "skuId": "No-Sku-Given",
                "responseCode": "402",
                "error": "Enter a SkuId",
                "errorDiscription": "SERVER ERROR"
            })
        }
        if(!cpin){
            return ({
                "sku":skus,
                "responseCode": "401",
                "errorDiscription": "Pincode field cannot be blank",
                "error": "Enter a Cpin"
            })
        }
       
        let skuArray = skus.split(',');
        console.log(skuArray);

        const value = await Promise.all(skuArray.map(
            skuId => getEdd(cpin, skuId, qty),
        )).then((values) => {
            return (values);
        });
        


    }
    catch(e){
        return ({
            "skuId": skuid,
            "responseCode": "499",
            "errorDiscription": "Product will be delivered within 1 to 3 days",
            "error": `"ERROR ${e}"`
        })
    }

}




async function getEdd(cpin,skuId,qty){
    return new Promise(async (resolve, reject) => {
        console.log(cpin,skuId,qty);
        let eddResponse;

        eddResponse={...eddResponse,"cpin":cpin,"skuId":skuId,"qty":qty};
        console.log(eddResponse);
        
        resolve(cpin,skuId,qty)
    });

}
