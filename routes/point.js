const express = require('express')
const router = express.Router()
const { User, Item, Point, Purchase, Pointhistory, Myitem, sequelize } = require('../models')

/**
 * ✅ 1. 포인트 조회 (GET /point)
 * - 사용자의 현재 보유 포인트를 조회
 */
router.get('/', async (req, res) => {
   try {
      const user = await User.findByPk(req.user.id, {
         include: [{ model: Point }],
      })
      if (!user || !user.Point) {
         return res.status(404).json({ success: false, message: '포인트 정보가 없습니다.' })
      }

      res.status(200).json({ success: true, points: user.Point.point })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '포인트 조회 중 오류 발생' })
   }
})

/**
 * ✅ 2. 포인트 변동 내역 조회 (GET /point/history)
 * - 사용자의 포인트 사용 & 충전 내역 조회
 */
router.get('/history', async (req, res) => {
   try {
      const history = await Pointhistory.findAll({
         where: { pointId: req.user.id },
         order: [['createdAt', 'DESC']], // 최신 내역부터 정렬
      })

      res.status(200).json({ success: true, history })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '포인트 내역 조회 중 오류 발생' })
   }
})

/**
 * ✅ 3. 포인트로 상품 구매 (POST /point)
 * - 포인트 차감 후 상품 지급
 */
router.post('/', async (req, res) => {
   const t = await sequelize.transaction()
   try {
      const { itemId } = req.body

      // 유저 & 포인트 정보 조회
      const user = await User.findByPk(req.user.id, {
         include: [{ model: Point }],
         transaction: t,
         lock: t.LOCK.UPDATE, // 동시 수정 방지
      })
      if (!user || !user.Point) throw new Error('회원 또는 포인트 정보가 없습니다.')

      // 구매할 상품 조회
      const item = await Item.findByPk(itemId, { transaction: t })
      if (!item) throw new Error(`상품 ID ${itemId}을 찾을 수 없습니다.`)

      // 보유 포인트 체크
      if (user.Point.point < item.price) throw new Error('포인트가 부족합니다.')

      // 포인트 차감
      user.Point.point -= item.price
      await user.Point.save({ transaction: t })

      // 구매 내역 추가
      await Purchase.create({ pointId: user.Point.id, itemId: item.id, fee: item.price }, { transaction: t })

      // 포인트 사용 내역 기록
      await Pointhistory.create({ pointId: user.Point.id, history: `상품 구매 - ${item.name}`, type: 'use' }, { transaction: t })

      // 구매한 아이템 지급
      await Myitem.create({ userId: user.id, itemId: item.id, limit: item.limit }, { transaction: t })

      await t.commit()
      res.status(201).json({ success: true, message: '상품 구매 완료', remainingPoints: user.Point.point })
   } catch (error) {
      await t.rollback()
      console.error(error)
      res.status(500).json({ success: false, message: '포인트 결제 중 오류 발생', error: error.message })
   }
})

/**
 * ✅ 4. 포인트 충전 (POST /point/charge)
 * - 현금 결제 후 포인트 추가
 */
router.post('/charge', async (req, res) => {
   const t = await sequelize.transaction()
   try {
      const { amount } = req.body

      if (amount <= 0) throw new Error('충전 금액은 0보다 커야 합니다.')

      // 유저 조회
      const user = await User.findByPk(req.user.id, {
         include: [{ model: Point }],
         transaction: t,
         lock: t.LOCK.UPDATE,
      })
      if (!user || !user.Point) throw new Error('포인트 정보를 찾을 수 없습니다.')

      // 포인트 충전
      user.Point.point += amount
      await user.Point.save({ transaction: t })

      // 포인트 충전 내역 추가
      await Pointhistory.create({ pointId: user.Point.id, history: `포인트 충전 +${amount}`, type: 'charge' }, { transaction: t })

      await t.commit()
      res.status(201).json({ success: true, message: '포인트 충전 완료', newPoints: user.Point.point })
   } catch (error) {
      await t.rollback()
      console.error(error)
      res.status(500).json({ success: false, message: '포인트 충전 중 오류 발생', error: error.message })
   }
})

/**
 * ✅ 5. 포인트 선물하기 (POST /point/send)
 * - 유저 간 포인트 전송
 */
router.post('/send', async (req, res) => {
   const t = await sequelize.transaction()
   try {
      const { receiverId, amount } = req.body

      if (amount <= 0) throw new Error('선물할 포인트는 0보다 커야 합니다.')

      // 보낸 사람 조회
      const sender = await User.findByPk(req.user.id, {
         include: [{ model: Point }],
         transaction: t,
         lock: t.LOCK.UPDATE,
      })
      if (!sender || !sender.Point) throw new Error('보낸 사람의 포인트 정보가 없습니다.')
      if (sender.Point.point < amount) throw new Error('포인트가 부족합니다.')

      // 받는 사람 조회
      const receiver = await User.findByPk(receiverId, {
         include: [{ model: Point }],
         transaction: t,
         lock: t.LOCK.UPDATE,
      })
      if (!receiver || !receiver.Point) throw new Error('받는 사람의 포인트 정보가 없습니다.')

      // 포인트 차감 & 추가
      sender.Point.point -= amount
      receiver.Point.point += amount

      await sender.Point.save({ transaction: t })
      await receiver.Point.save({ transaction: t })

      // 포인트 내역 기록
      await Pointhistory.create({ pointId: sender.Point.id, history: `포인트 선물 - ${receiver.nickname}에게 ${amount}밍`, type: 'use' }, { transaction: t })
      await Pointhistory.create({ pointId: receiver.Point.id, history: `포인트 선물 받음 - ${sender.nickname}로부터 ${amount}밍`, type: 'stack' }, { transaction: t })

      await t.commit()
      res.status(201).json({ success: true, message: '포인트 선물 완료', remainingPoints: sender.Point.point })
   } catch (error) {
      await t.rollback()
      console.error(error)
      res.status(500).json({ success: false, message: '포인트 선물 중 오류 발생', error: error.message })
   }
})

module.exports = router
