const router = require("express").Router();
const EddFunctions = require("./functions/edd_functions");
const CartEddFunctions = require("./functions/eddcart_function");


//METHOD: GET
//INPUT: REQUEST
//OUTPUT: RESPONSE
//PATH = '/getEdd'

router.get("/edd", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skuid ?? false;
    let qty = req?.query?.qty ?? 1;
    let showcompletedata = req?.query?.showcompletedata ?? false;
    console.log(cpin,skus,qty,showcompletedata);

    let funcRes = await EddFunctions.EddMain(cpin,skus,qty);
    let  extractedData = funcRes.reduce((result, item) => {
      result.push({
        skuId: item.skuId,
        qty: item.qty,
        state: item.state,
        city: item.city,
        warehouse: item.warehouse,
        imageLike: item.imageLike,
        deliveryDate: item.deliveryDate,
        deliveryDay: item.deliveryDay,
        dayCount: item.dayCount,
      });
      return result;
    }, []);

    let responseToSend = showcompletedata ? funcRes : extractedData;

    return res.status(200).json({
      message: "getEdd successfully returned",
      response: responseToSend
    }); 
  });

  router.get("/cartedd", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skuid ?? false;
    let qty = req?.query?.qty ?? 1;
    let showcompletedata = req?.query?.showcompletedata ?? false;
    console.log(cpin,skus,qty,showcompletedata);

    let funcRes = await CartEddFunctions.EddMaincart(cpin,skus,qty);
    let  extractedData = funcRes.reduce((result, item) => {
      result.push({
        skuId: item.skuId,
        qty: item.qty,
        state: item.state,
        city: item.city,
        warehouse: item.warehouse,
        imageLike: item.imageLike,
        deliveryDate: item.deliveryDate,
        deliveryDay: item.deliveryDay,
        dayCount: item.dayCount,
      });
      return result;
    }, []);
  
    let responseToSend = showcompletedata ? funcRes : extractedData;

    return res.status(200).json({
      message: "getEdd successfully returned",
      response: responseToSend
    }); 
  });

router.get('/',(req,res)=>{
    res.send("Welcome To Promise Engine Backend")
})
  
  module.exports = router;
  