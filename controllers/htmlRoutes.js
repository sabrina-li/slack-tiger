const express = require("express");
const htmlRouter = express.Router();//for html routes
const path = require("path");
    

htmlRouter.get('/', (req, res)=>{
    res.sendFile(path.join(__dirname,"../views/index.html"));
});


module.exports = htmlRouter;