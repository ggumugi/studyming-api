const express = require('express')
const { sequelize } = require('./models')

const app = express()
app.set('port', process.env.PORT || 8002)

// 시퀄라이즈를 사용한 DB연결
sequelize
   .sync({ force: false })
   .then(() => {
      console.log('데이터베이스 연결 성공')
   })
   .catch((err) => {
      console.error('데이터베이스 연결 실패:', err)
   })

// 서버 실행
app.listen(app.get('port'), () => {
   console.log(app.get('port'), '번 포트에서 대기 중')
})
