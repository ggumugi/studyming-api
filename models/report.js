const Sequelize = require('sequelize')

module.exports = class Report extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            reason: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
            confirm: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Report',
            tableName: 'reports',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Report.belongsTo(db.User, { foreignKey: 'reportedById', targetKey: 'id', onDelete: 'CASCADE', as: 'ReportedBy' })
      Report.belongsTo(db.User, { foreignKey: 'reportedUserId', targetKey: 'id', onDelete: 'CASCADE', as: 'ReportedUser' })
   }
}
