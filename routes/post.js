const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Post } = require('../models') // Sequelize 모델

const router = express.Router()

// 게시글 목록 조회 (카테고리별 필터링 포함)
router.get('/', async (req, res) => {
   try {
      const { category } = req.query
      const whereClause = category ? { category } : {}
      const posts = await Post.findAll({ where: whereClause, order: [['createdAt', 'DESC']], include: [{ model: db.User, attributes: ['nickname'] }] })
      res.json(posts)
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 조회 실패' })
   }
})

// 특정 게시글 조회
router.get('/:id', async (req, res) => {
   try {
      const post = await Post.findByPk(req.params.id)
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없음' })
      res.json(post)
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 조회 실패' })
   }
})

// 📌 `uploads` 폴더가 없으면 생성
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true })
}

// 📌 파일 저장 설정
const upload = multer({
   storage: multer.diskStorage({
      destination: (req, file, cb) => {
         cb(null, uploadDir)
      },
      filename: (req, file, cb) => {
         const ext = path.extname(file.originalname)
         cb(null, path.basename(file.originalname, ext) + '_' + Date.now() + ext)
      },
   }),
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
})

// 게시글 생성
router.post('/', async (req, res) => {
   try {
      const { category, title, content, userId } = req.body
      const newPost = await Post.create({
         category,
         title: req.body.title,
         content: req.body.content,
         userId: req.user.id,
      })
      res.status(201).json(newPost)
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 생성 실패' })
   }
})

// 게시글 수정
router.put('/:id', async (req, res) => {
   try {
      const { title, content } = req.body
      const post = await Post.findByPk(req.params.id)
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없음' })

      post.title = title
      post.content = content
      await post.save()
      res.json(post)
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 수정 실패' })
   }
})

// 게시글 삭제
router.delete('/:id', async (req, res) => {
   try {
      const post = await Post.findByPk(req.params.id)
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없음' })

      await post.destroy()
      res.json({ message: '게시글 삭제 완료' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 삭제 실패' })
   }
})

module.exports = router
