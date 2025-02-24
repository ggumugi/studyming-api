const express = require('express')
const router = express.Router()
const { Studygroup, Groupmember, User, Grouptime } = require('../models')

// 그룹 멤버 참여
router.post('/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params
      const { userId, role = 'member' } = req.body
      const now = new Date()
      const access = now.toISOString().slice(0, 16).replace('T', ' ') // "2023-10-25 12:34"

      // 그룹 멤버 생성
      const groupmember = await Groupmember.create({
         groupId,
         userId,
         role,
         status: 'on',
         access,
         rewards: 0,
         shareState: false,
         camState: false,
         voiceState: false,
      })

      await Grouptime.create({
         time: '00:00:00', // 생성자는 리더로 설정
         groupId,
         userId,
      })

      res.status(201).json({ success: true, groupmember })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 참여 실패', error })
   }
})

// 그룹 멤버 탈퇴
router.delete('/:groupId/', async (req, res) => {
   try {
      const { groupId, userId } = req.params

      // 그룹 멤버 삭제
      const result = await Groupmember.destroy({
         where: { groupId, userId },
      })

      if (result === 0) {
         return res.status(404).json({ success: false, message: '그룹 멤버를 찾을 수 없음' })
      }

      res.json({ success: true, message: '그룹 멤버 탈퇴 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 탈퇴 실패', error })
   }
})

// 그룹 멤버 특정인 정보 업데이트
router.put('/:groupId/:userId', async (req, res) => {
   try {
      const { groupId, userId } = req.params
      const updateData = req.body

      // 그룹 멤버 정보 업데이트
      const [updated] = await Groupmember.update(updateData, {
         where: { groupId, userId },
      })

      if (updated === 0) {
         return res.status(404).json({ success: false, message: '그룹 멤버를 찾을 수 없음' })
      }

      res.json({ success: true, message: '그룹 멤버 정보 업데이트 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 정보 업데이트 실패', error })
   }
})

// 그룹 멤버 전체 불러오기
router.get('/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params

      // 그룹 멤버 전체 조회
      const groupmembers = await Groupmember.findAll({
         where: { groupId },
         include: [
            {
               model: User, // User 모델 조인
               attributes: ['id', 'nickname'], // 필요한 필드만 선택
            },
         ],
      })

      res.json({ success: true, groupmembers })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 전체 조회 실패', error })
   }
})

// 그룹 멤버 특정인 불러오기
router.get('/:groupId/:userId', async (req, res) => {
   try {
      const { groupId, userId } = req.params

      // 그룹 멤버 조회
      const groupmember = await Groupmember.findOne({
         where: { groupId, userId },
         include: [
            {
               model: User, // User 모델 조인
               attributes: ['id', 'nickname'], // 필요한 필드만 선택
            },
         ],
      })

      if (!groupmember) {
         return res.status(404).json({ success: false, message: '그룹 멤버를 찾을 수 없음' })
      }

      res.json({ success: true, groupmember })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 조회 실패', error })
   }
})

module.exports = router
