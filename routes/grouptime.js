// routes/grouptime.js
const express = require('express')
const router = express.Router()
const { Grouptime, Studygroup, Groupmember } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 특정 유저와 그룹의 타이머 정보 조회
router.get('/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id

      const grouptimeData = await Grouptime.findOne({
         where: { groupId, userId },
      })

      if (!grouptimeData) {
         // 타이머 정보가 없으면 새로 생성
         const newGrouptime = await Grouptime.create({
            time: '00:00:00',
            groupId,
            userId,
         })
         return res.status(201).json({ success: true, grouptime: newGrouptime })
      }

      res.json({ success: true, grouptime: grouptimeData })
   } catch (error) {
      console.error('타이머 정보 조회 실패:', error)
      res.status(500).json({ success: false, message: '타이머 정보 조회 실패', error })
   }
})

// 타이머 정보 업데이트
router.put('/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id
      const { time } = req.body

      const [updated, grouptimeData] = await Grouptime.update(
         { time },
         {
            where: { groupId, userId },
            returning: true,
         }
      )

      if (updated === 0) {
         // 업데이트할 데이터가 없으면 새로 생성
         const newGrouptime = await Grouptime.create({
            time,
            groupId,
            userId,
         })
         return res.status(201).json({ success: true, grouptime: newGrouptime })
      }

      res.json({ success: true, message: '타이머 정보 업데이트 성공', grouptime: grouptimeData })
   } catch (error) {
      console.error('타이머 정보 업데이트 실패:', error)
      res.status(500).json({ success: false, message: '타이머 정보 업데이트 실패', error })
   }
})

// 캡차 실패 시 스터디 그룹 참여 상태 변경
router.patch('/captcha-fail/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id

      // 그룹 멤버 상태 변경
      await Groupmember.update({ status: 'off' }, { where: { groupId, userId } })

      res.json({ success: true, message: '캡차 실패로 스터디 참여 상태가 변경되었습니다.' })
   } catch (error) {
      console.error('캡차 실패 처리 오류:', error)
      res.status(500).json({ success: false, message: '캡차 실패 처리 중 오류 발생', error })
   }
})

module.exports = router
