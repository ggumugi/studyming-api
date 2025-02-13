const Sequelize = require('sequelize')

module.exports = class Time extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            time: {
               type: Sequelize.TIME,
               allowNull: false,
               defaultValue: '00:00:00',
            },
            YTime: {
               type: Sequelize.TIME,
               allowNull: false,
               defaultValue: '00:00:00',
            },
         },
         {
            sequelize,
            timestamps: false, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Time',
            tableName: 'times',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Time.belongsTo(db.User, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
