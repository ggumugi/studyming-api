const Sequelize = require('sequelize')

module.exports = class Purchase extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            fee: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Purchase',
            tableName: 'purchases',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Purchase.belongsTo(db.Point, { foreignKey: 'pointId', targetKey: 'id', onDelete: 'CASCADE' })
      Purchase.belongsTo(db.Item, { foreignKey: 'itemId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
