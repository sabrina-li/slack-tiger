const Sequelize = require('sequelize');
const db = require("../../models");
const Op = Sequelize.Op;

function insertMessage(message_ts,user=null,tags=null,ticket=null,message_preview){
    tags = (tags.length === 0) ? null:tags.join(',');
    message_preview = (message_preview.length > 65535) ? message_preview.substring(0,65535):message_preview;
   
    db.Message.create({
        message_ts:message_ts,
        user:user,
        tags:tags,
        ticket_no:ticket,
        message_preview:message_preview
    }).then((results)=>{
        console.log("message ID: ", results.id, "created");
    }).catch(error=>{
        console.error(error);
    });
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
    return db.Message.findAll({ 
        where: { 
            tags: { [Op.or]: tags },
            createdAt: {
                [Op.lt]: new Date(),
                // [Op.gt]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
                }
        },
    })
}

module.exports={
    insertMessage : insertMessage,
    getDistinctTags : getDistinctTags,
    getMessageTSbyTag : getMessageTSbyTag,
    getLatestMessageForTicket: getLatestMessageForTicket
}