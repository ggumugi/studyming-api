const { Server } = require('socket.io')
const socketHandlers = require('./socketHandlers')

/**
 * Socket.IO 서버를 설정하는 함수
 * @param {Object} server - HTTP 서버 인스턴스
 * @param {Function} sessionMiddleware - Express 세션 미들웨어
 * @returns {Object} Socket.IO 서버 인스턴스
 */
function setupSocketServer(server, sessionMiddleware) {
   const io = new Server(server, {
      cors: {
         origin: process.env.FRONTEND_APP_URL || '*',
         methods: ['GET', 'POST'],
         credentials: true,
      },
      pingTimeout: 60000,
   })

   // 세션 미들웨어 적용
   if (sessionMiddleware) {
      io.use((socket, next) => {
         sessionMiddleware(socket.request, {}, next)
      })
   }

   // 연결 이벤트 처리
   io.on('connection', (socket) => {
      console.log(`사용자 연결: ${socket.id}`)

      // 방 입장 이벤트
      socket.on('join_room', (data) => socketHandlers.handleJoinRoom(socket, io, data))

      // 화면 공유 시작 이벤트
      socket.on('screen_share_started', (data) => socketHandlers.handleScreenShareStarted(socket, io, data))

      // WebRTC 시그널링 이벤트
      socket.on('offer', (data) => socketHandlers.handleOffer(socket, io, data))
      socket.on('answer', (data) => socketHandlers.handleAnswer(socket, io, data))
      socket.on('candidate', (data) => socketHandlers.handleCandidate(socket, io, data))

      // 연결 해제 이벤트
      socket.on('disconnect', () => socketHandlers.handleDisconnect(socket, io))
   })

   return io
}

module.exports = setupSocketServer
