const express = require('express')
const passport = require('passport')
const bcrypt = require('bcrypt')
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')
const User = require('../models/user')
const Auth = require('../models/auth')

const router = express.Router()
//회원가입 localhost:8000/auth/signup
router.post('/signup', isNotLoggedIn, async (req, res, next) => {
   console.log('회원가입 요청 데이터:', req.body) // ✅ 서버에서 요청 데이터 확인

   const { email, password, nickname, name, login_id } = req.body
   // 🚨 1. 필수 값이 누락되었는지 확인
   if (!email || !password || !nickname || !name || !login_id) {
      return res.status(400).json({
         success: false,
         message: '필수 정보를 모두 입력해주세요.',
      })
   }

   // 🚨 2. 비밀번호 값이 있는지 확인
   if (!password.trim()) {
      // 공백 입력 방지
      return res.status(400).json({
         success: false,
         message: '비밀번호를 입력해주세요.',
      })
   }

   try {
      //이메일로 기존 사용자 검색(중복확인)
      // select * from users where email = ?
      const exUser = await User.findOne({ where: { email } })

      if (exUser) {
         //이미 사용자가 존재할 경우 409 상태코드와 메세지를 json객체로 응답하면서 함수를 끝냄
         return res.status(409).json({
            success: false,
            message: '이미 존재하는 사용자입니다.',
         })
      }

      // ---이메일 중복 확인을 통과시 새로운 사용자 계정 생성----

      //비밀번호 암호화
      const hash = await bcrypt.hash(password, 12) // 12: salt(해시 암호화를 진행시 추가되는 임의의 데이터로 10~12 정도의 값이 권장)

      //새로운 사용자 생성
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

      console.log('새로 생성된 유저:', newUser) // ✅ 회원가입 후 생성된 데이터 확인

      //성공 응답 반환
      res.status(201).json({
         success: true,
         message: '사용자가 성공적으로 등록되었습니다.',
         user: {
            id: newUser.id,
            login_d: newUser.login_id,
            email: newUser.email,
            role: newUser.role,
            nickname: newUser.nickname,
            name: newUser.name,
            status: 'ACTIVE', // 회원가입 시 명시적으로 'ACTIVE' 설정
            gender: 'NONE', // 회원가입 시 명시적으로 'NONE' 설정
            birth: null, // 회원가입 시 기본적으로 null (생년월일 입력 안 하면)
         },
      })
   } catch (error) {
      //try문 어딘가에서 에러가 발생하면 500상태 코드와 json 객체 응답
      console.error(error)
      res.status(500).json({
         success: false,
         message: '회원가입 중 오류가 발생했습니다.',
         error: error.message, // 추가: 오류 메시지 반환
      })
   }
})

// ✅ 아이디 중복 확인
router.get('/check-id', async (req, res) => {
   const { login_id } = req.query // 프론트에서 보낸 아이디 값 받기

   try {
      const existingUser = await User.findOne({ where: { login_id } }) // DB에서 아이디 조회

      if (existingUser) {
         return res.status(409).json({ success: false, message: '이미 존재하는 아이디입니다.' }) // 중복된 아이디
      }

      res.json({ success: true, message: '사용 가능한 아이디입니다.' }) // 사용 가능
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error })
   }
})

// ✅ 닉네임 중복 확인
router.get('/check-nickname', async (req, res) => {
   const { nickname } = req.query // 프론트에서 보낸 닉네임 값 받기

   try {
      const existingUser = await User.findOne({ where: { nickname } }) // DB에서 닉네임 조회

      if (existingUser) {
         return res.status(409).json({ success: false, message: '이미 존재하는 닉네임입니다.' }) // 중복된 닉네임
      }

      res.json({ success: true, message: '사용 가능한 닉네임입니다.' }) // 사용 가능
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error })
   }
})

//자체로그인 localhost:8000/auth/login

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
