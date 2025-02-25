//댓글 crud,채택 (지우)

const express = require('express')
const multer = require('multer')
const { Comment, User, Post, Images } = require('../models')
const { isLoggedIn } = require('./middlewares') // ✅ 로그인한 사용자만 댓글 작성 가능
const path = require('path')
const fs = require('fs')

const router = express.Router()

//  업로드 폴더 생성 (없으면 생성)
const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true })
}

// ✅ `multer` 설정 (한 개의 이미지만 업로드 가능)
const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, uploadDir)
      },
      filename(req, file, cb) {
         const ext = path.extname(file.originalname) // 확장자 추출
         const filename = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext
         cb(null, filename)
      },
   }),
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
})

//댓글 작성(정보게시판엔 댓글 불필요)
router.post('/', isLoggedIn, upload.single('img'), async (req, res) => {
   try {
      const { postId } = req.params
      const { content } = req.body
      const imgPath = req.file ? `/uploads/comments/${req.file.filename}` : null

      // ✅ 포스트 존재 여부 확인
      const post = await Post.findByPk(postId)
      if (!post) {
         return res.status(404).json({ success: false, message: '해당 포스트를 찾을 수 없습니다.' })
      }

      // ✅ 공지사항(noti) 카테고리는 댓글 작성 금지
      if (post.category === 'noti') {
         return res.status(403).json({ success: false, message: '공지사항에는 댓글을 작성할 수 없습니다.' })
      }

      // ✅ 댓글 생성
      const newComment = await Comment.create({
         content,
         img: imgPath,
         postId,
         userId: req.user.id,
      })

      res.status(201).json({ success: true, comment: newComment })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글 작성 실패', error })
   }
})
//댓글 전체리스트 가져오기
router.get('/', async (req, res) => {
   try {
      const { postId } = req.params
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 10
      const offset = (page - 1) * limit

      // ✅ 포스트 존재 여부 확인
      const post = await Post.findByPk(postId)
      if (!post) {
         return res.status(404).json({ success: false, message: '해당 포스트를 찾을 수 없습니다.' })
      }

      // ✅ 공지사항(noti) 카테고리는 댓글 조회 금지
      if (post.category === 'noti') {
         return res.status(403).json({ success: false, message: '공지사항에는 댓글이 없습니다.' })
      }

      // ✅ 특정 포스트의 댓글 리스트 가져오기
      const comments = await Comment.findAll({
         where: { postId },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
         include: [{ model: User, attributes: ['id', 'nickname'] }],
      })

      res.status(200).json({ success: true, comments })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글 조회 실패', error })
   }
})
//댓글 수정
router.put('/:id', isLoggedIn, upload.single('img'), async (req, res) => {
   try {
      const { commentId } = req.params
      const { content } = req.body
      const imgPath = req.file ? `/uploads/${req.file.filename}` : null // ✅ 새 이미지 업로드

      const comment = await Comment.findOne({ where: { id: commentId, userId: req.user.id } })
      if (!comment) {
         return res.status(403).json({ success: false, message: '댓글 수정 권한이 없습니다.' })
      }

      // ✅ 댓글 내용 & 이미지 수정
      comment.content = content || comment.content
      if (imgPath) {
         comment.img = imgPath // ✅ 새 이미지가 있으면 변경
      }
      await comment.save()

      res.status(200).json({ success: true, message: '댓글 수정 완료', comment })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글 수정 실패', error })
   }
})

//댓글삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const { commentId } = req.params

      const comment = await Comment.findOne({ where: { id: commentId } })
      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // ✅ 작성자 또는 관리자만 삭제 가능
      if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
         return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' })
      }

      await comment.destroy()

      res.status(200).json({ success: true, message: '댓글 삭제 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글 삭제 실패', error })
   }
})

router.get('/:id', async (req, res) => {
   try {
      const { commentId } = req.params

      // ✅ 특정 댓글 조회 (작성자, 게시글 정보 포함)
      const comment = await Comment.findOne({
         where: { id: commentId },
         include: [
            { model: User, attributes: ['id', 'nickname'] }, // 작성자 정보 포함
            { model: Post, attributes: ['id', 'title', 'category'] }, // 해당 포스트 정보 포함
         ],
      })

      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // ✅ 공지사항(noti) 카테고리의 댓글 조회 차단
      if (comment.Post.category === 'noti') {
         return res.status(403).json({ success: false, message: '공지사항에는 댓글이 없습니다.' })
      }

      res.status(200).json({ success: true, comment })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글 조회 실패', error })
   }
})

module.exports = router
