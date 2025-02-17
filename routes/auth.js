const express = require('express')
const passport = require('passport')
const bcrypt = require('bcrypt')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')
const Auth = require('../models/auth')

const router = express.Router()
//회원가입 localhost:8000/auth/signup
router.post('/signup', isNotLoggedIn, async (req, res, next) => {
   console.log('회원가입 요청 데이터:', req.body)

   const { email, password, nickname, name, login_id } = req.body

   if (!email || !password || !nickname || !name || !login_id) {
      return res.status(400).json({ success: false, message: '필수 정보를 모두 입력해주세요.' })
   }

   if (!password.trim()) {
      return res.status(400).json({ success: false, message: '비밀번호를 입력해주세요.' })
   }

   try {
      // 회원가입 시 중복된 아이디 또는 닉네임이 있을 경우, DB에서 오류 발생
      const hash = await bcrypt.hash(password, 12)

      const newUser = await User.create({
         login_id,
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
            login_id: newUser.login_id,
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
            message: field === 'login_id' ? '중복된 아이디입니다.' : '중복된 닉네임입니다.',
         })
      }

      res.status(500).json({ success: false, message: '서버 오류 발생', error: error.message })
   }
})

//자체로그인 localhost:8000/auth/login
router.post('/login', isNotLoggedIn, async (req, res, next) => {
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
               login_id: user.login_id,
               email: user.email,
               nickname: user.nickname,
               name: user.name,
               role: user.role,
            },
         })
      })
   })(req, res, next)
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
      res.json(req.user)
   } else {
      res.status(401).json({ message: 'Unauthorized' })
   }
})

// ✅ 로그아웃 처리
router.get('/logout', (req, res) => {
   req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' })
      res.redirect(process.env.FRONTEND_APP_URL)
   })
})

module.exports = router
