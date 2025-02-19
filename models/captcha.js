const Sequelize = require('sequelize')

module.exports = class Captcha extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            img: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            text: {
               type: Sequelize.STRING(50),
               allowNull: false,
            },
            token: {
               type: Sequelize.STRING(255),
               allowNull: false,
               unique: true,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Captcha',
            tableName: 'captchas',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }
}
