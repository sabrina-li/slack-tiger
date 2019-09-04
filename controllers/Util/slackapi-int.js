const request = require('request-promise-native');
const secrets = require('../../config/secrets.js');


const threadurl = "https://slack.com/api/channels.replies?token=" + secrets.keys.token
    + "&channel=" + secrets.keys.channel
    + "&thread_ts=";
const userurl = "https://slack.com/api/users.info?token=" + secrets.keys.token
    + "&user=";
const postMessageurl = "https://slack.com/api/chat.postMessage?as_user=true&token=" + secrets.keys.token
    + "&channel=" + secrets.keys.channel;
const postChannelurl = "https://slack.com/api/chat.postMessage?as_user=true&token=" + secrets.keys.token
    + "&channel=" + secrets.keys.slachannel;
const thread = 'https://vmware.slack.com/archives/' + secrets.keys.channel + '/p';



function retrieveThreadsFromSlackAPI(threadTS) {
    return new Promise((res, rej) => {
        //append 0 to thread ts string
        threadTS = (Number(threadTS) * 1000000).toString();
        threadTS = threadTS.substring(0, threadTS.length - 6) + "." + threadTS.substring(threadTS.length - 6);;
        request(threadurl + threadTS)
            .then(function (result) {
                //TODO:check has_more
                const messages = JSON.parse(result).messages;
                res(messages);
            })
            .catch(function (err) {
                // failed...
                console.error(err);
                rej(err);
            });
    })
}


//TEST
// retrieveUsernameFromUserID('U1K8Z9AFP').then(user=>{
//     console.log(user);
// });
function retrieveUsernameFromUserID(userID, message) {
    return new Promise((res, rej) => {
        let userInfo;
        request(userurl + userID)
            .then(function (result) {
                // console.log(userurl+userID)
                result = JSON.parse(result);
                if (result.error === undefined && message) {
                    userInfo = { real_name: result.user.real_name ? result.user.real_name : result.user.profile.real_name, username: result.user.name, userID: userID };
                    message.userInfo = userInfo
                } else {
                    message.userInfo = { real_name: "Unknown User", username: "UnknownUser" }
                }
                res(message);

            })
            .catch(function (err) {
                // failed...
                console.error(err);
            });
    })
}


function postMessageToThread(message, thread_ts) {
    return new Promise((res, rej) => {
        console.log(postMessageurl + '&thread_ts=' + thread_ts + '&text=' + message)
        request.post(postMessageurl + '&thread_ts=' + thread_ts + '&text=' + message)
            .then(function (result) {
                result = JSON.parse(result);
                if (result && result.ok && result.message.thread_ts) {
                    res(result);
                } else {
                    console.log("ERR", result)
                    rej("error posting to thread");
                }
            })
            .catch(function (err) {
                // failed...
                rej(err);
            });
    })
}

const sentAlertToChannel = (messageTS) => {
    return new Promise((res, rej) => {
        const message = "The following thread is about to reach 30 min without reply:" + thread + messageTS;
        request.post(postChannelurl + '&text=' + message)
            .then(function (result) {
                result = JSON.parse(result);
                if (result && result.ok && result.message) {
                    console.log("result",result)
                    // db.Message.findOne({where:{message_ts:threadts, alerted:true}})
                    // .then(message=>{
                    //     if(message.alert_ts){
                    //         console.log(alert_ts)
                    //     }
                    // }).catch(console.error)
                    res(result);
                } else {
                    console.log("ERR", result)
                    rej("error posting to thread");
                }
            })
            .catch(function (err) {
                // failed...
                rej(err);
            });
    })
}

const deleteAlert = (threadts)=>{
    // db.Message.findOne({where:{message_ts:threadts, alerted:true}})
    //     .then(message=>{
    //         if(message.alert_ts){
    //             console.log(alert_ts)
    //         }
            
    //     }).catch(console.error)
}

module.exports = {
    retrieveThreadsFromSlackAPI,
    retrieveUsernameFromUserID,
    postMessageToThread,
    sentAlertToChannel,
    deleteAlert
}
