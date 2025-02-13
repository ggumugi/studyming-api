const Sequelize = require('sequelize')

module.exports = class Goals extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            monGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            tueGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            wedGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            thuGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            friGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            satGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            sunGoal: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Goals',
            tableName: 'goals',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Goals.belongsTo(db.Object, { foreignKey: 'objectId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
