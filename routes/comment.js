//댓글 crud,채택 (지우)
const multer = require('multer')
const express = require('express')
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
router.post('/:postId', isLoggedIn, upload.single('image'), async (req, res) => {
   try {
      console.log('📢 요청이 multer로 오기 전 req.headers:', req.headers)
      console.log('📢 요청이 multer로 오기 전 req.body:', req.body)
      const { postId } = req.params
      console.log('📌 postId:', postId) // 🔥 확인용 로그
      const { content } = req.body
      const imgPath = req.file ? `/uploads/${req.file.filename}` : null

      console.log('📢 요청된 postId:', req.params.postId)
      console.log('📢 요청된 body:', req.body) // ✅ content 값 확인
      console.log('📢 요청된 파일:', req.file) // ✅ 이미지 파일 확인

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
router.get('/:postId', async (req, res) => {
   try {
      const { postId } = req.params
      console.log('📢 fetchComments 요청 시작! req.params:', req.params) // ✅ postId 확인

      console.log('📢 최종 postId 값:', postId)
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

      console.log('📢 조회된 댓글 목록:', comments) // ✅ 이거 확인!

      res.status(200).json({ success: true, comments })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글 조회 실패', error })
   }
})

// 댓글 수정 (자신만 가능)
router.put('/:id', isLoggedIn, upload.single('image'), async (req, res) => {
   try {
      const { id } = req.params // ✅ commentId → id 변경
      const { content } = req.body
      const imgPath = req.file ? `/uploads/${req.file.filename}` : null // ✅ 새 이미지 업로드

      console.log('✏️ 댓글 수정 요청:', { id, userId: req.user.id, content, imgPath })

      // 댓글 조회
      const comment = await Comment.findOne({ where: { id } })

      // ❌ 댓글이 존재하지 않음
      if (!comment) {
         return res.status(404).json({ success: false, message: '수정할 댓글을 찾을 수 없습니다.' })
      }

      // ❌ 작성자만 수정 가능
      if (comment.userId !== req.user.id) {
         return res.status(403).json({ success: false, message: '댓글 수정 권한이 없습니다.' })
      }

      // ✅ 댓글 내용 & 이미지 수정
      comment.content = content || comment.content
      if (imgPath) {
         comment.img = imgPath // ✅ 새 이미지가 있으면 변경
      }
      await comment.save()

      console.log('✅ 댓글 수정 완료:', id)
      res.status(200).json({ success: true, message: '댓글 수정 완료', comment })
   } catch (error) {
      console.error('❌ 댓글 수정 중 오류 발생:', error)
      res.status(500).json({ success: false, message: '댓글 수정 실패', error: error.message })
   }
})

// 댓글 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params
      console.log('서버에서 삭제 요청 받은 ID:', id) // ✅ 백엔드에서 로그 확인

      const comment = await Comment.findOne({ where: { id } })
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

router.patch('/:id/select', isLoggedIn, async (req, res) => {
   try {
      const { commentId } = req.params

      // ✅ 댓글 찾기
      const comment = await Comment.findByPk(commentId)
      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // ✅ 기존에 채택된 댓글이 있는지 확인 (같은 게시글에서)
      const existingSelected = await Comment.findOne({
         where: { postId: comment.postId, selected: true }, // ✅ `isSelected` → `selected`
      })

      if (existingSelected) {
         return res.status(400).json({ success: false, message: '이미 채택된 댓글이 있습니다.' })
      }

      // ✅ 댓글 채택 (selected 변경)
      comment.selected = true // ✅ `isSelected` → `selected`
      await comment.save()

      res.status(200).json({ success: true, message: '댓글이 채택되었습니다.', comment })
   } catch (error) {
      console.error('❌ 댓글 채택 실패:', error)
      res.status(500).json({ success: false, message: '댓글 채택 중 오류 발생', error })
   }
})

module.exports = router
