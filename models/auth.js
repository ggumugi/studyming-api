const Sequelize = require('sequelize')

module.exports = class Auth extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            type: {
               type: Sequelize.ENUM('local', 'google', 'kakao'),
               allowNull: false,
               defaultValue: 'local',
            },
            token: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Auth',
            tableName: 'auths',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Auth.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
