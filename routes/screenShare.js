// routes/screenShare.js
const express = require('express')
const router = express.Router()
const { Groupmember, User } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 화면 공유 상태 업데이트
router.patch('/status', isLoggedIn, async (req, res) => {
   try {
      const { groupId, userId, shareState } = req.body

      // 요청한 사용자가 본인인지 확인
      if (req.user.id !== userId) {
         return res.status(403).json({
            success: false,
            message: '다른 사용자의 상태를 변경할 수 없습니다.',
         })
      }

      // 그룹 멤버 정보 조회
      const groupmember = await Groupmember.findOne({
         where: { groupId, userId },
      })

      if (!groupmember) {
         return res.status(404).json({
            success: false,
            message: '그룹 멤버를 찾을 수 없습니다.',
         })
      }

      // 화면 공유 상태 업데이트
      await groupmember.update({ shareState })

      res.json({
         success: true,
         message: '화면 공유 상태가 업데이트되었습니다.',
         groupmember,
      })
   } catch (error) {
      console.error('화면 공유 상태 업데이트 오류:', error)
      res.status(500).json({
         success: false,
         message: '화면 공유 상태 업데이트 실패',
         error: error.message,
      })
   }
})

// 그룹의 화면 공유 상태 조회
router.get('/status/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params

      // 그룹의 모든 멤버 조회
      const groupmembers = await Groupmember.findAll({
         where: { groupId },
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
         ],
      })

      // 화면 공유 중인 멤버 찾기
      const sharingMembers = groupmembers.filter((member) => member.shareState)

      res.json({
         success: true,
         groupmembers,
         sharingMembersCount: sharingMembers.length,
         sharingMembers: sharingMembers.map((member) => ({
            userId: member.userId,
            nickname: member.User ? member.User.nickname : `사용자 ${member.userId}`,
         })),
      })
   } catch (error) {
      console.error('그룹 화면 공유 상태 조회 오류:', error)
      res.status(500).json({
         success: false,
         message: '그룹 화면 공유 상태 조회 실패',
         error: error.message,
      })
   }
})

// 활성 피어 목록 조회
router.get('/peers/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params

      // 활성 상태인 그룹 멤버만 조회
      const groupmembers = await Groupmember.findAll({
         where: {
            groupId,
            status: 'on', // 활성 상태인 멤버만
         },
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
         ],
      })

      // 응답 데이터 구성
      const peers = groupmembers.map((member) => ({
         userId: member.userId,
         nickname: member.User ? member.User.nickname : `사용자 ${member.userId}`,
         peerId: `user-${member.userId}-group-${groupId}`,
         shareState: member.shareState,
         camState: member.camState,
         voiceState: member.voiceState,
      }))

      res.json({
         success: true,
         peers,
         count: peers.length,
      })
   } catch (error) {
      console.error('활성 피어 목록 조회 오류:', error)
      res.status(500).json({
         success: false,
         message: '활성 피어 목록 조회 실패',
         error: error.message,
      })
   }
})

// 피어 연결 로그 저장 (옵션 - 디버깅용)
router.post('/logs', isLoggedIn, async (req, res) => {
   try {
      const { peerId, status, details } = req.body

      // 여기서 로그를 DB에 저장하거나 필요한 처리를 할 수 있습니다
      console.log(`[Peer Log] ${peerId}: ${status}`, details)

      res.json({
         success: true,
         message: '로그가 저장되었습니다.',
      })
   } catch (error) {
      console.error('피어 로그 저장 오류:', error)
      res.status(500).json({
         success: false,
         message: '피어 로그 저장 실패',
         error: error.message,
      })
   }
})

module.exports = router
