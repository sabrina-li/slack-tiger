module.exports = function(sequelize, DataTypes) {
    const User = sequelize.define("User", {
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

    return User;
};