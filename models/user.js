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
        real_name: {
            type: DataTypes.STRING
        }
    });

    return User;
};