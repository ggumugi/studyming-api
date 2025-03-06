const cron = require('node-cron')
const { Myitem, User, Time, Alltime, Grouptime } = require('../models')
const { Sequelize, Op } = require('sequelize')

// ✅ 매일 자정(00:00)에 실행되는 작업
cron.schedule('0 0 * * *', async () => {
   try {
      // ✅ `limit` 값이 1 이상인 경우 1 감소 (백틱 사용)
      const updated = await Myitem.update(
         { limit: Sequelize.literal('`limit` - 1') }, // ✅ 백틱(`) 유지
         { where: { limit: { [Op.gt]: 0 } } } // ✅ 0 이하가 아닌 데이터만 감소
      )

      // ✅ `limit`이 0 이하가 된 아이템 삭제
      const deleted = await Myitem.destroy({ where: { limit: { [Op.lte]: 0 } } })

      // ✅ `unconnected` 값 1 증가
      const updatedUsers = await User.update(
         { unconnected: Sequelize.literal('unconnected + 1') },
         { where: { status: 'ACTIVE' } } // 🚨 `SLEEP`, `BANNED` 상태가 아닌 유저만 증가
      )

      // ✅ `unconnected`가 180 이상인 유저의 상태를 `SLEEP`으로 변경
      const sleepUpdatedUsers = await User.update({ status: 'SLEEP' }, { where: { unconnected: { [Op.gte]: 180 } } })

      // ✅ Time 테이블 업데이트 및 Alltime 누적 처리

      // 1단계: 각 사용자의 time 값을 allTime에 누적

      // 모든 Time 레코드 가져오기
      const timeRecords = await Time.findAll({
         attributes: ['userId', 'time'],
      })

      // 각 사용자별로 allTime 업데이트
      for (const record of timeRecords) {
         if (record.userId && record.time) {
            // 해당 사용자의 Alltime 레코드 찾기 또는 생성
            let alltimeRecord = await Alltime.findOne({
               where: { userId: record.userId },
            })

            if (!alltimeRecord) {
               // 레코드가 없으면 생성
               alltimeRecord = await Alltime.create({
                  userId: record.userId,
                  allTime: '00:00:00',
               })
            }

            // time 값을 allTime에 더하기 (TIME 타입 연산)
            await Alltime.update(
               {
                  allTime: Sequelize.literal(`ADDTIME(allTime, '${record.time}')`),
               },
               {
                  where: { userId: record.userId },
               }
            )
         }
      }

      // 2단계: time 값을 YTime으로 복사
      const updatedYTime = await Time.update(
         { YTime: Sequelize.col('time') },
         { where: {} } // 모든 레코드 업데이트
      )

      // 3단계: time 값을 초기화
      const updatedTime = await Time.update(
         { time: '00:00:00' },
         { where: {} } // 모든 레코드 업데이트
      )

      const updatedGrouptime = await Grouptime.update({ time: '00:00:00' }, { where: {} })
   } catch (error) {
      console.error('❌ 스케줄링 작업 중 오류 발생:', error)
   }
})
