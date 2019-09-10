//server to listen to slack messages and save to DB
require('dotenv').config();

//set env to PROD
// process.env.NODE_ENV = "production";

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io')(http);

const apiRouter = require("./controllers/apiRoutes");
// const htmlRouter = require("./controllers/htmlRoutes");
var db = require("./models");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const {setSendAlert,removeThread} = require('./controllers/Util/databaseUtils');
const {sentAlertToChannel} = require('./controllers/Util/slackapi-int');



const databaseUtils = require('./controllers/Util/databaseUtils');
const slackapi = require('./controllers/Util/slackapi-int');


//TODO: object decontruction
const setHasReply = databaseUtils.setHasReply
    , getAlert = databaseUtils.getAlert
    , updateAlert = slackapi.updateAlert;




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make io accessible to our router
app.use(function(req,res,next){
    req.io = io;
    next();
});
app.use('/api', apiRouter);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

const PORT = process.env.PORT || 3001;
var syncOptions = { force: false };

// If running a test, set syncOptions.force to true
// clearing the `testdb` nad `developmentdb`
if (process.env.NODE_ENV === "test") {
    syncOptions.force = true;
} else if (!process.env.NODE_ENV) {
    syncOptions.force = true;
    syncOptions.match = /_development$/;
}

// Starting the server, syncing our models ------------------------------------/
db.sequelize.sync(syncOptions).then(function () {
    if (!process.env.NODE_ENV) {
        var data = [{
            message_ts: "1568129139.010600",
            tags: "$MEM",
            ticket_no: 1521981,
            user:"U1K8Z9AFX",
            message_preview: "$MEM - 1521981 -  According to the product announcement, customers need to update their CNS cert. My customer is still using ENS V1. Here is the article in question: <https://support.workspaceone.com/articles/360023017973>.The customer used the download link for CNS from this article: <https://docs.vmware.com/en/VMware-Workspace-ONE-UEM/1810/WS1-Email-Notification-Service-2/GUID-7A3F2118-DF57-4E50-8BF2-93C18919092A.html>. Does the customer need to go to the Email &gt; Email Settings Page in the UEM Console, and clear out / regenerate the CNS here as well? If so, where does this step fit in the flow? No documents regarding CNS I’ve seen in a while even mention this location."
        },{
            message_ts: "1559594472.002404",
            tags: "$MAM",
            ticket_no: 1521981,
            user:"U1K8Z9AFP",
            message_preview: "$MAM - 1521982 -  “App file type for OSX fails to deploy on devices post adding version” Zscaler 1.4 App currently deployed to devices adding a version 1.5 and deploying does not take affect and lets 1.4 stay on the device. Same apps when tested internally works fine, Customer re-enrolled a device and got 1.5 straight. Collected Bulk processing, Change event queue and Ds logs while pushing the 1.5 App and could not identify relevant errors. Please suggest!",
            createdAt:"2019-06-07 14:32:04"
        }];
        db.Message.bulkCreate(data)
        db.User
    }
});

http.listen(PORT, function () {
    console.log(
        "==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
        PORT,
        PORT
    );
});

io.on('connection', (socket) =>{
    console.log('a user is connected');
    // io.sockets.emit("message","first")
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
})


//first alert
const timer1 =  setInterval(() => {
    const epochMinAgo = (Date.now() - 60000 * 10).toString();//>10 min ago
    db.Message.findAll({where:{
        message_ts:{[Op.lt]:epochMinAgo},
        has_reply:false,
        alert15_ts:null
        }
    }).then(messages=>{

        console.log("interval 1 and found messages: ", messages.length)
        messages.forEach(message=>{
            sentAlertToChannel(message.message_ts.replace('.',''),message.tags,10).then(alert=>{
                setSendAlert(message.message_ts,alert.ts,1).then(()=>{
                    //update alert if already has reply  
                    db.Message.findOne({where:{
                        message_ts:message.message_ts,
                        has_reply:true
                    }}).then(message=>{
                        console.log("alert15_ts")
                        if(message && message.alert15_ts){
                            updateAlert(message.alert15_ts);//API: send reply to he alert thread once there's a reply
                        }
                    })
                })
                
            }).catch(err=>{
                console.log(err)
                if (err.err === "no thread found"){
                    removeThread(err.ts).catch(console.log);
                }
            })
            
        })
    })
}, 1000*10);//every 10 min


//third alert
const timer2 =  setInterval(() => {
    const epochMinAgo = (Date.now() - 60000 * 30).toString();//>30 min ago
    db.Message.findAll({where:{
        message_ts:{[Op.lt]:epochMinAgo},
        has_reply:false,
        alert30_ts:null
        }
    }).then(messages=>{
        console.log("interval 2 and found messages: ", messages.length)
        messages.forEach(message=>{
            sentAlertToChannel(message.message_ts.replace('.',''),message.tags,30).then(alert=>{
                setSendAlert(message.message_ts,alert.ts,2).then(()=>{
                    //update alert if already has reply  
                    db.Message.findOne({where:{
                        message_ts:message.message_ts,
                        has_reply:true
                    }}).then(message=>{
                        if(message && message.alert30_ts){
                            updateAlert(message.alert30_ts);//API: send reply to he alert thread once there's a reply
                        }
                    })
                });
                
            }).catch(err=>{
                console.log(err)
                if (err.err === "no thread found"){
                    removeThread(err.ts).catch(console.log);
                }
            })
            
        })
    })
}, 1000*30);//every 30 min


//third alert
const timer3 =  setInterval(() => {
    const epochMinAgo = (Date.now() - 60000 * 35).toString();//>35 min ago
    db.Message.findAll({where:{
        message_ts:{[Op.lt]:epochMinAgo},
        has_reply:false,
        alert35_ts:null
        }
    }).then(messages=>{
		console.log("interval 3 and found messages: ", messages.length)
        messages.forEach(message=>{
            sentAlertToChannel(message.message_ts.replace('.',''),message.tags,35).then(alert=>{
                setSendAlert(message.message_ts,alert.ts,3).then(()=>{
                    //update alert if already has reply  
                    db.Message.findOne({where:{
                        message_ts:message.message_ts,
                        has_reply:true
                    }}).then(message=>{
                        if(message && message.alert35_ts){
                            updateAlert(message.alert35_ts);//API: send reply to he alert thread once there's a reply
                        }
                    })
                });
                
            }).catch(err=>{
                console.log(err)
                if (err.err === "no thread found"){
                    removeThread(err.ts).catch(console.log);
                }
            })
            
        })
    })
}, 1000*35);//every 35 min


setTimeout(() => {
    setHasReply("1568129139.010600")
}, 1000*5);


module.exports = app;