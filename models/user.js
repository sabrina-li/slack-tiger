module.exports = function(sequelize, DataTypes) {
    const Message = sequelize.define("Message", {
        user_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING
        },
        last_name: {
            type:DataTypes.STRING
        }
    });

    return Message;
};