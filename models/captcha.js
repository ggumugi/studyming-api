const Sequelize = require('sequelize')

module.exports = class Captcha extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {},
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Cart',
            tableName: 'carts',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {}
}
