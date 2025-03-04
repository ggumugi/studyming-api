const express = require('express')
const router = express.Router()
const { Grouptime, Studygroup, Groupmember, Time, sequelize } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 사용자의 총 학습 시간 조회 API - 더 구체적인 경로를 먼저 등록
router.get('/total-time', isLoggedIn, async (req, res) => {
   try {
      const userId = req.user.id

      // 사용자의 time 테이블 레코드 조회
      const timeRecord = await Time.findOne({
         where: { userId },
      })

      // 레코드가 없으면 기본값 반환
      if (!timeRecord) {
         return res.json({
            success: true,
            totalTime: '00:00:00',
         })
      }

      res.json({
         success: true,
         totalTime: timeRecord.time,
      })
   } catch (error) {
      console.error('총 학습 시간 조회 실패:', error)
      res.status(500).json({
         success: false,
         message: '총 학습 시간 조회 중 오류 발생',
         error,
      })
   }
})

// 특정 유저와 그룹의 타이머 정보 조회 - 일반적인 경로는 나중에 등록
router.get('/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id

      const grouptimeData = await Grouptime.findOne({
         where: { groupId, userId },
      })

      if (!grouptimeData) {
         // 타이머 정보가 없으면 새로 생성
         const newGrouptime = await Grouptime.create({
            time: '00:00:00',
            groupId,
            userId,
         })
         return res.status(201).json({ success: true, grouptime: newGrouptime })
      }

      res.json({ success: true, grouptime: grouptimeData })
   } catch (error) {
      console.error('타이머 정보 조회 실패:', error)
      res.status(500).json({ success: false, message: '타이머 정보 조회 실패', error })
   }
})

// 타이머 정보 업데이트
router.put('/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id
      const { time } = req.body

      console.log(`타이머 정보 업데이트 요청: 그룹 ID ${groupId}, 사용자 ID ${userId}, 시간 ${time}`)

      // 트랜잭션 시작
      const result = await sequelize.transaction(async (t) => {
         // 1. grouptime 테이블 업데이트
         const [updated, grouptimeData] = await Grouptime.update(
            { time },
            {
               where: { groupId, userId },
               returning: true,
               transaction: t,
            }
         )

         let newGrouptime = null
         if (updated === 0) {
            // 업데이트할 데이터가 없으면 새로 생성
            console.log(`타이머 정보 없음, 새로 생성: 그룹 ID ${groupId}, 사용자 ID ${userId}`)
            newGrouptime = await Grouptime.create({ time, groupId, userId }, { transaction: t })
         }

         // 2. 데이터베이스 레벨에서 총 시간 계산
         const [totalTimeResult] = await sequelize.query(
            `
          SELECT 
            CONCAT(
              LPAD(FLOOR(SUM(
                SUBSTRING_INDEX(time, ':', 1) * 3600 + 
                SUBSTRING_INDEX(SUBSTRING_INDEX(time, ':', 2), ':', -1) * 60 + 
                SUBSTRING_INDEX(time, ':', -1)
              ) / 3600), 2, '0'),
              ':',
              LPAD(FLOOR(MOD(SUM(
                SUBSTRING_INDEX(time, ':', 1) * 3600 + 
                SUBSTRING_INDEX(SUBSTRING_INDEX(time, ':', 2), ':', -1) * 60 + 
                SUBSTRING_INDEX(time, ':', -1)
              ), 3600) / 60), 2, '0'),
              ':',
              LPAD(FLOOR(MOD(SUM(
                SUBSTRING_INDEX(time, ':', 1) * 3600 + 
                SUBSTRING_INDEX(SUBSTRING_INDEX(time, ':', 2), ':', -1) * 60 + 
                SUBSTRING_INDEX(time, ':', -1)
              ), 60)), 2, '0')
            ) AS total_time
          FROM Grouptimes 
          WHERE userId = :userId
        `,
            {
               replacements: { userId },
               type: sequelize.QueryTypes.SELECT,
               transaction: t,
            }
         )

         const totalTime = totalTimeResult.total_time || '00:00:00'
         console.log(`사용자 ID ${userId}의 총 학습 시간: ${totalTime}`)

         // 3. time 테이블 업데이트
         const [timeRecord, created] = await Time.findOrCreate({
            where: { userId },
            defaults: { time: totalTime },
            transaction: t,
         })

         if (!created) {
            await timeRecord.update({ time: totalTime }, { transaction: t })
         }

         return {
            success: true,
            message: updated > 0 ? '타이머 정보 업데이트 성공' : '타이머 정보 생성 성공',
            grouptime: updated > 0 ? grouptimeData[0] : newGrouptime,
            totalTime,
         }
      })

      res.status(result.grouptime.id ? 200 : 201).json(result)
   } catch (error) {
      console.error('타이머 정보 업데이트 실패:', error)
      res.status(500).json({ success: false, message: '타이머 정보 업데이트 실패', error })
   }
})

