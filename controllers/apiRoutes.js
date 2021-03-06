const express = require("express");
const apiRouter = express.Router();//for html routes

const { keys } = require('../config/secrets');

const databaseUtils = require('./Util/databaseUtils');
const slackapi = require('./Util/slackapi-int');


//TODO: object decontruction
const insertMessage = databaseUtils.insertMessage
    , getDistinctTags = databaseUtils.getDistinctTags
    , getMessageTSbyTag = databaseUtils.getMessageTSbyTag
    , getLatestMessageForTicket = databaseUtils.getLatestMessageForTicket
    , retrieveThreadsFromSlackAPI = slackapi.retrieveThreadsFromSlackAPI
    , retrieveUsernameFromUserID = slackapi.retrieveUsernameFromUserID
    , postMessageToThread = slackapi.postMessageToThread
    , getUserbyId = databaseUtils.getUserbyId
    , createOrUpdateUser = databaseUtils.createOrUpdateUser
    , setHasReply = databaseUtils.setHasReply
    , getAlert = databaseUtils.getAlert
    , updateAlert = slackapi.updateAlert
	, removeThread = databaseUtils.removeThread;

apiRouter.get('/tags', getTags);
apiRouter.post('/events', saveEvents);
apiRouter.get('/posts', getTopPosts);
apiRouter.get('/ticket/:ticketID', getMessagesForTicket);
apiRouter.post('/reply', postToThread);
apiRouter.get('/user/:userID',getUser);



// used for event listener, to save incoming events to DB
// POST /events
function saveEvents(req, res,io) {
    const data = req.body;
    let tags = [], repost = [], rawtags, thread_ts;
    //TODO subtype message changed
    //TODO logging
	if (data.challenge) {
        res.send(data.challenge)
    } else {
        let post;

        //DEV
        if (!process.env.NODE_ENV && data.event.channel == keys.channel && data.event.thread_ts === undefined && data.event.subtype === undefined) {
            post = data.event;
        }else if(!process.env.NODE_ENV && data.event.channel == keys.channel && data.event.thread_ts){
            setHasReply(data.event.thread_ts);
            getAlert(data.event.thread_ts).then(message=>{
                if(message && message.alert15_ts){
                    updateAlert(message.alert15_ts);//API: send reply to he alert thread once there's a reply
                }
                if(message && message.alert30_ts){
                    updateAlert(message.alert30_ts);//API: send reply to he alert thread once there's a reply
                }
                if(message && message.alert35_ts){
                    updateAlert(message.alert35_ts);//API: send reply to he alert thread once there's a reply
                }
            });
        }
        //PROD
        if(process.env.NODE_ENV === "production" && data.event.channel == keys.channel 
            && data.event.thread_ts
            && data.event.bot_id !== 'B60JCMYBD'// not from suppourt bot
            && data.event.parent_user_id !== data.event.user){//not from user him/herself
                //has a new reply
                getAlert(data.event.thread_ts).then(message=>{
                    if(message && message.alert15_ts && !message.has_reply){
                        updateAlert(message.alert15_ts);//API: send reply to he alert thread once there's a reply
                    }
                    if(message && message.alert30_ts && !message.has_reply){
                        updateAlert(message.alert30_ts);//API: send reply to he alert thread once there's a reply
                    }
                    if(message && message.alert35_ts && !message.has_reply){
                        updateAlert(message.alert35_ts);//API: send reply to he alert thread once there's a reply
                    }
					setHasReply(data.event.thread_ts);
                });
				setHasReply(data.event.thread_ts);
        }
		
		console.log("logging event: ",data.event.channel)
		console.log("logging event: ",data.event.subtype)
		console.log("logging event: ",data.event.text)
		console.log(data.event.attachments?data.event.attachments[0]:'');
        if (process.env.NODE_ENV === "production" && data.event.channel == keys.channel 
            && data.event.subtype === undefined && data.event.attachments && data.event.text === ''
            && data.event.attachments[0].footer === 'TigerBot') {
            post = data.event.attachments[0];
            //not listening in tiger for testing 
            //not listening to anything other than new post/reply
        }
		if (process.env.NODE_ENV === "production" && data.event.channel == keys.channel 
            && data.event.subtype === "message_deleted"
			&& data.event.previous_message && data.event.previous_message.thread_ts
			&& data.event.deleted_ts === data.event.previous_message.thread_ts){
			console.log("message deleted:")
			console.log(data.event)
			console.log(data.event.previous_message.thread_ts);
			removeThread(data.event.previous_message.thread_ts);
        }
        if(post && post.text && post.text.split('-').length>1){
            rawTags = post.text.split('-')[0].trim().replace(/ /g,'').split('$');
            ticket = post.text.split(' - ')[1].trim();
            ticket = isNaN(parseInt(ticket)) ? null : parseInt(ticket);
            if (rawTags && rawTags.length > 0) {
                rawTags.forEach(element => {
                    if (element.startsWith("REPOST")) repost.push(element)
                    else if(element) tags.push(element);
                });
            }
            try {
				console.log("inserting message",data.event)
                insertMessage(data.event.ts, data.event.user, tags, ticket, post.text).then((result)=>{
                    getOneUser(result.user, result.dataValues).then(resultsWithUser=>{
                        req.io.sockets.emit('message', resultsWithUser);
                    }).catch(error=>{
                        console.error(error);
                    });
                }).catch(error=>{
                    console.error(error);
                });
                
            } catch (err) { console.error(err) }
        }else {
            // only insert when it's a new tiger post
            // insertMessage(data.event.ts,data.event.thread_ts,tags,data.event.text)
        } 
        res.send();
    }


}

