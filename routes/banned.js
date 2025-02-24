const express = require('express')
const router = express.Router()
const { Banned, User, Admin, Report } = require('../models')
const { isLoggedIn, isAdmin } = require('./middlewares')

// ✅ 🚀 신고 접수 API (유저 신고)
router.post('/report', isLoggedIn, async (req, res) => {
   try {
      const { reportedUserId, reporterId, reason } = req.body

      const reportedUser = await User.findByPk(reportedUserId)
      if (!reportedUser) {
         return res.status(404).json({ message: '신고 대상 유저를 찾을 수 없습니다.' })
      }

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
      const { reportId, adminId, banDays } = req.body

      // 신고 내역 조회
      const report = await Report.findByPk(reportId)
      if (!report) {
         return res.status(404).json({ message: '신고 내역을 찾을 수 없습니다.' })
      }

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + parseInt(banDays))

      // 신고된 유저 상태 업데이트
      await User.update({ status: 'BANNED' }, { where: { id: report.reportedUserId } })

      // 벤 내역 저장
      const banned = await Banned.create({
         userId: report.reportedUserId,
         adminId,
         reason: report.reason, // ✅ 신고 사유 그대로 사용
         startDate,
         endDate,
      })

      // ✅ 신고 내역 삭제 (벤이 적용된 신고만 삭제)
      await report.destroy()

      res.status(201).json({ message: '유저가 정지되었습니다.', banned })
   } catch (error) {
      console.error('❌ 벤 적용 오류:', error)
      res.status(500).json({ message: '서버 오류가 발생했습니다.' })
   }
})

// ✅ 🚀 신고 목록 조회 API (관리자 전용)
router.get('/reports', isAdmin, async (req, res) => {
   try {
      const reports = await Report.findAll({
         include: [
            { model: User, as: 'ReportedUser', attributes: ['id', 'nickname', 'status'] },
            { model: User, as: 'ReportedBy', attributes: ['id', 'nickname'] },
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
router.get('/banned-users', isAdmin, async (req, res) => {
   try {
      const bannedUsers = await Banned.findAll({
         include: [{ model: User, attributes: ['id', 'nickname', 'status'] }],
         order: [['startDate', 'DESC']],
      })

      res.status(200).json(bannedUsers)
   } catch (error) {
      console.error('❌ 벤 목록 불러오기 오류:', error)
      res.status(500).json({ message: '서버 오류가 발생했습니다.' })
   }
})

module.exports = router
