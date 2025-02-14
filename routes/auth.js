const express = require('express')
const passport = require('passport')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Auth = require('../models/auth')

const router = express.Router()

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
