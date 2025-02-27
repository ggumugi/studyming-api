const express = require('express')
const router = express.Router()
const { Groupmember, Channel } = require('../models')

// 화면 공유 상태 업데이트
router.put('/status/:groupId/:userId', async (req, res) => {
   try {
      const { groupId, userId } = req.params
      const { shareState } = req.body

      // 그룹 멤버 찾기
      const member = await Groupmember.findOne({
         where: { groupId, userId },
      })

      if (!member) {
         return res.status(404).json({ success: false, message: '그룹 멤버를 찾을 수 없습니다.' })
      }

      // 화면 공유 상태 업데이트
      await member.update({ shareState })

      res.json({ success: true, message: '화면 공유 상태가 업데이트되었습니다.', member })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '화면 공유 상태 업데이트 실패', error })
   }
})

// 채널 정보 가져오기
router.get('/channel/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params

      // 채널 정보 찾기
      const channel = await Channel.findOne({
         where: { groupId },
      })

      if (!channel) {
         return res.status(404).json({ success: false, message: '채널 정보를 찾을 수 없습니다.' })
      }

      res.json({ success: true, channel })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '채널 정보 조회 실패', error })
   }
})

// 채널 정보 업데이트
router.put('/channel/:groupId', async (req, res) => {
   try {
      const { groupId } = req.params
      const { sharedChannel } = req.body

      // 채널 정보 찾기
      let channel = await Channel.findOne({
         where: { groupId },
      })

      if (!channel) {
         // 채널 정보가 없으면 생성
         channel = await Channel.create({
            groupId,
            sharedChannel,
            camChannel: null,
            voiceChannel: null,
         })
      } else {
         // 채널 정보 업데이트
         await channel.update({ sharedChannel })
      }

      res.json({ success: true, message: '채널 정보가 업데이트되었습니다.', channel })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '채널 정보 업데이트 실패', error })
   }
})

module.exports = router
