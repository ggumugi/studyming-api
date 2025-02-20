const express = require('express')
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

// 게시글 생성
router.post('/', async (req, res) => {
   try {
      const { category, title, content, userId } = req.body
      const newPost = await Post.create({ category, title, content, userId })
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
