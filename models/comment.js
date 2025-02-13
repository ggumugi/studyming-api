const Sequelize = require('sequelize')

module.exports = class Comment extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            content: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            selected: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            img: {
               type: Sequelize.STRING(255),
               allowNull: true,
            },
         },
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Comment',
            tableName: 'comments',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Comment.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Comment.belongsTo(db.Post, { foreignKey: 'postId', targetKey: 'id', onDelete: 'CASCADE' })
      Comment.hasMany(db.AdminAction, { foreignKey: 'commentId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
