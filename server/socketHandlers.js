const { Chat } = require('../models')

/**
 * 사용자가 방에 입장했을 때 처리하는 함수
 */
function handleJoinRoom(socket, io, data) {
   const { roomId } = data

   socket.join(roomId)
   console.log(`사용자 ${socket.id}가 방 ${roomId}에 입장했습니다.`)

   // 방에 있는 다른 사용자들에게 새 사용자 입장 알림
   socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      roomId,
   })
}

/**
 * 사용자가 화면 공유를 시작했을 때 처리하는 함수
 */
function handleScreenShareStarted(socket, io, data) {
   const { roomId } = data
   console.log(`사용자 ${socket.id}가 방 ${roomId}에서 화면 공유를 시작했습니다.`)

   // 방에 있는 다른 사용자들에게 화면 공유 시작 알림
   socket.to(roomId).emit('screen_share_started', {
      userId: socket.id,
      roomId,
   })
}

/**
 * WebRTC 오퍼 처리 함수
 */
function handleOffer(socket, io, data) {
   const { sdp, roomId, to, from } = data
   const fromId = from || socket.id

   console.log(`오퍼: ${fromId} -> ${to} (방: ${roomId})`)

   // 대상 사용자에게 오퍼 전송
   io.to(to).emit('offer', {
      sdp,
      roomId,
      from: fromId,
   })
}

/**
 * WebRTC 앤서 처리 함수
 */
function handleAnswer(socket, io, data) {
   const { sdp, roomId, to, from } = data
   const fromId = from || socket.id

   console.log(`앤서: ${fromId} -> ${to} (방: ${roomId})`)

   // 대상 사용자에게 앤서 전송
   io.to(to).emit('answer', {
      sdp,
      roomId,
      from: fromId,
   })
}

/**
 * ICE Candidate 처리 함수
 */
function handleCandidate(socket, io, data) {
   const { candidate, roomId, to, from } = data
   const fromId = from || socket.id

   console.log(`ICE Candidate: ${fromId} -> ${to} (방: ${roomId})`)

   // 대상 사용자에게 ICE Candidate 전송
   io.to(to).emit('candidate', {
      candidate,
      roomId,
      from: fromId,
   })
}

/**
 * 연결 해제 처리 함수
 */
function handleDisconnect(socket, io) {
   console.log(`사용자 연결 해제: ${socket.id}`)

   // 사용자가 참여한 모든 방 조회
   const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id)

   // 각 방의 다른 사용자들에게 사용자 퇴장 알림
   rooms.forEach((roomId) => {
      socket.to(roomId).emit('user-left', {
         userId: socket.id,
         roomId,
      })
   })
}

/**
 * 사용자가 채팅 메시지를 보냈을 때 처리하는 함수
 */
async function handleSendMessage(socket, io, data) {
   const { roomId, senderId, content, messageType } = data

   if (!roomId || !senderId || !content) return

   try {
      // DB에 채팅 메시지 저장
      const newMessage = await Chat.create({
         groupId: roomId,
         senderId,
         content,
         messageType: messageType || 'text',
      })

      console.log(`📩 메시지 전송: ${senderId} -> 방 ${roomId} : ${content}`)

      // 같은 방에 있는 사용자들에게 메시지 전송
      io.to(roomId).emit('receive_message', {
         id: newMessage.id,
         senderId,
         content,
         messageType,
         createdAt: newMessage.createdAt,
      })
   } catch (error) {
      console.error('메시지 저장 오류:', error)
   }
}

/**
 * 과거 채팅 내역 불러오기
 */
async function handleFetchMessages(socket, data) {
   const { roomId } = data
   if (!roomId) return

   try {
      const messages = await Chat.findAll({
         where: { groupId: roomId },
         order: [['createdAt', 'ASC']],
      })

      socket.emit('fetch_messages', messages)
   } catch (error) {
      console.error('채팅 내역 불러오기 오류:', error)
   }
}

/**
 * 사용자가 입력 중임을 알리는 이벤트
 */
function handleUserTyping(socket, io, data) {
   const { roomId, userId } = data
   if (!roomId || !userId) return

   socket.to(roomId).emit('user_typing', { userId, roomId })
}

/**
 * 사용자가 입력을 멈췄음을 알리는 이벤트
 */
function handleUserStoppedTyping(socket, io, data) {
   const { roomId, userId } = data
   if (!roomId || !userId) return

   socket.to(roomId).emit('user_stopped_typing', { userId, roomId })
}

module.exports = {
   handleJoinRoom,
   handleScreenShareStarted,
   handleOffer,
   handleAnswer,
   handleCandidate,
   handleDisconnect,
   handleSendMessage, // ✅ 메시지 전송
   handleFetchMessages, // ✅ 채팅 기록 불러오기
   handleUserTyping, // ✅ 입력 중 표시
   handleUserStoppedTyping, // ✅ 입력 멈춤 표시
}
