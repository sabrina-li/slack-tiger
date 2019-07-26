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
        message_preview: {
            type: DataTypes.TEXT
        }
    });

    return Message;
};