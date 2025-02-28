const Sequelize = require('sequelize')

module.exports = class Banned extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            bannedId: {
               // ✅ 기본 id를 bannedId로 매핑
               type: Sequelize.INTEGER,
               autoIncrement: true,
               primaryKey: true,
            },
            startDate: {
               type: Sequelize.DATE,
               allowNull: true,
            },
            endDate: {
               type: Sequelize.DATE,
               allowNull: true,
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
      Banned.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE', as: 'reportedUser' }) // 🚀 정지당한 유저
      Banned.belongsTo(db.User, { foreignKey: 'reportedById', targetKey: 'id', onDelete: 'CASCADE', as: 'reportedBy' }) // 🚀 신고한 유저
      Banned.belongsTo(db.Admin, { foreignKey: 'adminId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
