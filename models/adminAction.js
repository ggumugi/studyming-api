const Sequelize = require('sequelize')

module.exports = class AdminAction extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            type: {
               type: Sequelize.ENUM('ban', 'deletePost', 'deleteComment', 'deleteGroup', 'noti'),
               allowNull: false,
            },
            detail: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'AdminAction',
            tableName: 'adminActions',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      AdminAction.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      AdminAction.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
      AdminAction.belongsTo(db.Noti, { foreignKey: 'notiId', targetKey: 'id', onDelete: 'CASCADE' })
      AdminAction.belongsTo(db.Comment, { foreignKey: 'commentId', targetKey: 'id', onDelete: 'CASCADE' })
      AdminAction.belongsTo(db.Post, { foreignKey: 'postId', targetKey: 'id', onDelete: 'CASCADE' })
      AdminAction.belongsTo(db.Admin, { foreignKey: 'adminId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
