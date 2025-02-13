const Sequelize = require('sequelize')

module.exports = class Chat extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            content: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            message_type: {
               type: Sequelize.ENUM('text', 'image', 'file'),
               allowNull: false,
               defaultValue: 'text',
            },
         },
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Chat',
            tableName: 'chats',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Chat.belongsTo(db.User, { foreignKey: 'senderId', targetKey: 'id', onDelete: 'CASCADE', as: 'Sender' })
      Chat.belongsTo(db.User, { foreignKey: 'receiverId', targetKey: 'id', onDelete: 'CASCADE', as: 'Receiver' })
      Chat.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
