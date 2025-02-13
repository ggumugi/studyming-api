const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development'
const config = require('../config/config')[env]

const Admin = require('./admin')
const AdminAction = require('./adminAction')
const Alltime = require('./alltime')
const Auth = require('./auth')
const Banned = require('./banned')
const Captcha = require('./captcha')
const Channel = require('./channel')
const Chat = require('./chat')
const Comment = require('./comment')
const DDay = require('./dDay')
const Goals = require('./goals')
const Groupmember = require('./groupmember')
const Grouptime = require('./grouptime')
const Hashtag = require('./hashtag')
const Images = require('./images')
const Interest = require('./interest')
const Item = require('./item')
const Liked = require('./liked')
const Mindset = require('./mindset')
const Myitem = require('./myitem')
const Noti = require('./noti')
const Object = require('./object')
const Point = require('./point')
const Pointhistory = require('./pointhistory')
const Post = require('./post')
const Purchase = require('./purchase')
const Report = require('./report')
const Studygroup = require('./studygroup')
const Time = require('./time')
const User = require('./user')

const db = {}
const sequelize = new Sequelize(config.database, config.username, config.password, config)

db.sequelize = sequelize
db.Admin = Admin
db.AdminAction = AdminAction
db.Alltime = Alltime
db.Auth = Auth
db.Banned = Banned
db.Captcha = Captcha
db.Channel = Channel
db.Chat = Chat
db.Comment = Comment
db.DDay = DDay
db.Goals = Goals
db.Groupmember = Groupmember
db.Grouptime = Grouptime
db.Hashtag = Hashtag
db.Images = Images
db.Interest = Interest
db.Item = Item
db.Liked = Liked
db.Mindset = Mindset
db.Myitem = Myitem
db.Noti = Noti
db.Object = Object
db.Point = Point
db.Pointhistory = Pointhistory
db.Post = Post
db.Purchase = Purchase
db.Report = Report
db.Studygroup = Studygroup
db.Time = Time
db.User = User

Admin.init(sequelize)
AdminAction.init(sequelize)
Alltime.init(sequelize)
Auth.init(sequelize)
Banned.init(sequelize)
Captcha.init(sequelize)
Channel.init(sequelize)
Chat.init(sequelize)
Comment.init(sequelize)
DDay.init(sequelize)
Goals.init(sequelize)
Groupmember.init(sequelize)
Grouptime.init(sequelize)
Hashtag.init(sequelize)
Images.init(sequelize)
Interest.init(sequelize)
Item.init(sequelize)
Liked.init(sequelize)
Mindset.init(sequelize)
Myitem.init(sequelize)
Noti.init(sequelize)
Object.init(sequelize)
Point.init(sequelize)
Pointhistory.init(sequelize)
Post.init(sequelize)
Purchase.init(sequelize)
Report.init(sequelize)
Studygroup.init(sequelize)
Time.init(sequelize)
User.init(sequelize)

Admin.associate(db)
AdminAction.associate(db)
Alltime.associate(db)
Auth.associate(db)
Banned.associate(db)
Channel.associate(db)
Chat.associate(db)
Comment.associate(db)
DDay.associate(db)
Goals.associate(db)
Groupmember.associate(db)
Grouptime.associate(db)
Hashtag.associate(db)
Images.associate(db)
Interest.associate(db)
Item.associate(db)
Liked.associate(db)
Mindset.associate(db)
Myitem.associate(db)
Noti.associate(db)
Object.associate(db)
Point.associate(db)
Pointhistory.associate(db)
Post.associate(db)
Purchase.associate(db)
Report.associate(db)
Studygroup.associate(db)
Time.associate(db)
User.associate(db)

module.exports = db