//GET tags from db distinct tags only
// GET /tags
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

function getUser(req, res) {
    const userID = req.params.userID;
    getUserbyId(userID).then(user=>{
        if(user && user.length>0){
            res.json(user)
        }else{
            retrieveUsernameFromUserID(userID,{user})
            .then(result=>{
                createOrUpdateUser(userID,result.userInfo.username,result.userInfo.real_name)
                res.json(result)
            })
            .catch(console.error)
        }
    }).catch(console.error)
}



//TEST
// getTopPosts({query:"test"});
// get most recent 10 posts from DB based on message ts
// GET /posts
function getTopPosts(req, res) {
    let queue = [];
    let threads = [];
    //Get all messages based on the tags provided from DB
    getMessageTSbyTag(req.query.tags.split(","), req.query.from)
        .then(dbresult => {
            const threads = Array.from(dbresult).sort((a, b) => { return Number(b.message_ts) - Number(a.message_ts) });
            if (threads.length > 10) threads.length = 10;//TODO pagination

            threads.forEach(thread => {
                thread.dataValues.thread_link = "https://vmware.slack.com/archives/" + keys.channel + "/p" + thread.message_ts
                queue.push(getOneUser(thread.user, thread.dataValues))
                //TODO: get reply count for each thread
            });
            Promise.all(queue).then(threadWithUser => {
                // threadWithUser.sort((a,b)=>{return a.thread_ts-b.thread_ts})
                res.set({
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                    'Access-Control-Allow-Methods': 'GET, POST'
                })
                res.json(threadWithUser);
            })
        });

}

// GET all messages from one ticket
// GET /ticket/1521070
function getMessagesForTicket(req, res) {
    //prefixes to recognize if this is post by  bot to find before or after messages
    const prefixes = ["This is a Follow-Up for: <https://vmware.slack.com/archives/" + keys.channel + "/p",
                    ,"This is a Repost for: <https://vmware.slack.com/archives/"+ keys.channel + "/p"]
    const after = "> which was posted";
    let allThreads = [];
    //allThreads contain all the posts/threads posted for this ticket
    

    const sendRes = (res,data) => {
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST'
        })
        res.json(data);
    }

    //getting all info from one thread 
    const retrieveNextThread = (message_ts) => {
            retrieveThreadsFromSlackAPI(message_ts).then(thread => {
                //thread is the entire thread(including all replies) for this message_ts
    
                let postPrefixSplit = [];
                let next_thread_ts;
                 
                if(thread){
                    // the post message contains the thread_ts, creating a link to the slack("open in slack")
                    if(thread[0].attachments && process.env.NODE_ENV === "production"){
                        thread[0].text = thread[0].attachments[0].text;
                        thread[0].thread_link = "https://vmware.slack.com/archives/" + keys.channel + "/p" + thread[0].ts;
                    }
                    
                    //PROD if the first reply is from the bot user    
                    //have first reply and is from the support bot
                    
                    if ((thread[1] && !process.env.NODE_ENV) || (thread[1] && process.env.NODE_ENV === "production" && thread[1].bot_id === "B60JCMYBD")) {
                            //find and split each bot message to get all threads in the chain
                            //thread[1] is the first reply in the current thread
                            prefixes.forEach(prefix=>{
                                if(postPrefixSplit.length<=1){
                                    postPrefixSplit = thread[1].text.split(prefix);
                                }
                            })
                            if (postPrefixSplit.length > 1) {
                                next_thread_ts = postPrefixSplit[1].split(after)[0];
                                next_thread_ts = next_thread_ts.substring(0, next_thread_ts.length - 6) + "." + next_thread_ts.substring(next_thread_ts.length - 6, next_thread_ts.length);
                            } 
                    }

                    
                    //Get all users for this thread
                    //for each message/reply getting the user
                    let repliesQueue = [];
                    thread.forEach(reply=>{
                        repliesQueue.push(getOneUser(reply.user,reply));
                    })
                    Promise.all(repliesQueue).then(thread=>{
                        allThreads.push(thread);
                        if (next_thread_ts) { retrieveNextThread(next_thread_ts) }
                        else{sendRes(res,allThreads)}
                    })
                }
            });
    }

    getLatestMessageForTicket(req.params.ticketID)
        .then(data => {
            if(data){
                message_ts = data.message_ts;
                retrieveNextThread(message_ts);
            }else{//TODO: if the ticketId is none
                sendRes(res,[])
            }
        })
}


// get one user by  ID, first check in DB, if not in DB, get via API then write to DB
function getOneUser(userID,message) {
    return new Promise((res, rej) => {
        if(message.username) {
            message.userInfo ={username:message.username,real_name:message.username}
            res(message);
        }
        getUserbyId(userID).then(user=>{
            if(user && user.length>0){
                message.userInfo = user;
                res(message)
            }else{
                retrieveUsernameFromUserID(userID,message)
                .then(message=>{
                    createOrUpdateUser(message.user,message.userInfo.username,message.userInfo.real_name)
                    res(message)
                })
                .catch(rej)
            }
        }).catch(rej)
        
    })
}


function postToThread(req, res) {
    const message = req.body.message;
    const thread_ts = req.body.thread_ts;
    postMessageToThread(message, thread_ts).then(response => {
        getOneUser(response.message.user,response.message).then(responseWithUser=>{
            res.set({
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Methods': 'GET, POST'
            })
            res.status(200).send(responseWithUser);
        })
        
    }).catch(err => {
        console.error(err);
        throw err;
    });
}



module.exports =  apiRouter