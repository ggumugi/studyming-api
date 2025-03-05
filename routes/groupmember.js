const express = require('express')
const router = express.Router()
const { Studygroup, Groupmember, User, Grouptime, Groupban } = require('../models')

// =====================================================
// 구체적인 경로를 가진 라우트를 먼저 정의 (순서 중요)
// =====================================================

// 로그인한 유저가 가입한 스터디 그룹 목록 가져오기
router.get('/user/studygroups', async (req, res) => {
   try {
      const userId = req.user.id

      // 유저가 가입한 그룹멤버 정보와 해당 스터디그룹 정보를 함께 조회
      const userGroups = await Groupmember.findAll({
         where: { userId },
         include: [
            {
               model: Studygroup,
               attributes: ['id', 'name', 'countMembers'],
            },
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
         ],
      })

      // 스터디 그룹 정보만 추출하여 반환
      const studyGroups = userGroups.map((member) => ({
         id: member.Studygroup.id,
         name: member.Studygroup.name,
         members: member.Studygroup.countMembers,
         role: member.role,
         status: member.status,
         userId: member.userId,
         userNickname: member.User.nickname,
      }))

      res.json({
         success: true,
         studyGroups,
      })
   } catch (error) {
      console.error('유저 스터디 그룹 조회 실패:', error)
      res.status(500).json({ success: false, message: '유저 스터디 그룹 조회 실패', error: error.message })
   }
})

// 그룹 멤버 참여 상태 업데이트
// 스터디 그룹 참여 상태 변경 (on/off)
router.patch('/participate/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user?.id // 옵셔널 체이닝 추가
      const { status } = req.body

      console.log(`그룹 참여 상태 변경 요청: 그룹 ID ${groupId}, 사용자 ID ${userId}, 상태 ${status}`)

      // 사용자 ID 확인
      if (!userId) {
         return res.status(401).json({
            success: false,
            message: '인증 정보가 유효하지 않습니다.',
         })
      }

      // 그룹 멤버 조회
      const groupmember = await Groupmember.findOne({
         where: { groupId, userId },
      })

      if (!groupmember) {
         return res.status(404).json({
            success: false,
            message: '그룹 멤버를 찾을 수 없습니다.',
         })
      }

      // 상태 업데이트
      await groupmember.update({ status })

      res.json({
         success: true,
         message: '그룹 참여 상태가 변경되었습니다.',
         groupmember,
      })
   } catch (error) {
      console.error('그룹 참여 상태 변경 실패:', error)
      res.status(500).json({
         success: false,
         message: '그룹 참여 상태 변경 중 오류가 발생했습니다.',
         error: error.message,
      })
   }
})

// 강퇴 API - 방장만 실행 가능
router.delete('/kick/:groupId/:userId', async (req, res) => {
   try {
      const { groupId, userId } = req.params
      const leaderId = req.user.id // 현재 요청한 유저 (방장인지 확인)

      // 현재 요청자가 방장인지 확인
      const leader = await Groupmember.findOne({
         where: { groupId, userId: leaderId, role: 'leader' },
      })

      if (!leader) {
         return res.status(403).json({ success: false, message: '방장만 강퇴할 수 있습니다.' })
      }

      // 강퇴할 멤버가 그룹에 있는지 확인
      const member = await Groupmember.findOne({
         where: { groupId, userId },
      })

      if (!member) {
         return res.status(400).json({ success: false, message: '강퇴할 대상이 그룹에 없습니다.' })
      }

      // `groupban` 테이블에 강퇴된 유저 추가 (중복 추가 방지)
      const existingBan = await Groupban.findOne({ where: { groupId, userId } })

      if (!existingBan) {
         const banResult = await Groupban.create({ groupId, userId })
         console.log('✅ `groupban` 추가 성공:', banResult)
      } else {
         console.log('⚠️ 이미 `groupban` 테이블에 있는 유저입니다.')
      }

      // 강퇴할 멤버 삭제 (그룹에서 제거)
      await member.destroy()

      // 스터디 그룹 멤버 수 감소
      await Studygroup.decrement('countMembers', { by: 1, where: { id: groupId } })

      res.json({ success: true, message: '유저가 강퇴 및 그룹 벤 처리되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '강퇴 실패', error })
   }
})

// =====================================================
// 일반적인 라우트 정의
// =====================================================

// 그룹 멤버 가입
router.post('/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id

      // 그룹 벤 여부 확인
      const isBanned = await Groupban.findOne({
         where: { groupId, userId },
      })

      if (isBanned) {
         return res.status(403).json({ success: false, message: '이 그룹에서 차단되었습니다. 가입할 수 없습니다.' })
      }

      // 이미 가입된 유저인지 확인
      const existingMember = await Groupmember.findOne({
         where: { groupId, userId },
      })

      if (existingMember) {
         return res.status(400).json({ success: false, message: '이미 가입된 유저입니다.' })
      }

      // 그룹 멤버 추가
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

      await Studygroup.increment('countMembers', {
         by: 1,
         where: { id: groupId },
      })

      res.status(201).json({ success: true, groupmember })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '그룹 멤버 참여 실패', error })
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

// 방장 위임 (경로 충돌 가능성 있어 순서 중요)
router.put('/:groupId', async (req, res) => {
   console.log('방장 위임 API 요청 수신')
   console.log('받은 groupId:', req.params.groupId)
   console.log('받은 newLeaderId:', req.body.newLeaderId)

   if (!req.params.groupId || !req.body.newLeaderId) {
      return res.status(400).json({ success: false, message: 'groupId 또는 newLeaderId가 없습니다.' })
   }

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

// 그룹 멤버 전체 불러오기 (가장 일반적인 경로이므로 마지막에 정의)
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

module.exports = router
