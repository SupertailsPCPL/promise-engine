const router = require("express").Router();

//METHOD: GET
//INPUT: REQUEST
//OUTPUT: RESPONSE
//PATH = '/getEdd'

const simpleInvCron  = require("./cronjobItemInv.js");
const bundleInvCron  = require("./cronjobItemInv.js");
const itemMasterCron  = require("./cronjobItemInv.js");


router.get("/inventory", async (req, res, next) => {
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skuid ?? false;

    let funcRes = await EddFunctions.EddMain(cpin,skus,qty);

    return res.status(200).json({
      message: "getEdd successfully returned",
      response: funcRes
    }); 
  });

  router.get("/itemMaster", async (req, res, next) => {
   
    let cpin = req?.query?.cpin ?? false;
    let skus = req?.query?.skuid ?? false;
    let qty = req?.query?.qty ?? 1;
    console.log(cpin,skus,qty);

    let funcRes = await simpleInvCron();
    return res.status(200).json({
      message: "getEdd successfully returned",
      response: funcRes
    }); 
  });

router.get('/',(req,res)=>{
    res.send("Welcome To Promise Engine Cronjob")
})
  
  module.exports = router;
  