require('dotenv').config();

exports.keys = {
    token: process.env.SLACK_TOKEN,
    channel: process.env.NODE_ENV==="production" ? process.env.PROD_CHANNEL_ID:process.env.TEST_CHANNEL_ID,
    slachannel:process.env.SLA_CHANNEL,
    host : process.env.DBHOST,
    port : process.env.DBPORT,
    user : process.env.DBUSER,
    password : process.env.DBPASSWORD,
    database : process.env.DATABASE,
};