// 캡차 실패 시 스터디 그룹 참여 상태 변경
router.patch('/captcha-fail/:groupId', isLoggedIn, async (req, res) => {
   try {
      const { groupId } = req.params
      const userId = req.user.id

      console.log(`캡차 실패 처리: 그룹 ID ${groupId}, 사용자 ID ${userId}`)

      // 그룹 멤버 상태 변경
      await Groupmember.update({ status: 'off' }, { where: { groupId, userId } })

      // 이 시점에서도 총 학습 시간 업데이트 (시간 저장은 클라이언트에서 먼저 호출됨)
      try {
         const [totalTimeResult] = await sequelize.query(
            `
          SELECT 
            CONCAT(
              LPAD(FLOOR(SUM(
                SUBSTRING_INDEX(time, ':', 1) * 3600 + 
                SUBSTRING_INDEX(SUBSTRING_INDEX(time, ':', 2), ':', -1) * 60 + 
                SUBSTRING_INDEX(time, ':', -1)
              ) / 3600), 2, '0'),
              ':',
              LPAD(FLOOR(MOD(SUM(
                SUBSTRING_INDEX(time, ':', 1) * 3600 + 
                SUBSTRING_INDEX(SUBSTRING_INDEX(time, ':', 2), ':', -1) * 60 + 
                SUBSTRING_INDEX(time, ':', -1)
              ), 3600) / 60), 2, '0'),
              ':',
              LPAD(FLOOR(MOD(SUM(
                SUBSTRING_INDEX(time, ':', 1) * 3600 + 
                SUBSTRING_INDEX(SUBSTRING_INDEX(time, ':', 2), ':', -1) * 60 + 
                SUBSTRING_INDEX(time, ':', -1)
              ), 60)), 2, '0')
            ) AS total_time
          FROM Grouptimes 
          WHERE userId = :userId
        `,
            {
               replacements: { userId },
               type: sequelize.QueryTypes.SELECT,
            }
         )

         const totalTime = totalTimeResult.total_time || '00:00:00'

         const [timeRecord, created] = await Time.findOrCreate({
            where: { userId },
            defaults: { time: totalTime },
         })

         if (!created) {
            await timeRecord.update({ time: totalTime })
         }
      } catch (timeError) {
         console.error('캡차 실패 처리 중 총 시간 업데이트 오류:', timeError)
         // 주 기능에 영향을 주지 않도록 에러를 던지지 않음
      }

      res.json({
         success: true,
         message: '캡차 실패로 스터디 참여 상태가 변경되었습니다.',
      })
   } catch (error) {
      console.error('캡차 실패 처리 오류:', error)
      res.status(500).json({ success: false, message: '캡차 실패 처리 중 오류 발생', error })
   }
})

// 사용자의 총 학습 시간 조회 API 추가
router.get('/total-time', isLoggedIn, async (req, res) => {
   try {
      const userId = req.user.id

      // 사용자의 time 테이블 레코드 조회
      const timeRecord = await Time.findOne({
         where: { userId },
      })

      // 레코드가 없으면 기본값 반환
      if (!timeRecord) {
         return res.json({
            success: true,
            totalTime: '00:00:00',
         })
      }

      res.json({
         success: true,
         totalTime: timeRecord.time,
      })
   } catch (error) {
      console.error('총 학습 시간 조회 실패:', error)
      res.status(500).json({
         success: false,
         message: '총 학습 시간 조회 중 오류 발생',
         error,
      })
   }
})

module.exports = router
