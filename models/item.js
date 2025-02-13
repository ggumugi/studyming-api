const Sequelize = require('sequelize')

module.exports = class Item extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            name: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
            detail: {
               type: Sequelize.STRING(255),
               allowNull: true,
            },
            price: {
               type: Sequelize.INTEGER,
               allowNull: false,
               defaultValue: 0,
            },
            img: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
            limit: {
               type: Sequelize.INTEGER,
               allowNull: true,
               defaultValue: 0,
            },
            type: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Item',
            tableName: 'items',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Item.hasMany(db.Purchase, { foreignKey: 'itemId', sourceKey: 'id', onDelete: 'CASCADE' })
      Item.hasMany(db.Myitem, { foreignKey: 'itemId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
