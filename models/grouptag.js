const Sequelize = require('sequelize')

module.exports = class GroupTag extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {},
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: '',
            tableName: '',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {}
}
