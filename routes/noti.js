const express = require('express')
const router = express.Router()
const { User, Noti } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 내 알림(쪽지) 목록 가져오기
router.get('/', isLoggedIn, async (req, res) => {
   try {
      const userId = req.user.id

      const notifications = await Noti.findAll({
         where: { recieveId: userId },
         include: [
            {
               model: User,
               as: 'Sender', // 별칭 사용
               attributes: ['id', 'nickname'],
            },
         ],
         order: [['id', 'DESC']], // 최신순 정렬
      })

      // 클라이언트에 보내기 쉬운 형태로 가공
      const formattedNotifications = notifications.map((noti) => ({
         id: noti.id,
         message: noti.message,
         isRead: noti.isRead,
         senderId: noti.sendId,
         senderNickname: noti.Sender ? noti.Sender.nickname : '알 수 없음',
      }))

      res.json({ success: true, notifications: formattedNotifications })
   } catch (error) {
      console.error('알림 목록 조회 실패:', error)
      res.status(500).json({ success: false, message: '알림 목록을 가져오는데 실패했습니다.', error: error.message })
   }
})

// 쪽지 보내기
router.post('/', isLoggedIn, async (req, res) => {
   try {
      const { receiverNickname, message } = req.body
      const senderId = req.user.id

      // 받는 사람 찾기
      const receiver = await User.findOne({
         where: { nickname: receiverNickname },
      })

      if (!receiver) {
         return res.status(404).json({ success: false, message: '받는 사람을 찾을 수 없습니다.' })
      }

      // 자기 자신에게 쪽지 보내는 것 방지
      if (receiver.id === senderId) {
         return res.status(400).json({ success: false, message: '자기 자신에게 쪽지를 보낼 수 없습니다.' })
      }

      // 쪽지 생성
      const notification = await Noti.create({
         sendId: senderId,
         recieveId: receiver.id,
         message,
         isRead: false,
      })

      res.status(201).json({ success: true, notification, message: '쪽지가 성공적으로 전송되었습니다.' })
   } catch (error) {
      console.error('쪽지 전송 실패:', error)
      res.status(500).json({ success: false, message: '쪽지 전송에 실패했습니다.', error: error.message })
   }
})

// 쪽지 읽음 표시
router.patch('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params
      const userId = req.user.id

      // 쪽지 찾기
      const notification = await Noti.findOne({
         where: { id, recieveId: userId },
      })

      if (!notification) {
         return res.status(404).json({ success: false, message: '쪽지를 찾을 수 없습니다.' })
      }

      // 이미 읽은 쪽지인 경우
      if (notification.isRead) {
         return res.json({ success: true, message: '이미 읽은 쪽지입니다.' })
      }

      // 읽음 표시 업데이트
      await notification.update({ isRead: true })

      res.json({ success: true, message: '쪽지를 읽음으로 표시했습니다.' })
   } catch (error) {
      console.error('쪽지 읽음 표시 실패:', error)
      res.status(500).json({ success: false, message: '쪽지 읽음 표시에 실패했습니다.', error: error.message })
   }
})

// 읽은 쪽지 모두 삭제
router.delete('/read', isLoggedIn, async (req, res) => {
   try {
      const userId = req.user.id

      // 읽은 쪽지 찾기
      const result = await Noti.destroy({
         where: { recieveId: userId, isRead: true },
      })

      if (result === 0) {
         return res.json({ success: true, message: '삭제할 읽은 쪽지가 없습니다.' })
      }

      res.json({ success: true, message: `${result}개의 읽은 쪽지를 삭제했습니다.` })
   } catch (error) {
      console.error('읽은 쪽지 삭제 실패:', error)
      res.status(500).json({ success: false, message: '읽은 쪽지 삭제에 실패했습니다.', error: error.message })
   }
})

// 특정 쪽지 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params
      const userId = req.user.id

      // 쪽지 찾기
      const notification = await Noti.findOne({
         where: { id, recieveId: userId },
      })

      if (!notification) {
         return res.status(404).json({ success: false, message: '쪽지를 찾을 수 없습니다.' })
      }

      // 쪽지 삭제
      await notification.destroy()

      res.json({ success: true, message: '쪽지가 삭제되었습니다.' })
   } catch (error) {
      console.error('쪽지 삭제 실패:', error)
      res.status(500).json({ success: false, message: '쪽지 삭제에 실패했습니다.', error: error.message })
   }
})

module.exports = router
