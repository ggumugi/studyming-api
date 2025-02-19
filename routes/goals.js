const express = require('express')
const router = express.Router()
const { Goals } = require('../models')

//  [GET] 모든 Goals 가져오기
router.get('/', async (req, res) => {
   try {
      const goals = await Goals.findAll()
      res.json(goals)
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

//  [POST] 새로운 Goal 추가
router.post('/', async (req, res) => {
   try {
      const { monGoal, tueGoal, wedGoal, thuGoal, friGoal, satGoal, sunGoal, objectId } = req.body
      const newGoal = await Goals.create({ monGoal, tueGoal, wedGoal, thuGoal, friGoal, satGoal, sunGoal, objectId })
      res.status(201).json(newGoal)
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

//  [PUT] 특정 Goal 수정
router.put('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const { monGoal, tueGoal, wedGoal, thuGoal, friGoal, satGoal, sunGoal } = req.body

      if (!monGoal && !tueGoal && !wedGoal && !thuGoal && !friGoal && !satGoal && !sunGoal) {
         return res.status(400).json({ message: '수정할 Goal 데이터가 없습니다.' })
      }

      await Goals.update({ monGoal, tueGoal, wedGoal, thuGoal, friGoal, satGoal, sunGoal }, { where: { id } })

      res.json({ message: '수정 완료', updatedGoal: { id, monGoal, tueGoal, wedGoal, thuGoal, friGoal, satGoal, sunGoal } })
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

//  [DELETE] 특정 Goal 삭제
router.delete('/:id', async (req, res) => {
   try {
      const { id } = req.params
      await Goals.destroy({ where: { id } })
      res.json({ message: '삭제 완료' })
   } catch (error) {
      res.status(500).json({ message: '서버 오류', error })
   }
})

module.exports = router
