const cron = require('node-cron')
const { Myitem, User } = require('../models')
const { Sequelize, Op } = require('sequelize')

// ✅ 매일 자정(00:00)에 실행되는 작업
cron.schedule('0 0 * * *', async () => {
   try {
      console.log('🔹 MyItem의 limit 값 감소 및 만료된 아이템 삭제 중...')

      // ✅ `limit` 값이 1 이상인 경우 1 감소 (백틱 사용)
      const updated = await Myitem.update(
         { limit: Sequelize.literal('`limit` - 1') }, // ✅ 백틱(`) 유지
         { where: { limit: { [Op.gt]: 0 } } } // ✅ 0 이하가 아닌 데이터만 감소
      )

      console.log(`✅ 업데이트된 행 수: ${updated[0]}`)

      // ✅ `limit`이 0 이하가 된 아이템 삭제
      const deleted = await Myitem.destroy({ where: { limit: { [Op.lte]: 0 } } })
      console.log(`✅ 삭제된 아이템 수: ${deleted}`)

      // ✅ `unconnected` 값 1 증가
      const updatedUsers = await User.update(
         { unconnected: Sequelize.literal('unconnected + 1') },
         { where: { status: 'ACTIVE' } } // 🚨 `SLEEP`, `BANNED` 상태가 아닌 유저만 증가
      )

      // ✅ `unconnected`가 180 이상인 유저의 상태를 `SLEEP`으로 변경
      const sleepUpdatedUsers = await User.update({ status: 'SLEEP' }, { where: { unconnected: { [Op.gte]: 180 } } })
   } catch (error) {
      console.error('❌  스케줄링 작업 중 오류 발생:', error)
   }
})
