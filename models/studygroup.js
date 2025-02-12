const Sequelize = require('sequelize')

module.exports = class Studygroup extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            name: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            maxMembers: {
               type: Sequelize.INTEGER,
               allowNull: false,
               defaultValue: 6,
            },
            countMembers: {
               type: Sequelize.INTEGER,
               allowNull: false,
               defaultValue: 1,
            },
            studyDay: {
               type: Sequelize.DATEONLY,
               allowNull: true,
            },
            startTime: {
               type: Sequelize.TIME,
               allowNull: true,
            },
            endTime: {
               type: Sequelize.TIME,
               allowNull: true,
            },
            startDate: {
               type: Sequelize.DATEONLY,
               allowNull: false,
            },
            endDate: {
               type: Sequelize.DATEONLY,
               allowNull: true,
            },

            description: {
               type: Sequelize.TEXT,
               allowNull: true,
            },
            reward: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            locked: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            password: {
               type: Sequelize.STRING(100),
               allowNull: false,
               defaultValue: false,
            },
            open: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: true,
            },
            cam: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            sharing: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            capInterval: {
               type: Sequelize.TIME,
               allowNull: true,
            },
            // 여기서부터하기

            currentMembers: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            isPrivate: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
            },
            isArchived: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
            },
            createdAt: {
               type: Sequelize.DATE,
               defaultValue: Sequelize.NOW,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: '',
            tableName: '',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {}
}
