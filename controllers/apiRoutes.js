const express = require("express");
const apiRouter = express.Router();//for html routes

const { keys } = require('../config/secrets');

const databaseUtils = require('./Util/databaseUtils');
const slackapi = require('./Util/slackapi-int');

const insertMessage = databaseUtils.insertMessage
    , getDistinctTags = databaseUtils.getDistinctTags
    , getMessageTSbyTag = databaseUtils.getMessageTSbyTag
    , getLatestMessageForTicket = databaseUtils.getLatestMessageForTicket
    , retrieveThreadsFromSlackAPI = slackapi.retrieveThreadsFromSlackAPI
    , retrieveUsernameFromUserID = slackapi.retrieveUsernameFromUserID
    , postMessageToThread = slackapi.postMessageToThread;

apiRouter.get('/tags', getTags);
apiRouter.post('/events', saveEvents);
apiRouter.get('/posts', getTopPosts);
apiRouter.get('/ticket/:ticketID', getMessagesForTicket);
apiRouter.post('/reply', postToThread);


function saveEvents(req, res) {
    const data = req.body;
    let tags = [], repost = [], rawtags, thread_ts;
    //TODO subtype message changed
    //TODO logging
    // console.log(req.body);
    if (data.challenge) {
        res.send(data.challenge)
    } else {
        let post;
        //DEV
        if (!process.env.NODE_ENV && data.event.channel == keys.channel && data.event.thread_ts === undefined && data.event.subtype === undefined) {
            post = data.event;
        }
        //PROD
        if (process.env.NODE_ENV === "production" && data.event.channel == keys.channel && data.event.subtype === undefined && data.event.attachments && data.event.attachments[0].footer === 'TigerBot') {
            post = data.event.attachments[0];
            //not listening in tiger for testing 
            //not listening to anything other than new post/reply
        }
        if(post){
            rawTags = post.text.split('-')[0].trim().split(' ');
            ticket = post.text.split(' - ')[1].trim();
            ticket = isNaN(parseInt(ticket)) ? null : parseInt(ticket);

            if (rawTags && rawTags.length > 0) {
                rawTags.forEach(element => {
                    if (element.startsWith("$")) tags.push(element);
                    else if (element.startsWith("REPOST")) repost.push(element);
                });
            }
            try {
                insertMessage(data.event.ts, data.event.user, tags, ticket, post.text)
            } catch (err) { console.error(err) }
        }else {
            // only insert when it's a new tiger post
            // insertMessage(data.event.ts,data.event.thread_ts,tags,data.event.text)
        } 
        res.send();
    }


}


function getTags(req, res) {
    const result = [];
    getDistinctTags().then(tags => {
        tags.forEach(tag => {
            const tagArr = tag.DISTINCT.split(',');
            tagArr.forEach(splittedTag => {
                if (result.indexOf(splittedTag) === -1 && splittedTag !== '$') {
                    result.push(splittedTag);
                }
            })
        })
        res.json({ tags: result });
    });
}


//TEST
// getTopPosts({query:"test"});

function getTopPosts(req, res) {
    let queue = [];
    let threads = [];
    //Get all messages based on the tags provided
    getMessageTSbyTag(req.query.tags.split(","), req.query.from)
        .then(dbresult => {
            const threads = Array.from(dbresult).sort((a, b) => { return b - a });
            if (threads.length > 10) threads.length = 10;//TODO pagination

            threads.forEach(thread => {
                thread.dataValues.thread_link = "https://vmware.slack.com/archives/" + keys.channel + "/p" + thread.message_ts
                queue.push(retrieveUsernameFromUserID(thread.user, thread.dataValues))
            });
            Promise.all(queue).then(threadWithUser => {
                res.set({
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Allow-Methods': 'GET, POST'
                })
                res.json(threadWithUser);
            })
        });

}

function getMessagesForTicket(req, res) {
    const prefixes = ["This is a Follow-Up for: <https://vmware.slack.com/archives/" + keys.channel + "/p",
                    ,"This is a Repost for: <https://vmware.slack.com/archives/"+ keys.channel + "/p"]
    const after = "> which was posted";
    const allThreads = [];

    const sendRes = (res) => {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST'
        })
        res.json(allThreads);
    }
    getLatestMessageForTicket(req.params.ticketID)
        .then(data => {
            if(data){
                message_ts = data.message_ts;
                const retrieveNextThread = (message_ts) => {
                    retrieveThreadsFromSlackAPI(message_ts).then(thread => {
                        if(thread && thread[0].attachments && process.env.NODE_ENV === "production"){
                            thread[0].text = thread[0].attachments[0].text;
                            thread[0].thread_link = "https://vmware.slack.com/archives/" + keys.channel + "/p" + thread[0].ts;
                        }
                        allThreads.push(thread);
                        let postPrefixSplit = [];
                        //PROD if the first reply is from the bot user                    
                        if (thread && thread[1] && !process.env.NODE_ENV || (process.env.NODE_ENV === "production" && thread[1].bot_id === "B60JCMYBD")) {//first reply
                            let thread_ts;
                            if (thread.length > 1) {
                                prefixes.forEach(prefix=>{
                                    if(postPrefixSplit.length<=1){
                                        postPrefixSplit = thread[1].text.split(prefix);
                                    }
                                })
                                console.log(postPrefixSplit)
                                if (postPrefixSplit.length > 1) {
                                    thread_ts = postPrefixSplit[1].split(after)[0];
                                    thread_ts = thread_ts.substring(0, thread_ts.length - 6) + "." + thread_ts.substring(thread_ts.length - 6, thread_ts.length);
                                    if (thread_ts) { retrieveNextThread(thread_ts) }
                                    else { sendRes(res); }
                                } else { sendRes(res); }
                            } else { sendRes(res); }
                        } else {
                            sendRes(res);
                        }
                    });
                }
                retrieveNextThread(message_ts);
            }else{
                sendRes(res)
            }
            
        })
    //     Promise.all(queue).then(messages => {
    //         if (messages) {
    //             messages.forEach(message => {
    //                 if (message) {
    //                     let thread = [];
    //                     message.forEach(reply => {
    //                             //TODO: parse
    //                             text = reply.attachments && reply.attachments[0].footer=="TigerBot" ? reply.text + '\n' + reply.attachments[0].text : reply.text;
    //                             thread.push({
    //                                 ts: reply.ts,
    //                                 text: text,
    //                                 user: reply.user,
    //                                 reactions:reply.reactions
    //                             });
    //                         })
    //                         threads.push(thread);
    //                     }
    //                 });
    //             }

    //             getAllUsers(threads).then(threads=>{


    // })
    // })
}

// /thread/1521981
function getAllUsers(threads) {
    return new Promise((res, rej) => {
        let q = [];
        threads.forEach((thread, i) => {
            thread[0].thread_link = "https://vmware.slack.com/archives/" + keys.channel + "/p" + thread[0].ts
            thread.forEach((post, j) => {
                if (thread[0].user) {
                    q.push(retrieveUsernameFromUserID(thread[0].user).then(result => {
                        thread[0].userInfo = result
                    }));
                } else if (thread[0].bot_id) {
                    //TODO, get bot user info
                }
            })
        })

        Promise.all(q).then(users => {
            res(threads)
        }).catch(rej)
    })
}


function postToThread(req, res) {
    console.log("======================");
    console.log(req.body);
    const message = req.body.message;
    const thread_ts = req.body.thread_ts;
    postMessageToThread(message, thread_ts).then(response => {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST'
        })
        res.status(200).send(response);
    }).catch(err => {
        console.error(err);
        throw err;
    });
}

module.exports = apiRouter;