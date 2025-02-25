// server.js
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// Express 라우트 설정
app.get('/', (req, res) => {
   res.send('서버가 실행 중입니다.')
})
io.on('connection', (socket) => {
   socket.on('join_room', (roomId) => {
      socket.join(roomId)
      socket.to(roomId).emit('userJoined', socket.id)
   })

   socket.on('offer', (data) => {
      socket.to(data.roomId).emit('offer', data)
   })

   socket.on('answer', (data) => {
      socket.to(data.roomId).emit('answer', data)
   })

   socket.on('candidate', (data) => {
      socket.to(data.roomId).emit('candidate', data)
   })
})

module.exports = server
