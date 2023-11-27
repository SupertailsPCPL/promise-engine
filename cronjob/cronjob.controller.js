const router = require("express").Router();

//METHOD: GET
//INPUT: REQUEST
//OUTPUT: RESPONSE
//PATH = '/getEdd'

const simpleInvCron  = require("./cronjobItemInv.js");
const bundleInvCron  = require("./cronjobBundle.js");
const itemMasterCron  = require("./cronjobItmenMaster.js");


router.get("/inventory", async (req, res, next) => {
  console.log("simple cron started",Date());  
  let funcRes = await simpleInvCron();
  console.log("simple cron ended",Date());  
  console.log("bunde cron ended",Date());  
  let bundleInv = await bundleInvCron();
  console.log("bunde cron ended",Date());  
    return res.status(200).json({
      message: "itemInv cronjob successfully completed",
      bundleInv:bundleInv,
      singleInv:funcRes


    }); 
  });

  router.get("/itemMaster", async (req, res, next) => {
    let funcRes = await itemMasterCron();
    return res.status(200).json({
      message: "itemMaster cronjob successfully completed",
      response: funcRes
    }); 
  });

router.get('/',(req,res)=>{
    res.send("Welcome To Promise Engine Cronjob")
})
  
  module.exports = router;
  