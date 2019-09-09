const Sequelize = require('sequelize');
const db = require("../../models");
const Op = Sequelize.Op;

function insertMessage(message_ts,user=null,tags=null,ticket=null,message_preview){
    tags = (tags.length === 0) ? null:tags.join(',');
    message_preview = (message_preview.length > 65535) ? message_preview.substring(0,65535):message_preview;
   
    return db.Message.create({
        message_ts:message_ts,
        user:user,
        tags:tags,
        ticket_no:ticket,
        message_preview:message_preview
    })
}


function getDistinctTags(){
    return db.Message.aggregate('tags', 'DISTINCT', { plain: false });
}

function getLatestMessageForTicket(ticketID){
    return db.Message.findOne({
        where:{
            ticket_no:ticketID
        },
        order: [ [ 'createdAt', 'DESC' ]]
    });
}

function getMessageTSbyTag(tags){
    const tagsCreteria = [];
    tags.forEach(tag=>{
        tagsCreteria.push({[Op.like]:'%'+tag+'%'})
    })
    return db.Message.findAll({ 
        where: { 
            tags: { [Op.or]: tagsCreteria
            },
            createdAt: {
                [Op.lt]: new Date(),
                // [Op.gt]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
                }
        },
        // logging: console.log
    })
}

function getUserbyId(id){
    return db.User.findOne({ 
        where: { 
            user_id: id
        },
    })
}


function createOrUpdateUser(user_id,username=null,real_name=null){

    db.User.findOne({ where: {user_id:user_id} })
        .then(function(obj) {
            if(obj) { // update
                if(obj.real_name!=real_name)
                return obj.update({
                    user_id:user_id,
                    username:username,
                    real_name:real_name
                }).then((results)=>{
                    console.log("user ID: ", results.id, "updated")});
            }
            else { // insert
                return db.User.create({
                    user_id:user_id,
                    username:username,
                    real_name:real_name
                }).then((results)=>{
                    console.log("user ID: ", results.id, "created");});
            }
        }).catch(error=>{
            console.error(error);
        });
}

const setHasReply = (threadts) => {
    //console.log("setHasReply",threadts)
    db.Message.findOne({where:{message_ts:threadts, has_reply:false}})
        .then(message=>{
            if(message){
                return message.update({
                    has_reply:true
                })
            }else{
                throw("no message found: "+threadts);
            }
        }).then(()=>{
            console.log("update to has reply:",threadts)
        }).catch(console.error)
}

const setSendAlert = (threadts,alertts) => {
    //console.log(alertts)
    db.Message.findOne({where:{message_ts:threadts, alerted:false}})
        .then(message=>{
            return message.update({
                alerted:true,
                alert_ts:alertts
            })
        }).then(message=>{
            //console.log("alert ts:",message.alert_ts)
            console.log("update to alerted:",threadts)
        }).catch(console.error)
}

const getAlert = (threadts) =>{
    //console.log("getalert",threadts)
    return db.Message.findOne({where:{message_ts:threadts, alerted:true}})
}

const removeThread = (threadts) => {
	return db.Message.destroy({where:{message_ts:threadts}});
}

module.exports={
    insertMessage ,
    getDistinctTags ,
    getMessageTSbyTag ,
    getLatestMessageForTicket,
    getUserbyId ,
    createOrUpdateUser ,
    setHasReply ,
    setSendAlert ,
    getAlert,
	removeThread
}