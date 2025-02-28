// models/Channel.js 파일 수정
const Sequelize = require('sequelize')

module.exports = class Channel extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            shareChannel: {
               type: Sequelize.STRING(255),
               allowNull: true,
            },
            camChannel: {
               type: Sequelize.STRING(255),
               allowNull: true,
            },
            voiceChannel: {
               type: Sequelize.STRING(255),
               allowNull: true,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Channel',
            tableName: 'channels',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Channel.belongsTo(db.Studygroup, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
