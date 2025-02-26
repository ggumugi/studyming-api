const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const LocalStrategy = require('./localStrategy') // ✅ Local 로그인 전략 추가
const User = require('../models/user') // ✅ DB에서 사용자 조회
require('dotenv').config()

module.exports = () => {
   console.log('📌 Passport 초기화 시작')

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
      console.log('✅ serializeUser 실행: 사용자 ID ->', user.id)
      done(null, user.id) // ✅ user.id만 저장 (Google 로그인도 user.id 사용)
   })

   // ✅ deserializeUser (Local & Google 로그인 공통)
   passport.deserializeUser(async (id, done) => {
      console.log('✅ deserializeUser 실행:', id) // ✅ 요청마다 실행되는지 확인
      try {
         const user = await User.findByPk(id)
         console.log('🔍 DB에서 찾은 사용자:', user) // ✅ 추가: DB에서 찾은 사용자 확인
         if (!user) {
            console.log('❌ 사용자 정보를 찾을 수 없습니다.')
            return done(null, false)
         }
         console.log('✅ 사용자 정보 로드 성공:', user) // ✅ 사용자 데이터 확인
         return done(null, user)
      } catch (error) {
         return done(error)
      }
   })
}
