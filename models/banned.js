const Sequelize = require('sequelize')

module.exports = class Banned extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            startDate: {
               type: Sequelize.DATE,
               allowNull: false,
            },
            endDate: {
               type: Sequelize.DATE,
               allowNull: false,
            },
            reason: {
               // ✅ 추가: 신고 사유 저장
               type: Sequelize.STRING(255),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Banned',
            tableName: 'banneds',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Banned.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Banned.belongsTo(db.Admin, { foreignKey: 'adminId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
