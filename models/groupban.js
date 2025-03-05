const Sequelize = require('sequelize')

module.exports = class Groupban extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            groupId: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            userId: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Groupban',
            tableName: 'groupbans',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Groupban.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
      Groupban.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
