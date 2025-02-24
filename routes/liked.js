//스터디 그룹 좋아요 기능 라우터

const express = require('express')
const router = express.Router()
const { Liked } = require('../models')
//const { isLoggedIn } = require('./middlewares') // ✅ 로그인한 사용자만 좋아요 가능
// ✅ 스터디 그룹 좋아요 기능 (좋아요 추가 & 취소)

router.post('/:id/like', async (req, res) => {
   try {
      const { id } = req.params // 스터디 그룹 ID
      const { user } = req.body // 좋아요 누른 유저 정보

      // 스터디 그룹이 존재하는지 확인
      const studygroup = await studygroup.findByPk(id)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없습니다.' })
      }

      // Liked 테이블에서 해당 그룹의 좋아요 정보 가져오기
      const likedData = await Liked.findOne({ where: { groupId: id } })

      if (!likedData) {
         return res.status(404).json({ success: false, message: '좋아요 정보를 찾을 수 없습니다.' })
      }

      // 사용자가 이미 좋아요를 눌렀는지 확인
      const existingLike = await UserLike.findOne({ where: { groupId: id, userId: user } })

      if (existingLike) {
         // 좋아요 취소 (이미 좋아요를 누른 경우)
         await existingLike.destroy() // 유저의 좋아요 기록 삭제
         likedData.liked -= 1 // 좋아요 수 -1
         await likedData.save()

         return res.status(200).json({ success: true, liked: likedData.liked, message: '좋아요가 취소되었습니다.' })
      } else {
         // 좋아요 추가 (좋아요가 없는 경우)
         await UserLike.create({ groupId: id, userId: user }) // 유저 좋아요 기록 추가
         likedData.liked += 1 // 좋아요 수 +1
         await likedData.save()

         return res.status(200).json({ success: true, liked: likedData.liked, message: '좋아요가 추가되었습니다.' })
      }
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '좋아요 처리 중 오류 발생', error })
   }
})

module.exports = router
