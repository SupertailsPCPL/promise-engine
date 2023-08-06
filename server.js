const express = require("express");
const cors = require('cors');

const bodyparser = require("body-parser");
//CREATING A WEB SERVER WITH EXPRESS INSTANCE

const app = express();

//CONFIGURATION FOR EVN INSTANCE

//REGISTER ALL THE CONTROLLERS AND MIDDLEWARE BELOW

//IMPORT AND REGISTER THE EXPRESS APPLICATION 
//INJECT DATABASE CODE
app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": true,
    "optionsSuccessStatus": 200
  }));


app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());


app.get('/',(req,res)=>{
    res.send("Welcome To Promise Engine CronJob")
})


//START THE SERVER AND LISTEN TO THE PORT NO {4000}


app.set('port', process.env.PORT || 8080);
app.listen(8080);