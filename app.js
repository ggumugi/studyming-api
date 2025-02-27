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
const goalsRouter = require('./routes/goals')
const pointRouter = require('./routes/point')
const itemRouter = require('./routes/item')
const postRouter = require('./routes/post')
const studygroupRouter = require('./routes/studygroup')
const commentRouter = require('./routes/comment')
const adminpostRouter = require('./routes/adminpost')
const bannedRouter = require('./routes/banned')
const likedRouter = require('./routes/liked')
const groupmemberRouter = require('./routes/groupmember')
const timeRouter = require('./routes/time')

const app = express()

require('./schedule/schedule') // ✅ 스케줄링 작업 실행

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
app.use((req, res, next) => {
   console.log('🔍 [DEBUG] 요청마다 세션 확인:', req.session)
   next()
})
// 미들웨어 설정
app.use(cors({ origin: process.env.FRONTEND_APP_URL, credentials: true })) // CORS 설정
app.use(morgan('dev'))
app.use(express.json()) // JSON 데이터 파싱
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// 📌 정적 파일 제공: 업로드된 이미지 접근 가능하도록 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))) // ✅ 추가

// 세션 설정
const sessionMiddleware = session({
   secret: process.env.COOKIE_SECRET,
   resave: false,
   saveUninitialized: true, //빈세션 방지 원래 true였는데 로그아웃 세션관련때문에 바꿈
   cookie: {
      httpOnly: true,
      secure: false, // 개발 환경에서 secure: false
      maxAge: 1000 * 60 * 60 * 24, // ✅ 세션 유지 시간 (24시간)
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
app.use('/goals', goalsRouter) // 홈화면 디데이 라우터
app.use('/point', pointRouter) // 포인트 관련 라우터
app.use('/item', itemRouter) // 밍샵아이템 관련 라우터
app.use('/post', postRouter) // 게시판
app.use('/studygroup', studygroupRouter) // 스터디그룹 관련 라우터
app.use('/comment', commentRouter)
app.use('/adminpost', adminpostRouter)
app.use('/banned', bannedRouter) // 벤 관련 라우터
app.use('/comment', commentRouter) // 댓글 관련 라우터
app.use('/adminpost', adminpostRouter) //관리자 정보 게시판 라우터
app.use('/liked', likedRouter) //스터디그룹 좋아요 관련 라우터
app.use('/groupmember', groupmemberRouter) //그룹 멤버 관련 라우터
app.use('/time', timeRouter) //타이머 관련 라우터

// 서버 실행
app.listen(app.get('port'), () => {
   console.log(app.get('port'), '번 포트에서 대기 중')
})
