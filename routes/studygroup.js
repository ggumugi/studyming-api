// studygroup.js (백엔드 라우터)
const express = require('express')
const { Studygroup, Groupmember, Grouptime, Hashtag, Liked, User } = require('../models')
const router = express.Router()

// 스터디 그룹 생성
router.post('/', async (req, res) => {
   try {
      // 스터디 그룹 생성
      const studygroup = await Studygroup.create(req.body)

      // Grouptime 생성 (스터디 그룹 ID 참조)
      await Grouptime.create({
         time: '00:00:00', // 기본값 설정
         groupId: studygroup.id, // 스터디 그룹 ID 참조
      })

      // Liked 생성 (스터디 그룹 ID 참조)
      await Liked.create({
         liked: 0, // 기본값 설정
         groupId: studygroup.id, // 스터디 그룹 ID 참조
      })

      // Groupmember 생성 (스터디 그룹 ID 및 생성자 ID 참조)
      await Groupmember.create({
         role: 'leader', // 생성자는 리더로 설정
         groupId: studygroup.id, // 스터디 그룹 ID 참조
         userId: studygroup.createdBy, // 생성자 ID 참조
      })

      // 해시태그 처리
      const hashtags = req.body.hashtags || [] // 해시태그 리스트 가져오기
      if (hashtags.length > 0) {
         for (const tag of hashtags) {
            // 해시태그가 이미 존재하는지 확인
            const [hashtag, created] = await Hashtag.findOrCreate({
               where: { name: tag }, // name 컬럼에서 해당 단어 검색
               defaults: { name: tag }, // 없으면 생성
            })

            // Grouptag 테이블에 연결
            await studygroup.addHashtaged(hashtag)
         }
      }

      res.status(201).json({ success: true, studygroup })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 생성 실패', error })
   }
})

// 전체 스터디 그룹 조회
router.get('/', async (req, res) => {
   try {
      const studygroups = await Studygroup.findAll()
      res.json({ success: true, studygroups })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 조회 실패', error })
   }
})

// 특정 스터디 그룹 조회
router.get('/:id', async (req, res) => {
   try {
      const studygroup = await Studygroup.findByPk(req.params.id, {
         include: [
            {
               model: Hashtag, // Hashtag 모델 조인
               as: 'Hashtaged', // Studygroup 모델에서 정의한 alias
               attributes: ['name'], // 해시태그 이름만 가져오기
               through: { attributes: [] }, // Grouptag 테이블은 포함하지 않음
            },
         ],
      })

      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없음' })
      }

      res.json({ success: true, studygroup })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 조회 실패', error })
   }
})

// 스터디 그룹 수정
router.put('/:id', async (req, res) => {
   try {
      const studygroup = await Studygroup.findByPk(req.params.id)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없음' })
      }
      await studygroup.update(req.body)
      res.json({ success: true, message: '스터디 그룹 수정 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 수정 실패', error })
   }
})

// 스터디 그룹 삭제
router.delete('/:id', async (req, res) => {
   try {
      const studygroup = await Studygroup.findByPk(req.params.id)
      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없음' })
      }
      await studygroup.destroy()
      res.json({ success: true, message: '스터디 그룹 삭제 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스터디 그룹 삭제 실패', error })
   }
})

module.exports = router
