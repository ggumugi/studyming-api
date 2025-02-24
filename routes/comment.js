//댓글 crud,채택 (지우)

const express = require('express')
//const multer = require('multer')
const { Comment, User, Post, Images } = require('../models')
const { isLoggedIn } = require('./middlewares') // ✅ 로그인한 사용자만 댓글 작성 가능
//const path = require('path')
//const fs = require('fs')

const router = express.Router()

// // uploads 폴더가 없을 경우 새로 생성
// try {
//    fs.readdirSync('uploads') //해당 폴더가 있는지 확인
// } catch (error) {
//    console.log('uploads 폴더가 없어 uploads 폴더를 생성합니다.')
//    fs.mkdirSync('uploads') //폴더 생성
// }

// const upload = multer({
//    storage: multer.diskStorage({
//       destination(req, file, cb) {
//          cb(null, 'uploads/') // ✅ uploads 폴더에 따로저장
//       },
//       filename(req, file, cb) {
//          const decodedFileName = decodeURIComponent(file.originalname) //파일명 디코딩(한글 파일명 깨짐 방지) => 제주도.jpg
//          const ext = path.extname(decodedFileName) //확장자 추출
//          const basename = path.basename(decodedFileName, ext) //확장자 제거한 파일명 추출

//          // 파일명 설정: 기존이름 + 업로드 날짜시간 + 확장자
//          // dog.jpg
//          // ex) dog + 1231342432443 + .jpg
//          cb(null, basename + Date.now() + ext)
//       },
//    }),
//    // 파일의 크기 제한
//    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB로 제한
// })

// ✅ 댓글 작성
router.post('/', isLoggedIn, async (req, res) => {
   try {
      const { postId, content } = req.body

      if (!postId || !content.trim()) {
         return res.status(400).json({ success: false, message: 'postId와 content를 입력하세요.' })
      }

      // ✅ 해당 게시물이 존재하는지 확인
      const postExists = await Post.findByPk(postId)
      if (!postExists) {
         return res.status(404).json({ success: false, message: '해당 게시물을 찾을 수 없습니다.' })
      }

      // ✅ 댓글 저장
      const newComment = await Comment.create({
         postId,
         userId: req.user.id, // 로그인한 사용자 ID
         content,
      })

      res.status(201).json({ success: true, comment: newComment })
   } catch (error) {
      console.error('🚨 댓글 작성 오류:', error)
      res.status(500).json({ success: false, message: '서버 오류 발생', error })
   }
})

// ✅ 특정 게시글의 댓글 목록 조회 (페이징)
router.get('/', async (req, res) => {
   try {
      console.log('🔥 댓글 목록 요청:', req.query)

      const { postId, page = 1, limit = 5 } = req.query

      if (!postId) {
         return res.status(400).json({ success: false, message: 'postId가 필요합니다.' })
      }

      const comments = await Comment.findAll({
         where: { postId },
         limit: parseInt(limit, 10),
         offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
         order: [['createdAt', 'DESC']],
         include: [{ model: User, attributes: ['id', 'nickname'] }],
      })

      res.json({ success: true, comments })
   } catch (error) {
      console.error('🚨 댓글 불러오기 오류:', error)
      res.status(500).json({ success: false, message: '댓글을 불러오지 못했습니다.', error })
   }
})

// ✅ 댓글 수정
router.patch('/:id', isLoggedIn, async (req, res) => {
   try {
      console.log('🔥 댓글 수정 요청:', req.body)

      const { content } = req.body
      const { id } = req.params

      if (!content.trim()) {
         return res.status(400).json({ success: false, message: '수정할 내용을 입력하세요.' })
      }

      // ✅ 해당 댓글이 존재하는지 확인
      const comment = await Comment.findByPk(id)
      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // ✅ 댓글 작성자 또는 관리자만 수정 가능
      if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
         return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' })
      }

      comment.content = content
      await comment.save()

      res.json({ success: true, message: '댓글이 수정되었습니다.', comment })
   } catch (error) {
      console.error('🚨 댓글 수정 오류:', error)
      res.status(500).json({ success: false, message: '댓글 수정 실패' })
   }
})

// ✅ 댓글 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      console.log('🔥 댓글 삭제 요청:', req.params)

      const { id } = req.params

      // ✅ 해당 댓글이 존재하는지 확인
      const comment = await Comment.findByPk(id)
      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // ✅ 댓글 작성자 또는 관리자만 삭제 가능
      if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
         return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' })
      }

      await comment.destroy()

      res.json({ success: true, message: '댓글이 삭제되었습니다.' })
   } catch (error) {
      console.error('🚨 댓글 삭제 오류:', error)
      res.status(500).json({ success: false, message: '댓글 삭제 실패' })
   }
})

module.exports = router
