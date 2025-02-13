const Sequelize = require('sequelize')

module.exports = class Point extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            point: {
               type: Sequelize.INTEGER,
               allowNull: false,
               defaultValue: 0,
            },
         },
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Point',
            tableName: 'points',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Point.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Point.hasMany(db.Purchase, { foreignKey: 'pointId', sourceKey: 'id', onDelete: 'CASCADE' })
      Point.hasMany(db.Pointhistory, { foreignKey: 'pointId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
