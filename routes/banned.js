const express = require('express')
const router = express.Router()
const { Banned, User, Admin, Report } = require('../models')
const { isLoggedIn, isAdmin } = require('./middlewares')

// ✅ 🚀 신고 접수 API (유저 신고)
router.post('/report', isLoggedIn, async (req, res) => {
   try {
      const { reportedUserId, reason } = req.body
      const reporterId = req.user?.id // ✅ req.user에서 가져오기

      if (!reporterId) {
         return res.status(401).json({ message: '로그인이 필요합니다.' })
      }

      // 🚀 자기 자신을 신고할 수 없도록 방지
      if (reportedUserId === reporterId) {
         return res.status(400).json({ message: '자기 자신을 신고할 수 없습니다.' })
      }

      // 🚀 신고 대상 유저 확인
      const reportedUser = await User.findByPk(reportedUserId)
      if (!reportedUser) {
         return res.status(404).json({ message: '신고 대상 유저를 찾을 수 없습니다.' })
      }

      // 🚀 이미 같은 유저를 신고했는지 확인 (중복 방지)
      const existingReport = await Report.findOne({ where: { reportedUserId, reportedById: reporterId } })
      if (existingReport) {
         return res.status(400).json({ message: '이미 신고한 유저입니다.' })
      }

      // 🚀 신고된 유저가 'BANNED' 상태인지 확인
      if (reportedUser.status === 'BANNED') {
         return res.status(400).json({ message: '이미 정지된 유저는 신고할 수 없습니다.' })
      }

      // 🚀 신고 저장
      const report = await Report.create({
         reportedUserId,
         reportedById: reporterId,
         reason,
      })

      res.status(201).json({ message: '신고가 접수되었습니다.', report })
   } catch (error) {
      console.error('❌ 신고 저장 오류:', error)
      res.status(500).json({ message: '서버 오류가 발생했습니다.' })
   }
})

// ✅ 🚀 관리자: 벤 적용 API
router.post('/ban', isAdmin, async (req, res) => {
   try {
      let { reportId, adminId, banDays } = req.body

      // 🚀 관리자 ID가 존재하는지 확인
      const admin = await Admin.findByPk(adminId)
      if (!admin) {
         return res.status(400).json({ message: '관리자 계정을 찾을 수 없습니다.' })
      }

      // 🚀 신고 정보 가져오기 (신고한 사람 정보 필요)
      const report = await Report.findByPk(reportId, {
         include: [
            { model: User, as: 'reportedBy', attributes: ['id', 'nickname'] }, // 🚀 신고한 유저 (명확한 alias)
            { model: User, as: 'reportedUser', attributes: ['id', 'nickname'] }, // 🚀 신고당한 유저 (명확한 alias)
         ],
      })
      if (!report) {
         return res.status(404).json({ message: '신고 내역을 찾을 수 없습니다.' })
      }
      // 🚀 벤 기간 계산
      const startDate = new Date()
      let endDate = null

      if (banDays !== -1) {
         banDays = parseInt(banDays, 10) // 🚀 숫자로 변환
         if (isNaN(banDays)) {
            return res.status(400).json({ message: '유효한 정지 기간을 입력하세요.' })
         }
         endDate = new Date()
         endDate.setDate(startDate.getDate() + banDays)
      }

      endDate.setDate(startDate.getDate() + parseInt(banDays)) // ✅ 정수 변환 후 더하기

      console.log('🚀 벤 적용 디버그:', {
         reportId,
         reportedUserId: report?.reportedUserId || '없음',
         reportedById: report?.reportedById || '없음',
         reason: report?.reason || '없음',
      })

      const bannedUser = await Banned.create({
         userId: report?.reportedUser?.id || null, // ✅ 신고당한 유저 (값이 없으면 null)
         reportedById: report?.reportedBy?.id || adminId, // ✅ 신고한 유저 (없으면 adminId로 대체)
         reason: report?.reason || '사유 없음',
         startDate,
         endDate,
         adminId, // 🚀 벤을 적용한 관리자 ID
      })

      // 🚀 신고된 유저 상태 변경
      await User.update({ status: 'BANNED' }, { where: { id: report.reportedUserId } })

      // 🚀 신고 내역 삭제 (이미 벤 됐으므로)
      await Report.destroy({ where: { id: reportId } })

      res.status(201).json({ message: `신고된 회원 ${report.reportedUser.nickname} 정지 적용 완료`, bannedUser })
   } catch (error) {
      console.error('❌ 벤 적용 오류:', error)
      res.status(500).json({ message: '서버 오류 발생', error: error.message })
   }
})

// ✅ 벤 기간 변경 API
router.put('/updateban', isAdmin, async (req, res) => {
   try {
      const { bannedId, newEndDate } = req.body // ✅ bannedId로 변경

      // ✅ 해당 벤 기록 찾기
      const bannedUser = await Banned.findOne({
         where: { bannedId }, // 🔥 기존 id → bannedId로 변경
      })

      if (!bannedUser) {
         return res.status(404).json({ message: `해당 정지 기록(${bannedId})을 찾을 수 없습니다.` })
      }

      // ✅ 정지 기간 업데이트
      await Banned.update({ endDate: newEndDate }, { where: { id: bannedId } })

      res.status(200).json({ message: '정지 기간이 변경되었습니다.', bannedId, newEndDate })
   } catch (error) {
      console.error('❌ 정지 기간 변경 오류:', error)
      res.status(500).json({ message: '서버 오류 발생', error: error.message })
   }
})

// ✅ 🚀 신고 목록 조회 API (관리자 전용)
router.get('/reports', isAdmin, async (req, res) => {
   try {
      const reports = await Report.findAll({
         include: [
            { model: User, as: 'reportedUser', attributes: ['id', 'nickname', 'status'] },
            { model: User, as: 'reportedBy', attributes: ['id', 'nickname'] },
         ],
         order: [['createdAt', 'DESC']],
      })

      res.status(200).json(reports)
   } catch (error) {
      console.error('❌ 신고 목록 불러오기 오류:', error)
      res.status(500).json({ message: '서버 오류가 발생했습니다.' })
   }
})

// ✅ 🚀 벤 목록 조회 API (관리자 전용)
router.get('/bannedusers', isAdmin, async (req, res) => {
   try {
      if (!req.user || req.user.role !== 'ADMIN') {
         return res.status(403).json({ message: '관리자 권한이 필요합니다.' })
      }

      const bannedUsers = await Banned.findAll({
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
               as: 'reportedUser',
               required: false, // 🚀 해당 유저가 없어도 결과 반환
            },
            {
               model: User,
               attributes: ['id', 'nickname'],
               as: 'reportedBy',
               required: false, // 🚀 해당 유저가 없어도 결과 반환
            },
            { model: Admin, attributes: ['id'] },
         ],
         order: [['createdAt', 'DESC']],
      })

      // ✅ 🚀 신고 사유를 banned 테이블에서 직접 가져오기 (Report 조회 X)
      for (let bannedUser of bannedUsers) {
         bannedUser.dataValues.reason = bannedUser.reason || '사유 없음'
      }
      res.status(200).json(bannedUsers)
   } catch (error) {
      console.error('❌ 정지된 유저 목록 불러오기 오류:', error)
      res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message })
   }
})

module.exports = router
