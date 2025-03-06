const express = require('express')
const { Time, Alltime } = require('../models')
const router = express.Router()

// 특정 유저의 오늘, 어제 공부 시간 가져오기
router.get('/time/:userId', async (req, res) => {
   try {
      const { userId } = req.params

      const timeData = await Time.findOne({ where: { userId } })

      if (!timeData) {
         return res.status(404).json({ message: 'Time data not found' })
      }

      res.json(timeData)
   } catch (error) {
      console.error(`❌ [ERROR] 서버 오류`, error)
      res.status(500).json({ message: '서버 오류' })
   }
})

// 특정 유저의 총 공부 시간 가져오기
router.get('/alltime/:userId', async (req, res) => {
   try {
      const { userId } = req.params
      const allTimeData = await Alltime.findOne({ where: { userId } })

      if (!allTimeData) {
         return res.status(404).json({ message: 'Alltime data not found' })
      }

      res.json(allTimeData)
   } catch (error) {
      console.error(error)
      res.status(500).json({ message: '서버 오류' })
   }
})

module.exports = router
