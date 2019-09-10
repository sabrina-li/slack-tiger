const request = require('request-promise-native');
const secrets = require('../../config/secrets.js');

const threadurl = "https://slack.com/api/channels.replies?token=" + secrets.keys.token
    + "&channel=" + secrets.keys.channel
    + "&thread_ts=";
const userurl = "https://slack.com/api/users.info?token=" + secrets.keys.token
    + "&user=";
const postMessageurl = "https://slack.com/api/chat.postMessage?as_user=true&token=" + secrets.keys.token
    + "&channel=" + secrets.keys.channel;
const alertChannelurl = "https://slack.com/api/chat.postMessage?token=" + secrets.keys.token
    + "&channel=" + secrets.keys.slachannel;
const thread = 'https://vmware.slack.com/archives/' + secrets.keys.channel + '/p';
const deleteURL = "https://slack.com/api/chat.delete?token="+secrets.keys.token+"&channel="+secrets.keys.slachannel+"&ts="



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
        //console.log(postMessageurl + '&thread_ts=' + thread_ts + '&text=' + message)
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



                            


const sentAlertToChannel = (messageTS,tags,alertTime) => {
    messageTS = messageTS.substring(0, messageTS.length - 6) + "." + messageTS.substring(messageTS.length - 6);
    const message = `The following thread is about to reach *${alertTime} min* without reply: *${tags}* ${thread}${messageTS}`;

    return new Promise((res, rej) => {
        request(threadurl + messageTS)
            .then(function (result) {
				console.log("sending alert to channel (get thread to make sure it's there");
				console.log(result);
				if (JSON.parse(result).ok){
					request.post(alertChannelurl + '&text=' + message)
						.then(function (result) {
							result = JSON.parse(result);
							if (result && result.ok && result.message) {
								//console.log("result",result.ts)
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
				}else{
					//delete the thread from DB
					rej({err:"no thread found",ts:messageTS})
				}
            
            }).catch(function (err) {
							// failed...
							rej(err);
						});

		
		
    })
}


const updateAlert = (threadts)=>{
    return new Promise((res, rej) => {
		request.post(alertChannelurl + '&thread_ts=' + threadts + '&text=' + "someone replied to this one already! Thank you!")
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
    // console.log(deleteURL + threadts);
//     return new Promise((res, rej) => {
//         request.post(deleteURL + threadts)
//             .then(function (result) {
//                 result = JSON.parse(result);
//                 if (result && result.ok && result.message) {
//                     console.log("result",result)
//                     res(result);
//                 } else {
//                     console.log("ERR", result)
//                     rej("error posting to thread");
//                 }
//             })
//             .catch(function (err) {
//                 // failed...
//                 rej(err);
//             });
//     })
// }
}


module.exports = {
    retrieveThreadsFromSlackAPI,
    retrieveUsernameFromUserID,
    postMessageToThread,
    sentAlertToChannel,
    updateAlert
}
