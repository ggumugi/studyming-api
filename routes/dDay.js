/* 경희 */
const express = require('express')
const router = express.Router()
const { DDay } = require('../models')

// D-Day 목록 가져오기
router.get('/', async (req, res) => {
   try {
      const ddays = await DDay.findAll()
      res.json(ddays)
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

// D-Day 추가
router.post('/', async (req, res) => {
   try {
      const { dName, dDay } = req.body
      const newDday = await DDay.create({ dName, dDay })
      res.status(201).json(newDday)
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

// D-Day 수정
router.put('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const { dName, dDay } = req.body

      if (!dName || !dDay) {
         return res.status(400).json({ message: 'dName 또는 dDay 값이 없습니다.' })
      }

      await DDay.update({ dName, dDay }, { where: { id } })

      res.json({ message: '수정 완료', dName, dDay })
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

// D-Day 삭제
router.delete('/:id', async (req, res) => {
   try {
      const { id } = req.params
      await DDay.destroy({ where: { id } })
      res.json({ message: '삭제 완료' })
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

module.exports = router
