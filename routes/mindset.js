/* 경희 */
const express = require('express')
const router = express.Router()
const { Mindset } = require('../models')

// MindSet 목록 가져오기
router.get('/', async (req, res) => {
   try {
      const minsets = await Mindset.findAll()
      res.json(minsets)
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

// MindSet 추가
router.post('/', async (req, res) => {
   try {
      const { mindset } = req.body
      const newMindset = await Mindset.create({ mindset })
      res.status(201).json(newMindset)
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

// MindSet 수정
router.put('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const { mindset } = req.body

      if (!mindset) {
         return res.status(400).json({ message: 'mindset 값이 없습니다.' })
      }

      await Mindset.update({ mindset }, { where: { id } })

      res.json({ message: '수정 완료', mindset })
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

// MindSet 삭제
router.delete('/:id', async (req, res) => {
   try {
      const { id } = req.params
      await Mindset.destroy({ where: { id } })
      res.json({ message: '삭제 완료' })
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

module.exports = router
