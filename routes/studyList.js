// routes/studyListRouter.js
const express = require('express')
const router = express.Router()
const { Studygroup, Hashtag, User, Groupmember } = require('../models')
const { Op } = require('sequelize')
const { isLoggedIn, isAdmin } = require('./middlewares')

/**
 * 모든 스터디 그룹 목록 조회
 * GET /api/studylist
 */
router.get('/', async (req, res) => {
   try {
      const studygroups = await Studygroup.findAll({
         order: [['createdAt', 'DESC']],
      })

      res.json({ success: true, studygroups })
   } catch (error) {
      console.error('스터디 그룹 목록 조회 실패:', error)
      res.status(500).json({ success: false, message: '스터디 그룹 목록 조회 실패', error: error.message })
   }
})

/**
 * 특정 스터디 그룹의 해시태그 조회
 * GET /api/studylist/:studyId/hashtags
 */
router.get('/:studyId/hashtags', async (req, res) => {
   try {
      const { studyId } = req.params

      const studygroup = await Studygroup.findByPk(studyId, {
         include: [
            {
               model: Hashtag,
               as: 'Hashtaged',
               attributes: ['name'],
               through: { attributes: [] },
            },
         ],
      })

      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없습니다.' })
      }

      res.json({ success: true, hashtags: studygroup.Hashtaged || [] })
   } catch (error) {
      console.error('스터디 그룹 해시태그 조회 실패:', error)
      res.status(500).json({ success: false, message: '스터디 그룹 해시태그 조회 실패', error: error.message })
   }
})

/**
 * 스터디 그룹 검색
 * GET /api/studylist/search
 * 쿼리 파라미터: searchType, searchTerm
 */
router.get('/search', async (req, res) => {
   try {
      const { searchType, searchTerm } = req.query

      if (!searchTerm) {
         return res.status(400).json({ success: false, message: '검색어를 입력해주세요.' })
      }

      let studygroups = []

      if (searchType === 'title') {
         // 제목으로 검색
         studygroups = await Studygroup.findAll({
            where: {
               name: {
                  [Op.like]: `%${searchTerm}%`,
               },
            },
            order: [['createdAt', 'DESC']],
         })
      } else if (searchType === 'hashtag') {
         // 해시태그로 검색
         const hashtags = await Hashtag.findAll({
            where: {
               name: {
                  [Op.like]: `%${searchTerm}%`,
               },
            },
            include: [
               {
                  model: Studygroup,
                  as: 'Studygroups',
                  through: { attributes: [] },
               },
            ],
         })

         // 중복 제거를 위한 Set 사용
         const studygroupSet = new Set()

         hashtags.forEach((hashtag) => {
            hashtag.Studygroups.forEach((studygroup) => {
               studygroupSet.add(studygroup)
            })
         })

         studygroups = Array.from(studygroupSet)
      }

      res.json({ success: true, studygroups })
   } catch (error) {
      console.error('스터디 그룹 검색 실패:', error)
      res.status(500).json({ success: false, message: '스터디 그룹 검색 실패', error: error.message })
   }
})

/**
 * 내가 참여한 스터디 그룹 목록 조회
 * GET /api/studylist/my
 * 인증 필요
 */
router.get('/my', isLoggedIn, async (req, res) => {
   try {
      const userId = req.user.id

      // 유저가 참여한 그룹멤버 정보와 해당 스터디그룹 정보를 함께 조회
      const userGroups = await Groupmember.findAll({
         where: { userId },
         include: [
            {
               model: Studygroup,
               attributes: ['id', 'name', 'countMembers', 'maxMembers', 'locked', 'cam', 'sharing'],
            },
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
         ],
      })

      // 스터디 그룹 정보 추출
      const myStudygroups = userGroups.map((member) => ({
         id: member.Studygroup.id,
         name: member.Studygroup.name,
         countMembers: member.Studygroup.countMembers,
         maxMembers: member.Studygroup.maxMembers,
         locked: member.Studygroup.locked,
         cam: member.Studygroup.cam,
         sharing: member.Studygroup.sharing,
         role: member.role,
         status: member.status,
         userId: member.userId,
         userNickname: member.User.nickname,
      }))

      res.json({ success: true, myStudygroups })
   } catch (error) {
      console.error('내 스터디 그룹 목록 조회 실패:', error)
      res.status(500).json({ success: false, message: '내 스터디 그룹 목록 조회 실패', error: error.message })
   }
})

/**
 * 스터디 그룹 삭제 (관리자 전용)
 * DELETE /api/studylist/:studyId
 * 인증 필요, 관리자 권한 필요
 */
router.delete('/:studyId', isLoggedIn, isAdmin, async (req, res) => {
   try {
      const { studyId } = req.params

      const studygroup = await Studygroup.findByPk(studyId)

      if (!studygroup) {
         return res.status(404).json({ success: false, message: '스터디 그룹을 찾을 수 없습니다.' })
      }

      await studygroup.destroy()

      res.json({ success: true, message: '스터디 그룹이 삭제되었습니다.' })
   } catch (error) {
      console.error('스터디 그룹 삭제 실패:', error)
      res.status(500).json({ success: false, message: '스터디 그룹 삭제 실패', error: error.message })
   }
})

module.exports = router
