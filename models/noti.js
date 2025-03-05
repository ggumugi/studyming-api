const Sequelize = require('sequelize')

module.exports = class Noti extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            message: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            isRead: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
         },
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Noti',
            tableName: 'notis',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Noti.belongsTo(db.User, { foreignKey: 'recieveId', targetKey: 'id', onDelete: 'CASCADE', as: 'Receiver' })
      Noti.belongsTo(db.User, { foreignKey: 'sendId', targetKey: 'id', onDelete: 'CASCADE', as: 'Sender' })
      Noti.hasMany(db.AdminAction, { foreignKey: 'notiId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
