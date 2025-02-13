const Sequelize = require('sequelize')

module.exports = class Grouptime extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            time: {
               type: Sequelize.TIME,
               allowNull: false,
               defaultValue: '00:00:00',
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Grouptime',
            tableName: 'grouptimes',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Grouptime.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Grouptime.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
