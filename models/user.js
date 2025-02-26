const Sequelize = require('sequelize')

module.exports = class User extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            loginId: {
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
            google: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
            },
            kakao: {
               type: Sequelize.BOOLEAN,
               allowNull: false,
               defaultValue: false,
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

   static associate(db) {
      User.hasMany(db.Studygroup, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.belongsToMany(db.Studygroup, { foreignKey: 'userId', as: 'BannedGroups', through: 'Groupban' })
      User.belongsToMany(db.Studygroup, { foreignKey: 'userId', as: 'LikedGroups', through: 'Likedgroup' })
      User.hasMany(db.Noti, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasOne(db.Time, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasOne(db.Object, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Post, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Comment, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Liked, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasOne(db.Admin, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.AdminAction, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      // 🚀 신고당한 유저 (정지된 유저)
      User.hasMany(db.Banned, { foreignKey: 'userId', sourceKey: 'id', as: 'BansReceived' })

      // 🚀 신고한 유저 (신고를 넣은 유저)
      User.hasMany(db.Banned, { foreignKey: 'reportedById', sourceKey: 'id', as: 'BansGiven' })
      User.hasOne(db.Alltime, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Grouptime, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Auth, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Chat, { foreignKey: 'senderId', sourceKey: 'id', as: 'SenderChat', onDelete: 'CASCADE' })
      User.hasMany(db.Chat, { foreignKey: 'receiverId', sourceKey: 'id', as: 'ReceiverChat', onDelete: 'CASCADE' })
      User.hasMany(db.Interest, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Report, { foreignKey: 'reportedById', sourceKey: 'id', as: 'ReportedBy', onDelete: 'CASCADE' })
      User.hasMany(db.Report, { foreignKey: 'reportedUserId', sourceKey: 'id', as: 'ReportedUser', onDelete: 'CASCADE' })
      User.hasMany(db.Myitem, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasOne(db.Point, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
      User.hasMany(db.Groupmember, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' })
   }
}
