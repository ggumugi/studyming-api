//관리자 게시판 라우터

const express = require('express')
const { Post, User, Images } = require('../models') // Diary 모델 임포트
const { isLoggedIn, isAdmin } = require('./middleware') // 로그인 여부 미들웨어
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

// ✅ 업로드 폴더 생성 (없으면 생성)
const uploadDir = 'uploads/'
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true })
}

// ✅ Multer 이미지 업로드 설정
const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, uploadDir)
      },
      filename(req, file, cb) {
         const ext = path.extname(file.originalname)
         const filename = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + ext
         cb(null, filename)
      },
   }),
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
})

/**
 * ✅ 1. 관리자 게시글 생성 (여러 개 이미지 업로드 가능)
 */
router.post('/', isLoggedIn, isAdmin, upload.array('images', 10), async (req, res) => {
   try {
      const { title, content } = req.body
      const imageFiles = req.files.map((file) => file.filename) // 업로드된 파일명 배열로 저장

      // 게시글 생성
      const newPost = await Post.create({
         category: 'noti',
         title,
         content,
         userId: req.user.id,
      })

      // 이미지 저장 (팀원 코드 스타일에 맞춰 `await` 사용)
      for (const filename of imageFiles) {
         await Images.create({ postId: newPost.id, url: filename })
      }

      res.status(201).json({
         success: true,
         message: '게시글이 작성되었습니다.',
         data: newPost,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 작성에 실패했습니다.' })
   }
})

/**
 * ✅ 2. 관리자 게시글 수정 (여러 개 이미지 포함)
 */
router.put('/:id', isLoggedIn, isAdmin, upload.array('images', 10), async (req, res) => {
   try {
      const { title, content, imagesToKeep } = req.body
      const newImages = req.files.map((file) => file.filename) // 새로 업로드된 이미지
      const { id } = req.params

      const post = await Post.findByPk(id, { include: [Images] })
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' })

      // 1️⃣ 기존 이미지 중 유지할 이미지만 남기기
      for (const img of post.Images) {
         if (!imagesToKeep.includes(img.url)) {
            await img.destroy()
         }
      }

      // 2️⃣ 새 이미지 추가
      for (const filename of newImages) {
         await Images.create({ postId: post.id, url: filename })
      }

      // 3️⃣ 게시글 업데이트
      await post.update({
         title: title || post.title,
         content: content || post.content,
      })

      res.status(200).json({
         success: true,
         message: '게시글이 수정되었습니다.',
         data: post,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 수정에 실패했습니다.' })
   }
})

/**
 * ✅ 3. 관리자 게시글 삭제
 */
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
   try {
      const { id } = req.params

      const post = await Post.findByPk(id, { include: [Images] })
      if (!post) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' })

      // 게시글 삭제 전에 이미지 삭제
      for (const img of post.Images) {
         await img.destroy()
      }

      await post.destroy()

      res.status(200).json({ message: '게시글이 삭제되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글 삭제에 실패했습니다.' })
   }
})

/**
 * ✅ 4. 관리자 게시글 조회 (이미지 포함)
 */
router.get('/', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = 5
      const offset = (page - 1) * limit

      const posts = await Post.findAll({
         where: { category: 'noti' },
         limit,
         offset,
         order: [['createdAt', 'DESC']],
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
            {
               model: Images,
               attributes: ['url'],
            },
         ],
      })

      // 이미지 URL 추가
      const postsWithImages = posts.map((post) => ({
         ...post.toJSON(),
         images: post.Images.map((img) => `/uploads/${img.url}`),
      }))

      res.status(200).json({
         success: true,
         message: '게시글을 성공적으로 불러왔습니다.',
         data: postsWithImages,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ error: '게시글을 불러오는 중 오류가 발생했습니다.' })
   }
})

module.exports = router
