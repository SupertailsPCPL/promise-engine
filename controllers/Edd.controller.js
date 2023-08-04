const router = require("express").Router();

const EddFunctions = require("./functions/edd_functions.js");
const CartEddFunctions = require("./functions/eddcart_function.js");


//METHOD: GET
//INPUT: REQUEST
//OUTPUT: RESPONSE
//PATH = '/getEdd'

router.get("/product/Edd", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skus ?? false;
    let qty = req?.query?.qty ?? 1;
    console.log(cpin,skus,qty);

    let funcRes = await EddFunctions.EddMain(cpin,skus,qty);
    return res.status(200).json({
      message: "getEdd successfully returned",
      response:cpin
    }); 
  });

  router.get("/cart/Edd", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skus ?? false;
    let qty = req?.query?.qty ?? 1;
    console.log(cpin,skus,qty);

    let funcRes = await CartEddFunctions.EddMaincart(cpin,skus,qty);
    return res.status(200).json({
      message: "getEdd successfully returned",
      response:cpin
    }); 
  });

router.get("/", (req, res, next) => {
    return res.status(200).json({
      message: "EDD Test successfully",
    });
  });
  
  module.exports = router;
  