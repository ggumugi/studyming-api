const { Server } = require('socket.io')
const chatSocketHandlers = require('./chatSocketHandlers')

/**
 * ✅ 채팅 소켓 서버 설정
 */
function setupChatSocketServer(server, sessionMiddleware) {
   const chatIo = new Server(server, {
      cors: {
         origin: process.env.FRONTEND_APP_URL || '*',
         methods: ['GET', 'POST'],
         credentials: true,
      },
      pingTimeout: 60000,
   })

   // ✅ 세션 미들웨어 적용
   if (sessionMiddleware) {
      chatIo.use((socket, next) => {
         sessionMiddleware(socket.request, {}, next)
      })
   }

   // ✅ 채팅 이벤트 처리
   chatIo.on('connection', (socket) => {
      // 방 참가
      socket.on('join_room', (data) => chatSocketHandlers.handleJoinRoom(socket, chatIo, data))

      // 메시지 전송
      socket.on('send_message', (data) => chatSocketHandlers.handleSendMessage(socket, chatIo, data))

      // 과거 채팅 불러오기
      socket.on('fetch_messages', (data) => chatSocketHandlers.handleFetchMessages(socket, data))

      // 입력 중 표시
      socket.on('user_typing', (data) => chatSocketHandlers.handleUserTyping(socket, chatIo, data))
      socket.on('user_stopped_typing', (data) => chatSocketHandlers.handleUserStoppedTyping(socket, chatIo, data))

      // 연결 해제
      socket.on('disconnect', () => chatSocketHandlers.handleDisconnect(socket, chatIo))

      // ✅ 내 아이템 목록 요청 이벤트 추가
      socket.on('fetch_myitems', (data) => chatSocketHandlers.handleFetchMyItems(socket, data))
      // ✅ 기존 이벤트 리스너 제거 (중복 실행 방지)
      socket.removeAllListeners('send_message')

      // ✅ 메시지 전송 이벤트 등록
      socket.on('send_message', (data) => {
         chatSocketHandlers.handleSendMessage(socket, chatIo, data)
      })
   })

   return chatIo
}

module.exports = setupChatSocketServer
