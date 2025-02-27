// socketServer.js
const { Server } = require('socket.io')

// 소켓 서버 설정 함수
function setupSocketServer(server) {
   const io = new Server(server, {
      cors: {
         origin: process.env.FRONTEND_APP_URL || '*',
         methods: ['GET', 'POST'],
         credentials: true,
      },
   })

   io.on('connection', (socket) => {
      console.log('사용자 연결:', socket.id)

      // 방 입장
      socket.on('join_room', (data) => {
         const { roomId } = data
         socket.join(roomId)
         console.log(`사용자 ${socket.id}가 방 ${roomId}에 입장했습니다.`)

         // 방에 있는 다른 사용자들에게 새 사용자 입장 알림
         socket.to(roomId).emit('user-joined', { userId: socket.id, roomId })
      })

      // 화면 공유 시작
      socket.on('screen_share_started', (data) => {
         const { roomId } = data
         console.log(`사용자 ${socket.id}가 화면 공유를 시작했습니다.`)
         socket.to(roomId).emit('screen_share_started', { userId: socket.id })
      })

      // 오퍼 처리
      socket.on('offer', (data) => {
         const { sdp, roomId, to, from } = data
         console.log(`오퍼: ${from || socket.id} -> ${to}`)
         io.to(to).emit('offer', { sdp, roomId, from: from || socket.id })
      })

      // 앤서 처리
      socket.on('answer', (data) => {
         const { sdp, roomId, to, from } = data
         console.log(`앤서: ${from || socket.id} -> ${to}`)
         io.to(to).emit('answer', { sdp, roomId, from: from || socket.id })
      })

      // ICE Candidate 처리
      socket.on('candidate', (data) => {
         const { candidate, roomId, to, from } = data
         console.log(`ICE Candidate: ${from || socket.id} -> ${to}`)
         io.to(to).emit('candidate', { candidate, roomId, from: from || socket.id })
      })

      // 연결 해제
      socket.on('disconnect', () => {
         console.log('사용자 연결 해제:', socket.id)
         // 방에 있는 다른 사용자들에게 사용자 퇴장 알림
         io.emit('user-left', { userId: socket.id })
      })
   })

   return io
}

module.exports = setupSocketServer
