const { Chat, User, Myitem, Item } = require('../models')

/**
 * ✅ 방 참가
 */
function handleJoinRoom(socket, chatIo, data) {
   const { roomId } = data
   socket.join(roomId)

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
      if (!data.senderId || !data.groupId) {
         console.error('❌ 필수 데이터 없음: senderId 또는 groupId가 누락됨.')
         return
      }

      let content = data.content
      let messageType = data.messageType || 'text'

      // ✅ 아이템 메시지일 경우, 해당 유저가 해당 아이템을 보유하고 있는지 확인
      if (data.messageType === 'item') {
         const itemId = data.content.replace('[아이템] ', '') // ✅ 아이템 ID 추출

         // 🔥 유저가 실제로 보유한 아이템인지 확인 (myitem 테이블)
         const ownedItem = await Myitem.findOne({
            where: { userId: data.senderId, itemId: itemId },
            include: [{ model: Item, attributes: ['img'] }],
         })

         if (ownedItem) {
            content = `http://localhost:8000${ownedItem.Item.img}` // ✅ 실제 이미지 URL로 변환
            messageType = 'image'
         } else {
            console.warn(`⚠️ 유저(${data.senderId})가 아이템(${itemId})을 보유하지 않음.`)
            content = '[아이템이 없습니다]' // ❌ 아이템이 없으면 변환하지 않음
            messageType = 'text' // ❌ 이미지가 아니라 일반 텍스트 처리
         }
      }

      // ✅ DB에 메시지 저장
      const newMessage = await Chat.create({
         groupId: data.groupId,
         senderId: data.senderId,
         content,
         messageType,
      })

      const sender = await User.findOne({ where: { id: data.senderId } })

      // ✅ 같은 방의 모든 사용자에게 메시지 전송
      chatIo.to(data.groupId).emit('receive_message', {
         id: newMessage.id,
         senderId: data.senderId,
         senderNickname: sender ? sender.nickname : '익명',
         content,
         messageType,
         createdAt: newMessage.createdAt,
      })
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
         order: [['createdAt', 'DESC']],
         offset,
         limit,
         include: [
            {
               model: User,
               as: 'Sender',
               attributes: ['nickname'],
            },
         ],
      })

      const formattedMessages = messages.map((msg) => ({
         id: msg.id,
         senderId: msg.senderId,
         senderNickname: msg.Sender ? msg.Sender.nickname : '익명',
         content: msg.content,
         messageType: msg.messageType,
         createdAt: msg.createdAt,
      }))

      socket.emit('fetch_messages', formattedMessages.reverse())
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

/**
 * 아이템 가져오기
 * */
async function handleFetchMyItems(socket, data) {
   const { userId } = data
   if (!userId) {
      console.error('❌ userId가 없습니다.')
      return
   }

   try {
      const myItems = await Myitem.findAll({
         where: { userId },
         include: [
            {
               model: Item, // ✅ Item 모델과 조인
               attributes: ['id', 'name', 'img'],
            },
         ],
      })

      if (!myItems || myItems.length === 0) {
         console.log(`⚠️ [서버] 사용자(${userId})의 아이템이 없습니다.`)
      }

      const formattedItems = myItems.map((item) => ({
         id: item.Item?.id || null,
         name: item.Item?.name || '알 수 없음',
         img: item.Item?.img || '',
      }))

      socket.emit('fetch_myitems', formattedItems)
   } catch (error) {
      console.error('❌ [서버] 아이템 목록 불러오기 오류:', error)
   }
}

module.exports = {
   handleJoinRoom,
   handleSendMessage,
   handleFetchMessages,
   handleUserTyping,
   handleUserStoppedTyping,
   handleDisconnect,
   handleFetchMyItems,
}
