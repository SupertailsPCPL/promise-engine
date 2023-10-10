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
    let showAll = req?.query?.showAll ?? false;

    let funcRes = await EddFunctions.EddMain(cpin,skus,qty);
    let response;
    if (showAll === "supertails") {
      // Return all fields for all elements in funcRes
      response = funcRes.map(item => item);
    } else {
      // Return specific fields for all elements in funcRes
      response = funcRes.map(item => ({
        cpin: item.cpin,
        skuId: item.skuId,
        qty: item.qty,
        weight: item.weight,
        Type: item.Type,
        componentSkusData: item.componentSkusData,
        EDD: item.EDD,
        responseCode: item.responseCode,
        dayCount: item.dayCount,
        deliveryDate: item.deliveryDate,
        deliveryDay: item.deliveryDay,
        FLEDD: item.FLEDD,
        LLEDD: item.LLEDD,
        courier: item.courier,
        imageLike: item.imageLike
      }));
    }
    return res.send(response);

  });

  router.get("/cartedd", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skuid ?? false;
    let qty = req?.query?.qty ?? 1;
    console.log(cpin,skus,qty);
    let showAll = req?.query?.showAll ?? false;
    let funcRes = await CartEddFunctions.EddMaincart(cpin,skus,qty);
    let response;
    if (showAll === "supertails") {
      // Return all fields for all elements in funcRes
      response = funcRes.map(item => item);
    } else {
      // Return specific fields for all elements in funcRes
      response = funcRes.map(item => ({
        cpin: item.cpin,
        skuId: item.skuId,
        qty: item.qty,
        weight: item.weight,
        Type: item.Type,
        componentSkusData: item.componentSkusData,
        EDD: item.EDD,
        responseCode: item.responseCode,
        dayCount: item.dayCount,
        deliveryDate: item.deliveryDate,
        deliveryDay: item.deliveryDay,
        FLEDD: item.FLEDD,
        LLEDD: item.LLEDD,
        courier: item.courier,
        imageLike: item.imageLike
      }));
    }
    return res.send(response);

  });

  router.get('/GetPincodeDetails', async (req, res) => {
    let cpin = req.query.cpin;
  const result = await EddFunctions.getCityStateFromPinCode(cpin);
    res.send(result)
});

router.get('/',(req,res)=>{
    res.send("Welcome To Promise Engine Backend")
})
  
  module.exports = router;
  