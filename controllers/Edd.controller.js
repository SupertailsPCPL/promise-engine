const router = require("express").Router();

//METHOD: GET
//INPUT: REQUEST
//OUTPUT: RESPONSE
//PATH = '/test'

router.post("/getEdd", (req, res, next) => {
    console.log(req.body);
    let bodyData = req.body;
    bodyData.qty = bodyData.qty * 10;
    return res.status(200).json({
      message: "getEdd successfully returned",
      response:bodyData
    });
  });

router.get("/", (req, res, next) => {
    return res.status(200).json({
      message: "EDD Test successfully",
    });
  });
  
  module.exports = router;
  