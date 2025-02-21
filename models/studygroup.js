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
               allowNull: true,
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
               allowNull: true,
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
               type: Sequelize.INTEGER,
               allowNull: true,
            },
            timeGoal: {
               type: Sequelize.INTEGER,
               allowNull: true,
            },
         },
         {
            sequelize,
            timestamps: true, //createAt, updateAt ..등 자동 생성
            underscored: false,
            modelName: 'Studygroup',
            tableName: 'studygroups',
            paranoid: false, //deleteAt 사용 X
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Studygroup.belongsToMany(db.User, { foreignKey: 'groupId', as: 'BannedUsers', through: 'Groupban' })
      Studygroup.belongsToMany(db.Hashtag, { foreignKey: 'groupId', as: 'Hashtaged', through: 'Grouptag' })
      Studygroup.belongsTo(db.User, { foreignKey: 'createdBy', targetKey: 'id', onDelete: 'CASCADE', as: 'Leader' })
      Studygroup.hasOne(db.Channel, { foreignKey: 'groupId', targetKey: 'id', onDelete: 'CASCADE' })
      Studygroup.hasMany(db.Liked, { foreignKey: 'groupId', sourceKey: 'id', onDelete: 'CASCADE' })
      Studygroup.hasMany(db.AdminAction, { foreignKey: 'groupId', sourceKey: 'id', onDelete: 'CASCADE' })
      Studygroup.hasMany(db.Grouptime, { foreignKey: 'groupId', sourceKey: 'id', onDelete: 'CASCADE' })
      Studygroup.hasMany(db.Groupmember, { foreignKey: 'groupId', sourceKey: 'id', onDelete: 'CASCADE' })
      Studygroup.hasMany(db.Chat, { foreignKey: 'groupId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
