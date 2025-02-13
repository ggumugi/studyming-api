const Sequelize = require('sequelize')

module.exports = class Pointhistory extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            history: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
            type: {
               type: Sequelize.ENUM('use', 'stack', 'charge'),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Pointhistory',
            tableName: 'pointhistorys',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Pointhistory.belongsTo(db.Point, { foreignKey: 'pointId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
