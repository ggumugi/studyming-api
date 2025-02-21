const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Post, Images, User } = require('../models')
const { isLoggedIn } = require('./middlewares')

const router = express.Router()

// uploads 폴더가 없을 경우 새로 생성
try {
   fs.readdirSync('uploads') //해당 폴더가 있는지 확인
} catch (error) {
   console.log('uploads 폴더가 없어 uploads 폴더를 생성합니다.')
   fs.mkdirSync('uploads') //폴더 생성
}

// 이미지 업로드를 위한 multer 설정
const upload = multer({
   // 저장할 위치와 파일명 지정
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/') // uploads폴더에 저장
      },
      filename(req, file, cb) {
         const decodedFileName = decodeURIComponent(file.originalname) //파일명 디코딩(한글 파일명 깨짐 방지) => 제주도.jpg
         const ext = path.extname(decodedFileName) //확장자 추출
         const basename = path.basename(decodedFileName, ext) //확장자 제거한 파일명 추출

         // 파일명 설정: 기존이름 + 업로드 날짜시간 + 확장자
         // dog.jpg
         // ex) dog + 1231342432443 + .jpg
         cb(null, basename + Date.now() + ext)
      },
   }),
   // 파일의 크기 제한
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB로 제한
})

router.post('/', isLoggedIn, upload.array('images', 10), async (req, res) => {
   try {
      console.log('파일정보:', req.files) // req.file → req.files로 변경

      // 파일 체크 로직 수정
      /*       if (!req.files || req.files.length === 0) {
         return res.status(400).json({
            success: false,
            message: '파일을 업로드해주세요.',
         })
      } */

      const post = await Post.create({
         content: req.body.content,
         title: req.body.title,
         category: req.body.category,
         userId: req.user.id,
         // userId: 1,
      })

      // 이미지 저장 로직
      if (req.files.length > 0) {
         const images = req.files.map((file) => ({
            url: `/uploads/${file.filename}`,
            postId: post.id,
         }))
         await Images.bulkCreate(images)
      }

      // 응답 반환 (return 추가)
      return res.status(201).json({
         success: true,
         post: {
            ...post.get({ plain: true }),
            images: req.files.map((f) => `/uploads/${f.filename}`),
         },
      })
   } catch (error) {
      console.error('게시글 생성 오류:', error)
      return res.status(500).json({
         // return 추가
         success: false,
         error: error.message,
      })
   }
})

//전체 게시물 가져오기
router.get('/', async (req, res) => {
   console.log('🔥 API 요청 받음:', req.query)
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 3
      const offset = (page - 1) * limit
      console.log('📢 처리할 페이지네이션 값:', { page, limit, offset })

      const count = await Post.count()
      console.log('✅ 게시물 총 개수:', count)

      const posts = await Post.findAll({
         limit,
         offset,
         order: [['createdAt', 'DESC']],
         include: [{ model: User, attributes: ['id', 'nickname', 'email'] }],
      })

      console.log('✅ 반환할 게시물:', posts)

      res.json({
         success: true,
         posts: posts || [],
         pagination: {
            totalPosts: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            limit,
         },
      })
   } catch (error) {
      console.error('❌ 게시물 리스트 불러오기 실패:', error)
      res.status(500).json({ success: false, message: '게시물 리스트 불러오기 실패', error: error.message })
   }
})

module.exports = router
