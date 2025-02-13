const Sequelize = require('sequelize')

module.exports = class Images extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            path: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: true,
            underscored: false,
            modelName: 'Images',
            tableName: 'images',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Images.belongsTo(db.Post, { foreignKey: 'postId', targetKey: 'id', onDelete: 'CASCADE' })
   }
}
