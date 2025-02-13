const Sequelize = require('sequelize')

module.exports = class Groupmember extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            role: {
               type: Sequelize.ENUM('member', 'leader'),
               allowNull: false,
               defaultValue: 'member',
            },
            status: {
               type: Sequelize.ENUM('on', 'off'),
               allowNull: false,
               defaultValue: 'off',
            },
            access: {
               type: Sequelize.DATE,
               allowNull: true,
            },
            rewards: {
               type: Sequelize.INTEGER,
               allowNull: false,
               defaultValue: 0,
            },
            share_state: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            cam_state: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            voice_state: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
         },
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Groupmember',
            tableName: 'groupmembers',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Groupmember.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Groupmember.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
