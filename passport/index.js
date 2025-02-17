const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const localStrategy = require('./localStrategy') // ✅ Local 로그인 전략 추가
require('dotenv').config()

module.exports = () => {
   console.log('📌 Passport 초기화 시작') // ✅ Passport 초기화 확인용 로그

   // ✅ Local 로그인 전략 실행
   localStrategy()

   passport.use(
      new GoogleStrategy(
         {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
         },
         (accessToken, refreshToken, profile, done) => {
            return done(null, profile)
         }
      )
   )

   passport.serializeUser((user, done) => {
      done(null, user)
   })

   passport.deserializeUser((obj, done) => {
      done(null, obj)
   })
}
