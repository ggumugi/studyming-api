const Sequelize = require('sequelize')

module.exports = class Hashtag extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            name: {
               type: Sequelize.STRING(100),
               allowNull: false,
               unique: true,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Hashtag',
            tableName: 'hashtags',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Hashtag.belongsToMany(db.Studygroup, { foreignKey: 'tagId', targetKey: 'id', as: 'Tagedgroup', through: 'Grouptag' })
   }
}
