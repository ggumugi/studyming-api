const Sequelize = require('sequelize')

module.exports = class Myitem extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            limit: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Myitem',
            tableName: 'myitems',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Myitem.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Myitem.belongsTo(db.Item, { foreignKey: 'itemId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
