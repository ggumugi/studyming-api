const express = require('express')
const passport = require('passport')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const crypto = require('crypto') // 랜덤 인증 코드 생성
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')
const Auth = require('../models/auth')

const router = express.Router()
//회원가입 localhost:8000/auth/signup
router.post('/signup', isNotLoggedIn, async (req, res, next) => {
   console.log('회원가입 요청 데이터:', req.body)

   const { email, password, nickname, name, loginId } = req.body

   if (!email || !password || !nickname || !name || !loginId) {
      return res.status(400).json({ success: false, message: '필수 정보를 모두 입력해주세요.' })
   }

   if (!password.trim()) {
      return res.status(400).json({ success: false, message: '비밀번호를 입력해주세요.' })
   }

   try {
      // 회원가입 시 중복된 아이디 또는 닉네임이 있을 경우, DB에서 오류 발생
      const hash = await bcrypt.hash(password, 12)

      const newUser = await User.create({
         loginId,
         email,
         password: hash,
         role: 'USER',
         nickname,
         name,
         status: 'ACTIVE',
         gender: 'NONE',
         birth: null,
      })

      res.status(201).json({
         success: true,
         message: '사용자가 성공적으로 등록되었습니다.',
         user: {
            id: newUser.id,
            loginId: newUser.loginId,
            email: newUser.email,
            role: newUser.role,
            nickname: newUser.nickname,
            name: newUser.name,
         },
      })
   } catch (error) {
      console.error('회원가입 에러:', error)

      // 중복된 데이터로 인해 DB 오류 발생 시 처리 (SequelizeValidationError)
      if (error.name === 'SequelizeUniqueConstraintError') {
         const field = error.errors[0].path
         return res.status(409).json({
            success: false,
            message: field === 'loginId' ? '중복된 아이디입니다.' : '중복된 닉네임입니다.',
         })
      }

      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

// 아이디 중복 확인 API
router.get('/check-id', async (req, res) => {
   const { loginId } = req.query

   if (!loginId) {
      return res.status(400).json({ success: false, message: '아이디를 입력해주세요.' })
   }

   try {
      const existingUser = await User.findOne({ where: { loginId } })

      if (existingUser) {
         return res.status(409).json({ success: false, message: '이미 존재하는 아이디입니다.' }) // ✅ 중복된 경우 409 응답
      }

      res.json({ success: true, message: '사용 가능한 아이디입니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

// 닉네임 중복 확인 API
router.get('/check-nickname', async (req, res) => {
   const { nickname } = req.query

   if (!nickname) {
      return res.status(400).json({ success: false, message: '닉네임을 입력해주세요.' })
   }

   try {
      const existingUser = await User.findOne({ where: { nickname } })

      if (existingUser) {
         return res.status(409).json({ success: false, message: '이미 존재하는 닉네임입니다.' }) // ✅ 중복된 경우 409 응답
      }

      res.json({ success: true, message: '사용 가능한 닉네임입니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

//자체로그인 localhost:8000/auth/login
router.post('/login', isNotLoggedIn, async (req, res, next) => {
   console.log('🔍 로그인 후 세션 확인:', req.session) // ✅ 세션 확인
   console.log('🔍 로그인 후 사용자 정보:', req.user) // ✅ 유저 정보 확인
   passport.authenticate('local', (authError, user, info) => {
      if (authError) {
         //로그인 인증 중 에러 발생시
         return res.status(500).json({ success: false, message: '인증 중 오류 발생', error: authError })
      }

      if (!user) {
         //비밀번호 불일치 또는 사용자가 없을 경우 info.message를 사용해서 메세지 전달
         return res.status(401).json({
            success: false,
            message: info.message || '로그인 실패',
         })
      }

      // 인증이 정상적으로 되고 사용자를 로그인 상태로 바꿈
      req.login(user, (loginError) => {
         if (loginError) {
            //로그인 상태로 바꾸는 중 오류 발생시
            return res.status(500).json({ success: false, message: '로그인 중 오류 발생', error: loginError })
         }

         //로그인 성공시 user객체와 함께 response
         //status code를 주지 않으면 기본값은 200(성공)
         res.json({
            success: true,
            message: '로그인 성공',
            user: {
               id: user.id,
               loginId: user.loginId,
               email: user.email,
               nickname: user.nickname,
               name: user.name,
               role: user.role,
            },
         })
      })
   })(req, res, next)
})
// 이메일로 아이디 찾기
router.post('/find-id', async (req, res) => {
   const { email } = req.body // 클라이언트에서 전달된 이메일

   if (!email) {
      return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' })
   }

   try {
      // 이메일로 사용자 검색
      const user = await User.findOne({ where: { email } })

      if (!user) {
         return res.status(404).json({ success: false, message: '이메일에 해당하는 사용자가 없습니다.' })
      }

      // 사용자가 존재하면 아이디 반환
      res.status(200).json({
         success: true,
         message: '아이디 찾기 성공',
         loginId: user.loginId, // 아이디 반환
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' })
   }
})
const verificationCodes = {} // 🔥 인증 코드 저장 (메모리 저장)

//1. 이메일로 인증 코드 전송 API (POST)
router.post('/find-id/send-code', async (req, res) => {
   const { email } = req.body // ✅ POST 방식이므로 req.body 사용

   if (!email) {
      return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' })
   }

   try {
      console.log('🔎 [DEBUG] 이메일 인증 요청:', email)

      // 🔥 데이터베이스에서 해당 이메일이 존재하는지 확인
      const user = await User.findOne({ where: { email } })
      if (!user) {
         return res.status(400).json({ success: false, message: '가입된 이메일이 없습니다.' })
      }

      // 6자리 랜덤 인증 코드 생성
      const verificationCode = crypto.randomInt(100000, 999999).toString()
      console.log('✅ [DEBUG] 생성된 인증 코드:', verificationCode)

      // 인증 코드 저장 (5분 후 자동 삭제)
      verificationCodes[email] = verificationCode
      setTimeout(() => {
         delete verificationCodes[email]
      }, 5 * 60 * 1000) // 5분 후 자동 삭제

      // ✉️ 이메일 전송 설정
      const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            user: process.env.EMAIL_USER, // 📌 발신자 이메일
            pass: process.env.EMAIL_PASS, // 📌 앱 비밀번호
         },
      })

      const mailOptions = {
         from: process.env.EMAIL_USER, // 발신자 이메일 (고정)
         to: email, // 📩 수신자 이메일 (DB에서 가져온 사용자 이메일)
         subject: '스터디밍 이메일 인증 코드',
         text: `귀하의 인증 코드는: ${verificationCode} 입니다. 5분 이내에 입력해주세요.`,
      }

      await transporter.sendMail(mailOptions)
      console.log('📩 [DEBUG] 이메일 전송 완료:', email)

      res.json({ success: true, message: '이메일로 인증 코드를 전송했습니다.' })
   } catch (error) {
      console.error('🚨 [ERROR] 인증 코드 전송 실패:', error)
      res.status(500).json({ success: false, message: '이메일 전송 중 오류가 발생했습니다.' })
   }
})

// ✅ 2. 인증 코드 검증 및 아이디 반환 API (POST)
router.post('/find-id/verify-code', async (req, res) => {
   const { email, verificationCode } = req.body // ✅ POST 방식이므로 req.body 사용

   if (!email || !verificationCode) {
      return res.status(400).json({ success: false, message: '이메일과 인증 코드를 입력해주세요.' })
   }

   try {
      console.log('🔎 [DEBUG] 인증 코드 확인 요청:', email, verificationCode)

      // 저장된 인증 코드 확인
      if (verificationCodes[email] !== verificationCode) {
         return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' })
      }

      // 인증 코드가 일치하면 해당 이메일의 아이디 조회
      const user = await User.findOne({ where: { email } })
      if (!user) {
         return res.status(400).json({ success: false, message: '가입된 이메일이 없습니다.' })
      }

      console.log('✅ [DEBUG] 인증 성공 - 찾은 아이디:', user.loginId)

      // 인증 성공 시 아이디 반환
      res.json({ success: true, loginId: user.loginId })
   } catch (error) {
      console.error('🚨 [ERROR] 인증 코드 확인 실패:', error)
      res.status(500).json({ success: false, message: '인증 코드 확인 중 오류가 발생했습니다.' })
   }
})

//비밀번호찾기 항목

// 비밀번호 찾기 - 1. 아이디 입력 후 이메일 입력으로 넘어가기
router.post('/password-reset/check-id', async (req, res) => {
   const { loginId } = req.body

   // 아이디가 존재하는지 확인
   const user = await User.findOne({ where: { loginId } })

   if (!user) {
      return res.status(400).json({ success: false, message: '아이디가 존재하지 않습니다.' })
   }

   // 아이디가 존재하면 이메일 입력 필드로 넘어감
   res.json({ success: true, message: '아이디가 존재합니다.' })
})

const verificationCodespw = {} // ✅ 비밀번호 찾기용 인증 코드 저장소

// 비밀번호 찾기 - 2. 이메일 입력 후 아이디와 이메일 일치 여부 확인
router.post('/password-reset/check-email', async (req, res) => {
   const { loginId, email } = req.body

   // 아이디와 이메일이 일치하는지 확인
   const user = await User.findOne({ where: { loginId, email } })

   if (!user) {
      return res.status(400).json({ success: false, message: '아이디와 이메일이 일치하지 않습니다.' })
   }

   // 일치하면 인증 코드 전송
   const verificationCodepw = crypto.randomInt(100000, 999999).toString()

   // 인증 코드 저장 (5분 후 자동 삭제)
   verificationCodespw[email] = verificationCodepw
   setTimeout(() => {
      delete verificationCodespw[email]
   }, 5 * 60 * 1000) // 5분 후 자동 삭제

   // 이메일 전송 설정
   const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: process.env.EMAIL_USER, // 📌 발신자 이메일
         pass: process.env.EMAIL_PASS, // 📌 앱 비밀번호
      },
   })

   const mailOptions = {
      from: process.env.EMAIL_USER, // 발신자 이메일 (고정)
      to: email, // 📩 수신자 이메일 (DB에서 가져온 사용자 이메일)
      subject: '스터디밍 비밀번호 재설정 인증 코드',
      text: `귀하의 인증 코드는: ${verificationCodepw} 입니다. 5분 이내에 입력해주세요.`,
   }

   try {
      await transporter.sendMail(mailOptions)
      console.log('📩 [DEBUG] 이메일 전송 완료:', email)
      res.json({ success: true, message: '이메일로 인증 코드를 전송했습니다.' })
   } catch (error) {
      console.error('🚨 [ERROR] 인증 코드 전송 실패:', error)
      res.status(500).json({ success: false, message: '이메일 전송 중 오류가 발생했습니다.' })
   }
})

// ✅ 3. 비밀번호 찾기 - 인증 코드 검증 및 비밀번호 변경 페이지로 이동 (POST)
router.post('/password-reset/verify-codepw', async (req, res) => {
   const { email, verificationCodepw } = req.body // ✅ POST 방식이므로 req.body 사용

   if (!email || !verificationCodepw) {
      return res.status(400).json({ success: false, message: ' 인증 코드를 입력해주세요.' })
   }

   try {
      console.log('🔎 [DEBUG] 인증 코드 확인 요청:', email, verificationCodepw)

      // ✅ 저장된 인증 코드 확인 (변수명 일관성 유지)
      if (!verificationCodespw[email] || verificationCodespw[email] !== verificationCodepw) {
         return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' })
      }

      // 인증 성공 시 비밀번호 변경 가능 상태로 이동
      res.json({ success: true, message: '인증 성공! 비밀번호 변경 페이지로 이동합니다.' })
   } catch (error) {
      console.error('🚨 [ERROR] 인증 코드 확인 실패:', error)
      res.status(500).json({ success: false, message: '인증 코드 확인 중 오류가 발생했습니다.' })
   }
})

// ✅ 4. 새 비밀번호 설정 (이메일을 별도 입력받지 않고 저장된 인증된 이메일 사용)
router.patch('/password-reset/update-password', async (req, res) => {
   console.log('📡 서버에서 받은 요청:', req.body) // ✅ 디버깅 로그 추
   const { email, newPassword } = req.body // ✅ 인증된 이메일을 받아서 사용

   if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: '새 비밀번호를 입력해주세요.' }) // ✅ 메시지 수정
   }

   try {
      // 🔥 인증된 이메일을 기반으로 사용자 찾기
      const user = await User.findOne({ where: { email } })

      if (!user) {
         return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })
      }

      // ✅ 비밀번호 해싱 후 업데이트
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      await user.update({ password: hashedPassword })

      res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다!' })
   } catch (error) {
      console.error('🚨 [ERROR] 비밀번호 변경 실패:', error)
      res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' })
   }
})

// ✅ Google 로그인 시작
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// ✅ Google 로그인 콜백 처리
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
   res.redirect(process.env.FRONTEND_APP_URL + '/dashboard') // 성공하면 프론트엔드로 이동
})

// ✅ 로그인한 사용자 정보 확인
router.get('/user', (req, res) => {
   if (req.isAuthenticated()) {
      res.json({
         isAuthenticated: true,
         user: {
            id: req.user.id,
            nickname: req.user.nickname,
            name: req.user.name,
            email: req.user.email,
            status: req.user.status,
            gender: req.user.gender,
            birth: req.user.birth,
            role: req.user.role,
         },
      })
   } else {
      res.json({ isAuthenticated: false })
   }
})

//로그아웃
router.get('/logout', isLoggedIn, (req, res) => {
   req.logout((err) => {
      if (err) {
         return res.status(500).json({
            success: false,
            message: '로그아웃 중 오류가 발생했습니다.',
            error: err,
         })
      }

      // ✅ 세션 삭제
      req.session.destroy((sessionErr) => {
         if (sessionErr) {
            return res.status(500).json({ success: false, message: '세션 삭제 실패' })
         }

         // ✅ 쿠키 삭제
         res.clearCookie('connect.sid')

         return res.json({ success: true, message: '로그아웃 성공' })
      })
   })
})

module.exports = router
