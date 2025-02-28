const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
const http = require('http') // http 모듈 추가
const { Server } = require('socket.io') // socket.io 추가
require('dotenv').config()
const cors = require('cors')

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
const screenShareRouter = require('./routes/screenShare') // 새로운 라우터 추가

// Express 앱 생성
const app = express()

// HTTP 서버 생성 (app 변수 선언 후에 작성)
const server = http.createServer(app)

// Socket.io 서버 설정
// Socket.io 서버 설정 수정
const io = new Server(server, {
   cors: {
      origin: '*', // 개발 중에는 모든 출처 허용
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
   },
   transports: ['websocket', 'polling'], // 두 가지 전송 방식 모두 지원
   pingTimeout: 60000,
   pingInterval: 25000,
   connectTimeout: 45000,
   allowEIO3: true, // Engine.IO 3 프로토콜 허용
})

// 디버깅을 위한 이벤트 추가
io.engine.on('connection_error', (err) => {
   console.error('Socket.io 연결 오류:', err)
})
// Socket.io 이벤트 핸들러
io.on('connection', (socket) => {
   console.log('새 클라이언트 연결:', socket.id)

   // 방 참가 이벤트
   socket.on('join-room', (data) => {
      const { roomId, userId, userName } = data
      socket.join(roomId)
      console.log(`사용자 ${userName}(${userId})가 방 ${roomId}에 참가함`)

      // 같은 방의 다른 사용자들에게 새 참가자 알림
      socket.to(roomId).emit('user-joined', {
         userId,
         userName,
         socketId: socket.id,
      })

      // 연결 종료 시
      socket.on('disconnect', () => {
         console.log(`사용자 ${userName}(${userId}) 연결 종료`)
         io.to(roomId).emit('user-left', {
            userId,
            userName,
            socketId: socket.id,
         })
      })
   })

   // WebRTC 시그널링
   socket.on('signal', (data) => {
      const { roomId, from, to, signal } = data
      console.log(`시그널: ${from} -> ${to}`)

      // 특정 사용자에게 시그널 전달
      socket.to(roomId).emit('signal', {
         from,
         to,
         signal,
      })
   })

   // 화면 공유 상태 변경
   socket.on('screen-sharing-status', (data) => {
      const { roomId, userId, isSharing } = data
      console.log(`화면 공유 상태 변경: ${userId} -> ${isSharing ? '시작' : '중지'}`)

      // 같은 방의 모든 사용자에게 알림
      socket.to(roomId).emit('screen-sharing-changed', {
         userId,
         isSharing,
      })
   })
})

require('./schedule/schedule') // 스케줄링 작업 실행

passportConfig() // Passport 설정을 호출합니다.

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
app.use('/screenShare', screenShareRouter) // 새로운 라우터 등록

// app.listen 대신 server.listen 사용
server.listen(app.get('port'), () => {
   console.log(app.get('port'), '번 포트에서 대기중')
})
