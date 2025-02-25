const express = require('express')
const router = express.Router()
const { Likedgroup, Studygroup } = require('../models') // ✅ Liked 대신 Likedgroup 사용
const { isLoggedIn } = require('./middlewares') // ✅ 로그인한 사용자만 좋아요 가능

// ✅ 좋아요 추가 또는 취소 (토글 기능)
router.post('/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id // 로그인한 유저 ID

      // ✅ 존재하는 스터디 그룹인지 확인
      const studygroup = await Studygroup.findByPk(groupId)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '존재하지 않는 스터디 그룹입니다.' })
      }

      // ✅ 기존 좋아요 여부 확인
      const existingLike = await Likedgroup.findOne({ where: { userId, groupId } })

      if (existingLike) {
         // ✅ 좋아요 취소 (기존 데이터 삭제)
         await existingLike.destroy()
         return res.status(200).json({ success: true, liked: false, message: '좋아요가 취소되었습니다.' })
      } else {
         // ✅ 좋아요 추가
         await Likedgroup.create({ userId, groupId })
         return res.status(201).json({ success: true, liked: true, message: '스터디 그룹을 좋아요했습니다.' })
      }
   } catch (error) {
      console.error('❌ 좋아요 처리 중 오류:', error)
      res.status(500).json({ success: false, message: '좋아요 처리 중 오류가 발생했습니다.', error })
   }
})

// ✅ 특정 스터디 그룹의 좋아요 개수 가져오기
router.get('/:groupId/count', async (req, res) => {
   try {
      const { groupId } = req.params

      // ✅ 해당 스터디 그룹의 좋아요 개수 조회
      const likeCount = await Likedgroup.count({ where: { groupId } })

      return res.status(200).json({ success: true, likeCount })
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

      const existingLike = await Likedgroup.findOne({ where: { userId, groupId } })

      return res.status(200).json({ success: true, liked: !!existingLike })
   } catch (error) {
      console.error('❌ 좋아요 상태 확인 중 오류:', error)
      res.status(500).json({ success: false, message: '좋아요 상태 확인 중 오류가 발생했습니다.', error })
   }
})

module.exports = router
