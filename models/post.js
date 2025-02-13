const Sequelize = require('sequelize')

module.exports = class Post extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            category: {
               type: Sequelize.ENUM('QnA', 'free', 'noti', 'inquiry'),
               allowNull: false,
            },
            title: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
            content: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Post',
            tableName: 'posts',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Post.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Post.hasMany(db.Comment, { foreignKey: 'postId', sourceKey: 'id', onDelete: 'CASCADE' })
      Post.hasMany(db.Images, { foreignKey: 'postId', sourceKey: 'id', onDelete: 'CASCADE' })
      Post.hasMany(db.AdminAction, { foreignKey: 'postId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
