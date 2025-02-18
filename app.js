const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const session = require('express-session')
const passport = require('passport')
require('dotenv').config()
const cors = require('cors')

const { sequelize } = require('./models')
const passportConfig = require('./passport')
const authRouter = require('./routes/auth')
const dDayRouter = require('./routes/dDay')
const mindsetRouter = require('./routes/mindset')

const app = express()

passportConfig() // Passport 설정을 호출합니다.

app.set('port', process.env.PORT || 8002)

// 시퀄라이즈를 사용한 DB 연결
sequelize
   .sync({ force: false })
   .then(() => {
      console.log('데이터베이스 연결 성공')
   })
   .catch((err) => {
      console.error('데이터베이스 연결 실패:', err)
   })

// 미들웨어 설정
app.use(cors({ origin: process.env.FRONTEND_APP_URL, credentials: true })) // CORS 설정
app.use(morgan('dev'))
app.use(express.json()) // JSON 데이터 파싱
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// 세션 설정
const sessionMiddleware = session({
   secret: process.env.COOKIE_SECRET,
   resave: false,
   saveUninitialized: true,
   cookie: {
      httpOnly: true,
      secure: false, // 개발 환경에서 secure: false
   },
})
app.use(sessionMiddleware)

// Passport 초기화 및 세션 사용
app.use(passport.initialize())
app.use(passport.session())

// 라우터 설정
app.use('/auth', authRouter) // 구글 로그인 관련 라우터
app.use('/signup', authRouter) //자체회원가입 관련 라우터
app.use('/dDay', dDayRouter) // 홈화면 디데이 라우터
app.use('/mindset', mindsetRouter) // 홈화면 디데이 라우터

// 서버 실행
app.listen(app.get('port'), () => {
   console.log(app.get('port'), '번 포트에서 대기 중')
})
