const Sequelize = require('sequelize')

module.exports = class Admin extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {},
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Admin',
            tableName: 'admins',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Admin.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Admin.hasMany(db.Noti, { foreignKey: 'adminId', sourceKey: 'id', onDelete: 'CASCADE' })
      Admin.hasMany(db.Banned, { foreignKey: 'adminId', sourceKey: 'id', onDelete: 'CASCADE' })
      Admin.hasMany(db.AdminAction, { foreignKey: 'adminId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
