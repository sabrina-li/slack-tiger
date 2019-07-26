//server to listen to slack messages and save to DB
require('dotenv').config();

//set env to PROD
// process.env.NODE_ENV = "production";

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const apiRouter = require("./controllers/apiRoutes");
// const htmlRouter = require("./controllers/htmlRoutes");
var db = require("./models");
//const routes = require("./routes");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.use(routes);
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
            message_ts: "1559595458.002600",
            tags: "$MEM",
            ticket_no: 1521981,
            user:"U1K8Z9AFX",
            message_preview: "$MEM - 1521981 -  According to the product announcement, customers need to update their CNS cert. My customer is still using ENS V1. Here is the article in question: <https://support.workspaceone.com/articles/360023017973>.The customer used the download link for CNS from this article: <https://docs.vmware.com/en/VMware-Workspace-ONE-UEM/1810/WS1-Email-Notification-Service-2/GUID-7A3F2118-DF57-4E50-8BF2-93C18919092A.html>. Does the customer need to go to the Email &gt; Email Settings Page in the UEM Console, and clear out / regenerate the CNS here as well? If so, where does this step fit in the flow? No documents regarding CNS I’ve seen in a while even mention this location."
        },{
            message_ts: "1559594472.002400",
            tags: "$MAM",
            ticket_no: 1521981,
            user:"U1K8Z9AFP",
            message_preview: "$MAM - 1521982 -  “App file type for OSX fails to deploy on devices post adding version” Zscaler 1.4 App currently deployed to devices adding a version 1.5 and deploying does not take affect and lets 1.4 stay on the device. Same apps when tested internally works fine, Customer re-enrolled a device and got 1.5 straight. Collected Bulk processing, Change event queue and Ds logs while pushing the 1.5 App and could not identify relevant errors. Please suggest!",
            createdAt:"2019-06-07 14:32:04"
        }];
        db.Message.bulkCreate(data)
    }
    app.listen(PORT, function () {
        console.log(
            "==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
            PORT,
            PORT
        );
    });
});

module.exports = app;