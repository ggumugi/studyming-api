// studygroup.js (백엔드 라우터)
const express = require('express')
const { verifyToken } = require('./middlewares')
const { Studygroup } = require('../models')
const router = express.Router()

// 스터디 그룹 생성
router.post('/', verifyToken, async (req, res) => {
   try {
      const studygroup = await Studygroup.create(req.body)
      res.status(201).json({ success: true, studygroup })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 생성 실패', error })
   }
})

// 전체 스터디 그룹 조회
router.get('/', verifyToken, async (req, res) => {
   try {
      const studygroups = await Studygroup.findAll()
      res.json({ success: true, studygroups })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 조회 실패', error })
   }
})

// 특정 스터디 그룹 조회
router.get('/:id', verifyToken, async (req, res) => {
   try {
      const studygroup = await Studygroup.findByPk(req.params.id)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없음' })
      }
      res.json({ success: true, studygroup })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 조회 실패', error })
   }
})

// 스터디 그룹 수정
router.put('/:id', verifyToken, async (req, res) => {
   try {
      const studygroup = await Studygroup.findByPk(req.params.id)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없음' })
      }
      await studygroup.update(req.body)
      res.json({ success: true, message: '스터디 그룹 수정 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 수정 실패', error })
   }
})

// 스터디 그룹 삭제
router.delete('/:id', verifyToken, async (req, res) => {
   try {
      const studygroup = await Studygroup.findByPk(req.params.id)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없음' })
      }
      await studygroup.destroy()
      res.json({ success: true, message: '스터디 그룹 삭제 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 삭제 실패', error })
   }
})

module.exports = router
