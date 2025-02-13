const Sequelize = require('sequelize')

module.exports = class DDay extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            dName: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            dDay: {
               type: Sequelize.DATEONLY,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'DDay',
            tableName: 'dDays',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      DDay.belongsTo(db.Object, { foreignKey: 'objectId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
