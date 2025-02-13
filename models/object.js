const Sequelize = require('sequelize')

module.exports = class Object extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {},
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Object',
            tableName: 'objects',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Object.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
      Object.hasMany(db.Mindset, { foreignKey: 'objectId', sourceKey: 'id', onDelete: 'CASCADE' })
      Object.hasMany(db.Goals, { foreignKey: 'objectId', sourceKey: 'id', onDelete: 'CASCADE' })
      Object.hasMany(db.DDay, { foreignKey: 'objectId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
