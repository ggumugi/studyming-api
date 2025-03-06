/**
 * 사용자가 방에 입장했을 때 처리하는 함수
 */
function handleJoinRoom(socket, io, data) {
   const { roomId } = data

   socket.join(roomId)

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

module.exports = {
   handleJoinRoom,
   handleScreenShareStarted,
   handleOffer,
   handleAnswer,
   handleCandidate,
   handleDisconnect,
}
