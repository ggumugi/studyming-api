const Sequelize = require('sequelize')

module.exports = class Alltime extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            allTime: {
               type: Sequelize.TIME,
               allowNull: false,
               defaultValue: '00:00:00',
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Alltime',
            tableName: 'alltimes',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Alltime.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
