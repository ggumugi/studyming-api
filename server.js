const http = require('http')
const { app, sessionMiddleware } = require('./app')
const setupSocketServer = require('./server/socketServer')

// HTTP 서버 생성
const server = http.createServer(app)

// 소켓 서버 설정
const io = setupSocketServer(server, sessionMiddleware)

// 서버 시작
const PORT = app.get('port')
server.listen(PORT, () => {
   console.log(`${PORT} 번 포트에서 대기 중`)
})

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
   console.log('서버를 종료합니다...')
   server.close(() => {
      console.log('서버가 안전하게 종료되었습니다.')
      process.exit(0)
   })
})
