const express = require('express')
const router = express.Router()
const { Studygroup, User } = require('../models') // ✅ Liked 대신 Likedgroup 사용
const { isLoggedIn } = require('./middlewares') // ✅ 로그인한 사용자만 좋아요 가능

// ✅ 좋아요 추가 또는 삭제 (토글 기능)
router.post('/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id // 로그인한 유저 ID

      // ✅ Studygroup 찾기
      const studygroup = await Studygroup.findByPk(groupId)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '존재하지 않는 스터디 그룹입니다.' })
      }

      // ✅ 좋아요 여부 확인
      const existingLike = await studygroup.hasLikedUsers(userId)

      if (existingLike) {
         // ✅ 좋아요 취소
         await studygroup.removeLikedUsers(userId)
      } else {
         // ✅ 좋아요 추가
         await studygroup.addLikedUsers(userId)
      }

      // ✅ 최신 좋아요 개수 가져오기
      const likedUsers = await studygroup.getLikedUsers()
      const likeCount = likedUsers.length // 좋아요 개수

      return res.status(200).json({
         success: true,
         liked: !existingLike, // ✅ 좋아요 여부 반전
         likeCount, // ✅ 최신 좋아요 개수 반환
         message: existingLike ? '좋아요가 취소되었습니다.' : '스터디 그룹을 좋아요했습니다.',
      })
   } catch (error) {
      console.error('❌ 좋아요 처리 중 오류:', error)
      res.status(500).json({ success: false, message: '좋아요 처리 중 오류가 발생했습니다.', error })
   }
})
// ✅ 특정 스터디 그룹의 좋아요 개수 가져오기
router.get('/:groupId/count', async (req, res) => {
   try {
      const { groupId } = req.params

      // ✅ Studygroup 찾기
      const studygroup = await Studygroup.findByPk(groupId)

      if (!studygroup) {
         return res.status(404).json({ success: false, message: '존재하지 않는 스터디 그룹입니다.' })
      }

      // ✅ 좋아요 개수 확인 (`getLikedUsers()` 사용)
      const likedUsers = (await studygroup.getLikedUsers()) || [] // ✅ 만약 undefined라면 빈 배열 처리

      console.log(`✅ 좋아요한 유저 리스트 (${groupId}):`, likedUsers) // ✅ 디버깅용 로그

      const likeCount = likedUsers.length || 0 // ✅ 만약 좋아요가 없으면 0으로 처리

      return res.status(200).json({ success: true, likeCount }) // ✅ 성공 응답
   } catch (error) {
      console.error('❌ 좋아요 개수 조회 중 오류:', error)
      res.status(500).json({ success: false, message: '좋아요 개수 조회 중 오류가 발생했습니다.', error })
   }
})

// ✅ 로그인한 유저가 특정 그룹을 좋아요했는지 여부 확인
router.get('/:groupId/status', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id

      // ✅ Studygroup 모델을 통해 좋아요 여부 확인
      const studygroup = await Studygroup.findByPk(groupId)

      if (!studygroup) {
         return res.status(404).json({ success: false, message: '존재하지 않는 스터디 그룹입니다.' })
      }

      const existingLike = await studygroup.hasLikedUsers(userId) // ✅ 좋아요 여부 확인

      return res.status(200).json({ success: true, liked: existingLike }) // ✅ true / false 반환
   } catch (error) {
      console.error('❌ 좋아요 상태 확인 중 오류:', error)
      res.status(500).json({ success: false, message: '좋아요 상태 확인 중 오류가 발생했습니다.', error })
   }
})

module.exports = router
