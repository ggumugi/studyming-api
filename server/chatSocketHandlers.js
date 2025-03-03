const { Chat, User } = require('../models')

/**
 * ✅ 방 참가
 */
function handleJoinRoom(socket, chatIo, data) {
   const { roomId } = data
   socket.join(roomId)
   console.log(`💬 사용자 ${socket.id}가 채팅방 ${roomId}에 입장`)

   // 다른 사용자들에게 알림
   socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      roomId,
   })
}

/**
 * ✅ 메시지 보내기 (DB 저장 & 실시간 전송)
 */
async function handleSendMessage(socket, chatIo, data) {
   try {
      console.log(`📨 메시지 저장 시도: ${JSON.stringify(data)}`)

      if (!data.senderId || !data.groupId) {
         console.error('❌ 필수 데이터 없음: senderId 또는 groupId가 누락됨.')
         return
      }

      // ✅ DB에 메시지 저장 (닉네임 없이)
      const newMessage = await Chat.create({
         groupId: data.groupId,
         senderId: data.senderId,
         content: data.content,
         messageType: data.messageType || 'text',
      })

      // ✅ User 테이블에서 senderId에 해당하는 닉네임 가져오기
      const sender = await User.findOne({ where: { id: data.senderId } })

      // ✅ 같은 방의 모든 사용자에게 메시지 전송 (닉네임 추가)
      chatIo.to(data.groupId).emit('receive_message', {
         id: newMessage.id,
         senderId: data.senderId,
         senderNickname: sender ? sender.nickname : '익명', // ✅ 닉네임 추가
         content: data.content,
         messageType: data.messageType,
         createdAt: newMessage.createdAt,
      })

      console.log(`✅ 메시지 저장됨: ${JSON.stringify(newMessage)}`)
   } catch (error) {
      console.error('❌ 메시지 저장 오류:', error)
   }
}

/**
 * ✅ 과거 채팅 불러오기
 */
async function handleFetchMessages(socket, data) {
   const { roomId, offset = 0, limit = 20 } = data
   if (!roomId) return

   try {
      const messages = await Chat.findAll({
         where: { groupId: roomId },
         order: [['createdAt', 'DESC']], // 최신 메시지부터 정렬
         offset,
         limit,
      })

      // ✅ 불러온 메시지가 limit보다 작다면 더 이상 불러올 데이터 없음
      const hasMore = messages.length === limit

      console.log('📨 과거 메시지 전송:', messages.length, '개')

      // ✅ 메시지만 배열로 전달
      socket.emit('fetch_messages', messages.reverse()) // 배열만 반환하도록 변경
   } catch (error) {
      console.error('❌ 채팅 내역 불러오기 오류:', error)
   }
}

/**
 * ✅ 입력 중 상태 표시
 */
function handleUserTyping(socket, chatIo, data) {
   const { roomId, userId } = data
   if (!roomId || !userId) return

   socket.to(roomId).emit('user_typing', { userId, roomId })
}

function handleUserStoppedTyping(socket, chatIo, data) {
   const { roomId, userId } = data
   if (!roomId || !userId) return

   socket.to(roomId).emit('user_stopped_typing', { userId, roomId })
}

/**
 * ✅ 연결 해제
 */
function handleDisconnect(socket, chatIo) {
   console.log(`🔴 [채팅 서버] 사용자 ${socket.id} 연결 종료`)
}

module.exports = {
   handleJoinRoom,
   handleSendMessage,
   handleFetchMessages,
   handleUserTyping,
   handleUserStoppedTyping,
   handleDisconnect,
}
