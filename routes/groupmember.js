const express = require('express')
const router = express.Router()
const { Studygroup, Groupmember, User, Grouptime, Groupban } = require('../models')

// 그룹 멤버 가입
router.post('/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id
      // const now = new Date()
      // const access = now.toISOString().slice(0, 16).replace('T', ' ') // "2023-10-25 12:34"

      // 해당 그룹에 이미 가입된 유저인지 확인
      const existingMember = await Groupmember.findOne({
         where: { groupId, userId },
      })

      if (existingMember) {
         return res.status(400).json({ success: false, message: '이미 가입된 유저입니다.' })
      }

      // 그룹 멤버 생성
      const groupmember = await Groupmember.create({
         groupId,
         userId,
         role: 'member',
         status: 'off',
         access: null,
         rewards: 0,
         shareState: false,
         camState: false,
         voiceState: false,
      })

      await Grouptime.create({
         time: '00:00:00',
         groupId,
         userId,
      })

      // Studygroup의 countMembers 값 증가
      await Studygroup.increment('countMembers', {
         by: 1,
         where: { id: groupId }, // 그룹 ID에 해당하는 Studygroup을 찾음
      })

      res.status(201).json({ success: true, groupmember })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 참여 실패', error })
   }
})

// 그룹 멤버 참여 상태 업데이트
router.patch('/participate/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id // 로그인한 사용자의 ID
      const { status } = req.body // 입력된 상태 받기

      if (!['on', 'off'].includes(status)) {
         return res.status(400).json({ success: false, message: '잘못된 상태 값입니다.' })
      }

      // 해당 그룹의 멤버 정보 조회
      const groupmember = await Groupmember.findOne({
         where: { groupId, userId },
      })

      // 그룹 멤버가 존재하는지 확인
      if (!groupmember) {
         return res.status(404).json({ success: false, message: '그룹 멤버를 찾을 수 없음' })
      }

      // 상태를 변수에 따라 변경
      await groupmember.update({ status })

      res.json({ success: true, message: '그룹 멤버 상태가 변경되었습니다.', groupmember })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 상태 변경 실패', error })
   }
})

// 그룹 멤버 탈퇴
router.delete('/:groupId/:userId', async (req, res) => {
   try {
      const { groupId, userId } = req.params

      // 그룹 멤버 삭제
      const result = await Groupmember.destroy({
         where: { groupId, userId },
      })

      if (result === 0) {
         return res.status(404).json({ success: false, message: '그룹 멤버를 찾을 수 없음' })
      }
      // 스터디 그룹 멤버 수 감소
      await Studygroup.decrement('countMembers', { by: 1, where: { id: groupId } })

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

// 방장 위임
router.put('/:groupId', async (req, res) => {
   console.log('방장 위임 API 요청 수신')
   console.log('받은 groupId:', req.params.groupId)
   console.log('받은 newLeaderId:', req.body.newLeaderId)

   if (!req.params.groupId || !req.body.newLeaderId) {
      return res.status(400).json({ success: false, message: 'groupId 또는 newLeaderId가 없습니다.' })
   }
   // console.log(`🟢 요청된 데이터 - groupId: ${groupId}, 현재 방장 ID: ${userId}, 새 방장 ID: ${newLeaderId}`)

   try {
      const { groupId } = req.params
      const { newLeaderId } = req.body
      const userId = req.user.id // 현재 요청한 유저

      // 현재 방장인지 확인
      const currentLeader = await Groupmember.findOne({
         where: { groupId, userId, role: 'leader' },
      })

      if (!currentLeader) {
         return res.status(403).json({ success: false, message: '방장만 위임할 수 있습니다.' })
      }

      // 새 방장 유효성 검사
      const newLeader = await Groupmember.findOne({
         where: { groupId, userId: newLeaderId, role: 'member' },
      })

      if (!newLeader) {
         return res.status(400).json({ success: false, message: '위임할 대상이 유효하지 않습니다.' })
      }

      // 방장 위임 처리
      await currentLeader.update({ role: 'member' }) // 기존 방장 -> 일반 멤버
      await newLeader.update({ role: 'leader' }) // 새로운 멤버 -> 방장

      // Studygroup 테이블의 createdBy 변경
      await Studygroup.update({ createdBy: newLeaderId }, { where: { id: groupId } })

      res.json({ success: true, message: '방장 위임 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '방장 위임 실패', error })
   }
})

// ✅ 강퇴 API - 방장만 실행 가능
router.delete('/:groupId/:userId', async (req, res) => {
   try {
      const { groupId, userId } = req.params
      const leaderId = req.user.id // 현재 요청한 유저 (방장인지 확인)

      // ✅ 현재 요청자가 방장인지 확인
      const leader = await Groupmember.findOne({
         where: { groupId, userId: leaderId, role: 'leader' },
      })

      if (!leader) {
         return res.status(403).json({ success: false, message: '방장만 강퇴할 수 있습니다.' })
      }

      // ✅ 강퇴할 멤버가 그룹에 있는지 확인
      const member = await Groupmember.findOne({
         where: { groupId, userId, role: 'member' },
      })

      if (!member) {
         return res.status(400).json({ success: false, message: '강퇴할 대상이 그룹에 없습니다.' })
      }

      // ✅ 강퇴할 멤버 삭제 (그룹에서 제거)
      await member.destroy()

      // 스터디 그룹 멤버 수 감소
      await Studygroup.decrement('countMembers', { by: 1, where: { id: groupId } })

      // ✅ `groupban` 테이블에 강퇴된 유저 추가
      await Groupban.create({ groupId, userId })
      console.log('✅ `groupban` 테이블에 강퇴된 유저 직접 추가 완료!')

      res.json({ success: true, message: '유저가 강퇴되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '강퇴 실패', error })
   }
})

module.exports = router
