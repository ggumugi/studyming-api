// app.js
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
const http = require('http')
require('dotenv').config()
const cors = require('cors')
const setupChatSocketServer = require('./server/chatsocketServer')

const { sequelize } = require('./models')
const passportConfig = require('./passport')
const authRouter = require('./routes/auth')
const dDayRouter = require('./routes/dDay')
const mindsetRouter = require('./routes/mindset')
const goalsRouter = require('./routes/goals')
const pointRouter = require('./routes/point')
const itemRouter = require('./routes/item')
const postRouter = require('./routes/post')
const studygroupRouter = require('./routes/studygroup')
const commentRouter = require('./routes/comment')
const adminpostRouter = require('./routes/adminpost')
const bannedRouter = require('./routes/banned')
const likedRouter = require('./routes/liked')
const groupmemberRouter = require('./routes/groupmember')
const screenShareRouter = require('./routes/screenShare')
const grouptimeRouter = require('./routes/grouptime')
const timeRouter = require('./routes/time')
const notiRouter = require('./routes/noti')
const studyListRouter = require('./routes/studyList')

// Express 앱 생성
const app = express()

// HTTP 서버 생성
const server = http.createServer(app)

// 스케줄링 작업 실행
require('./schedule/schedule')

// Passport 설정
passportConfig()

app.set('port', process.env.PORT || 8002)

// 시퀄라이즈를 사용한 DB 연결
sequelize
   .sync({ force: false })
   .then(() => {
      console.log('데이터베이스 연결 성공')
   })
   .catch((err) => {
      console.error('데이터베이스 연결 실패:', err)
   })

app.use((req, res, next) => {
   console.log('🔍 [DEBUG] 요청마다 세션 확인:', req.session)
   next()
})

// 미들웨어 설정
app.use(cors({ origin: process.env.FRONTEND_APP_URL, credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 세션 설정
const sessionMiddleware = session({
   secret: process.env.COOKIE_SECRET,
   resave: false,
   saveUninitialized: true,
   cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
   },
})
app.use(sessionMiddleware)

// ✅ 새로운 채팅 소켓 서버 실행
const chatIo = setupChatSocketServer(server, sessionMiddleware)

// Passport 초기화 및 세션 사용
app.use(passport.initialize())
app.use(passport.session())

// 라우터 설정
app.use('/auth', authRouter)
app.use('/signup', authRouter)
app.use('/dDay', dDayRouter)
app.use('/mindset', mindsetRouter)
app.use('/goals', goalsRouter)
app.use('/point', pointRouter)
app.use('/item', itemRouter)
app.use('/post', postRouter)
app.use('/studygroup', studygroupRouter)
app.use('/comment', commentRouter)
app.use('/adminpost', adminpostRouter)
app.use('/banned', bannedRouter)
app.use('/comment', commentRouter)
app.use('/adminpost', adminpostRouter)
app.use('/liked', likedRouter)
app.use('/groupmember', groupmemberRouter)
app.use('/screenShare', screenShareRouter)
app.use('/grouptime', grouptimeRouter)
app.use('/time', timeRouter)
app.use('/noti', notiRouter)
app.use('/studyList', studyListRouter)

// 서버 시작
const PORT = app.get('port')
server.listen(PORT, () => {
   console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`)
})
