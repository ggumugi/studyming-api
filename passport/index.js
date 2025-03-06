const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const LocalStrategy = require('./localStrategy') // ✅ Local 로그인 전략 추가
const User = require('../models/user') // ✅ DB에서 사용자 조회
require('dotenv').config()

module.exports = () => {
   // ✅ Local 로그인 전략 실행
   LocalStrategy()

   // ✅ Google 로그인 전략 추가
   passport.use(
      new GoogleStrategy(
         {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
         },
         async (accessToken, refreshToken, profile, done) => {
            try {
               let user = await User.findOne({ where: { email: profile.emails[0].value } })

               if (!user) {
                  // 회원가입이 필요한 경우, 프로필 정보를 전달
                  return done(null, false, {
                     message: '회원가입이 필요합니다.',
                     profile: {
                        email: profile.emails[0].value, // 구글 이메일
                        nickname: profile.displayName, // 구글 닉네임
                     },
                  })
               }

               return done(null, user)
            } catch (error) {
               return done(error)
            }
         }
      )
   )

   // ✅ serializeUser (Local & Google 로그인 공통)
   passport.serializeUser((user, done) => {
      done(null, user.id) // ✅ user.id만 저장 (Google 로그인도 user.id 사용)
   })

   // ✅ deserializeUser (Local & Google 로그인 공통)
   passport.deserializeUser(async (id, done) => {
      try {
         const user = await User.findByPk(id)

         if (!user) {
            return done(null, false)
         }

         return done(null, user)
      } catch (error) {
         return done(error)
      }
   })
}
