const Sequelize = require('sequelize')

module.exports = class Mindset extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            mindset: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Mindset',
            tableName: 'mindsets',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Mindset.belongsTo(db.Object, { foreignKey: 'objectId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
