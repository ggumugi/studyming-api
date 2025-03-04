// app.js
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
const http = require('http')
const { Server } = require('socket.io')
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

// Express 앱 생성
const app = express()

// HTTP 서버 생성
const server = http.createServer(app)

// 방 정보 관리를 위한 객체
const rooms = {}

// Socket.IO 서버 설정
const io = new Server(server, {
   cors: {
      origin: '*', // 개발 중에는 모든 출처 허용
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
   },
   transports: ['websocket', 'polling'],
   pingTimeout: 60000,
   pingInterval: 25000,
   connectTimeout: 45000,
   allowEIO3: true,
})

// 디버깅을 위한 이벤트 추가
io.engine.on('connection_error', (err) => {
   console.error('Socket.io 연결 오류:', err)
})

// Socket.IO 이벤트 핸들러
io.on('connection', (socket) => {
   console.log('새 클라이언트 연결:', socket.id)

   // 방 참가 이벤트
   socket.on('join-room', (data) => {
      const { roomId, userId, userName } = data

      // 입력 검증
      if (!roomId || !userId || !userName) {
         console.error('필수 정보 누락: roomId, userId 또는 userName')
         return
      }

      // 방이 존재하지 않으면 생성
      if (!rooms[roomId]) {
         rooms[roomId] = {
            users: {},
            screenShare: null, // 화면 공유 중인 사용자 ID
         }
      }

      // 사용자 정보 저장
      rooms[roomId].users[userId] = {
         socketId: socket.id,
         userName,
         isSharing: false,
         isCamOn: false,
      }

      // 화면 공유 중인 사용자가 있으면 상태 업데이트
      if (rooms[roomId].screenShare === userId) {
         rooms[roomId].users[userId].isSharing = true
      }

      // 방에 소켓 참가
      socket.join(roomId)

      // 참가자에게 기존 참가자 목록 전송 (최신 상태 포함)
      socket.emit('room-users', rooms[roomId].users)

      // 다른 참가자들에게 새 참가자 알림
      socket.to(roomId).emit('user-joined', {
         userId,
         userName,
         socketId: socket.id,
         isSharing: rooms[roomId].users[userId].isSharing,
      })

      // 화면 공유 중인 사용자가 있으면 알림
      if (rooms[roomId].screenShare && rooms[roomId].screenShare !== userId) {
         socket.emit('screen-sharing-status', {
            userId: rooms[roomId].screenShare,
            isSharing: true,
         })
      }

      // 방 ID 저장 (연결 종료 시 사용)
      socket.roomId = roomId
      socket.userId = userId

      console.log(`사용자 ${userName}(${userId})가 방 ${roomId}에 참가함`)
   })

   // WebRTC 시그널링
   socket.on('signal', (data) => {
      const { roomId, to, signal } = data
      const from = socket.userId

      // 입력 검증
      if (!roomId || !to || !from || !signal) {
         console.error('필수 정보 누락: roomId, to, from 또는 signal')
         return
      }

      console.log(`시그널: ${from} -> ${to}`)

      // 특정 사용자에게 시그널 전달
      io.to(roomId).emit('signal', {
         from,
         to,
         signal,
      })
   })

   // 화면 공유 상태 변경
   socket.on('screen-sharing-status', (data) => {
      const { roomId, isSharing } = data
      const userId = socket.userId

      console.log(`화면 공유 상태 변경 요청: 사용자 ${userId}, 방 ${roomId}, 공유 ${isSharing}`)

      // 입력 검증
      if (!roomId || userId === undefined || isSharing === undefined) {
         console.error('필수 정보 누락: roomId, userId 또는 isSharing')
         return
      }

      if (!rooms[roomId]) {
         console.error(`존재하지 않는 방: ${roomId}`)
         return
      }

      // 화면 공유 상태 업데이트
      if (isSharing) {
         // 이전에 화면 공유 중이던 사용자가 있으면 상태 업데이트
         if (rooms[roomId].screenShare && rooms[roomId].screenShare !== userId) {
            const prevSharingUserId = rooms[roomId].screenShare
            if (rooms[roomId].users[prevSharingUserId]) {
               console.log(`이전 화면 공유 사용자 ${prevSharingUserId}의 상태 변경`)
               rooms[roomId].users[prevSharingUserId].isSharing = false

               // 이전 화면 공유 사용자에게 상태 변경 알림
               io.to(rooms[roomId].users[prevSharingUserId].socketId).emit('screen-sharing-stopped', {
                  reason: 'new-sharer',
                  newSharerId: userId,
               })
            }
         }

         console.log(`사용자 ${userId}가 화면 공유 시작`)
         rooms[roomId].screenShare = userId

         // 사용자 상태 업데이트
         if (rooms[roomId].users[userId]) {
            rooms[roomId].users[userId].isSharing = true
         }
      } else {
         console.log(`사용자 ${userId}가 화면 공유 중지`)
         if (rooms[roomId].screenShare === userId) {
            rooms[roomId].screenShare = null
         }

         // 사용자 상태 업데이트
         if (rooms[roomId].users[userId]) {
            rooms[roomId].users[userId].isSharing = false
         }
      }

      // 방의 모든 사용자에게 상태 변경 알림
      console.log(`방 ${roomId}의 모든 사용자에게 화면 공유 상태 변경 알림 전송`)
      io.to(roomId).emit('screen-sharing-status', {
         userId,
         isSharing,
      })

      // 모든 사용자에게 업데이트된 사용자 목록 전송
      io.to(roomId).emit('room-users', rooms[roomId].users)

      console.log(`화면 공유 상태 변경 처리 완료: ${userId} -> ${isSharing ? '시작' : '중지'}`)
   })

   // 화면 공유 상태 동기화 요청 처리
   socket.on('request-screen-share-status', (data) => {
      const { roomId } = data

      // 입력 검증
      if (!roomId) {
         console.error('필수 정보 누락: roomId')
         return
      }

      if (rooms[roomId]) {
         console.log(`사용자 ${socket.userId}에게 화면 공유 상태 동기화 정보 전송`)

         // 현재 화면 공유 상태 전송
         socket.emit('screen-share-status-sync', {
            roomId,
            screenShareUserId: rooms[roomId].screenShare,
            users: rooms[roomId].users,
         })
      }
   })

   // 카메라 상태 변경
   socket.on('camera-status', (data) => {
      const { roomId, isOn } = data
      const userId = socket.userId

      // 입력 검증
      if (!roomId || isOn === undefined || !userId) {
         console.error('필수 정보 누락: roomId, isOn 또는 userId')
         return
      }

      if (!rooms[roomId] || !rooms[roomId].users[userId]) {
         console.error(`존재하지 않는 방 또는 사용자: ${roomId}, ${userId}`)
         return
      }

      // 사용자 상태 업데이트
      rooms[roomId].users[userId].isCamOn = isOn

      // 방의 모든 사용자에게 상태 변경 알림
      socket.to(roomId).emit('camera-status', {
         userId,
         isOn,
      })

      // 모든 사용자에게 업데이트된 사용자 목록 전송
      io.to(roomId).emit('room-users', rooms[roomId].users)

      console.log(`카메라 상태 변경: ${userId} -> ${isOn ? '켬' : '끔'}`)
   })

   // 연결 종료 처리
   socket.on('disconnect', () => {
      const { roomId, userId } = socket

      if (roomId && userId && rooms[roomId]) {
         console.log(`사용자 ${userId} 연결 종료 처리 시작`)

         // 방에서 사용자 제거
         delete rooms[roomId].users[userId]

         // 화면 공유 중이었다면 상태 초기화
         if (rooms[roomId].screenShare === userId) {
            console.log(`화면 공유 중이던 사용자 ${userId}가 연결 종료됨, 상태 초기화`)
            rooms[roomId].screenShare = null

            // 방의 다른 사용자들에게 화면 공유 종료 알림
            socket.to(roomId).emit('screen-sharing-status', {
               userId,
               isSharing: false,
            })
         }

         // 방의 다른 사용자들에게 알림
         socket.to(roomId).emit('user-left', {
            userId,
            socketId: socket.id,
         })

         // 방에 사용자가 없으면 방 삭제
         if (Object.keys(rooms[roomId].users).length === 0) {
            console.log(`방 ${roomId}에 사용자가 없어 삭제됨`)
            delete rooms[roomId]
         } else {
            // 업데이트된 사용자 목록 전송
            socket.to(roomId).emit('room-users', rooms[roomId].users)
         }

         console.log(`사용자 ${userId} 연결 종료 처리 완료`)
      }
   })

   // 오류 처리
   socket.on('error', (error) => {
      console.error(`Socket.IO 오류 (${socket.id}):`, error)
   })
})

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

// 서버 시작
const PORT = app.get('port')
server.listen(PORT, () => {
   console.log(`서버가 ${PORT} 포트에서 실행 중입니다.`)
})
