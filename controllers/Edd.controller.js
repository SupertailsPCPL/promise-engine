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
    console.log(cpin,skus,qty);

    let funcRes = await EddFunctions.EddMain(cpin,skus,qty);

    return res.status(200).json({
      message: "getEdd successfully returned",
      response: funcRes
    }); 
  });

  router.get("/cartedd", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skuid ?? false;
    let qty = req?.query?.qty ?? 1;
    console.log(cpin,skus,qty);

    let funcRes = await CartEddFunctions.EddMaincart(cpin,skus,qty);
    return res.status(200).json({
      message: "getEdd successfully returned",
      response: funcRes
    }); 
  });

router.get('/',(req,res)=>{
    res.send("Welcome To Promise Engine Backend")
})
  
  module.exports = router;
  