const Sequelize = require('sequelize')

module.exports = class User extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            login_id: {
               type: Sequelize.STRING(100),
               allowNull: false,
               unique: true,
            },
            email: {
               type: Sequelize.STRING(255),
               allowNull: false,
               unique: true,
            },
            password: {
               type: Sequelize.STRING(255),
               allowNull: false,
            },
            role: {
               type: Sequelize.ENUM('USER', 'ADMIN'),
               allowNull: false,
               defaultValue: 'USER',
            },
            nickname: {
               type: Sequelize.STRING(100),
               allowNull: false,
               unique: true,
            },
            name: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            status: {
               type: Sequelize.ENUM('ACTIVE', 'BANNED', 'SLEEP'),
               allowNull: false,
               defaultValue: 'ACTIVE',
            },
            gender: {
               type: Sequelize.ENUM('MALE', 'FEMALE', 'NONE'),
               allowNull: false,
               defaultValue: 'NONE',
            },
            birth: {
               type: Sequelize.DATEONLY,
               allowNull: true,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {}
}
