const Sequelize = require('sequelize')

module.exports = class Liked extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            liked: {
               type: Sequelize.INTEGER,
               allowNull: false,
               defaultValue: 0,
            },
         },
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Liked',
            tableName: 'likeds',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Liked.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Liked.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
