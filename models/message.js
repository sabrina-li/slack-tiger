module.exports = function(sequelize, DataTypes) {
    const Message = sequelize.define("Message", {
        message_ts: {
            type: DataTypes.STRING,
            allowNull: false
        },
        tags: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ticket_no: {
            type: DataTypes.INTEGER
        },
        user: {
            type:DataTypes.STRING
        },
        has_reply:{
            type:DataTypes.BOOLEAN,
            defaultValue:false
        },
        alert_cnt:{
            type:DataTypes.INTEGER,
            defaultValue:0
        },
        alert15_ts:{
            type:DataTypes.STRING
        },
        alert30_ts:{
            type:DataTypes.STRING
        },
        alert35_ts:{
            type:DataTypes.STRING
        },
        message_preview: {
            type: DataTypes.TEXT
        }
    });

    return Message;
};