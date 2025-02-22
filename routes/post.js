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

//게시물 등록
router.post('/', isLoggedIn, upload.array('images', 10), async (req, res) => {
   try {
      const post = await Post.create({
         content: req.body.content,
         title: req.body.title,
         category: req.body.category,
         userId: req.user.id,
      })

      // 이미지 저장 로직
      if (req.files.length > 0) {
         const images = req.files.map((file) => ({
            url: `/uploads/${file.filename}`,
            path: file.path, // ✅ path 필드 추가
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
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 3
      const offset = (page - 1) * limit

      const count = await Post.count()

      const posts = await Post.findAll({
         limit,
         offset,
         order: [['createdAt', 'DESC']], // 최신날짜 순으로 가져온다
         // 게시글을 작성한 사람과 게시글에 작성된 해시태그를 같이 가져온다
         include: [
            {
               model: User,
               attributes: ['id', 'nickname', 'email'],
            },
         ],
      })

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
      res.status(500).json({
         success: false,
         message: '게시물 리스트 불러오기 실패',
         error: error.message,
         stack: error.stack, // 🛑 [3] 에러 상세 정보 추가 출력
      })
   }
})

//게시물 수정
router.put('/:id', isLoggedIn, upload.single('img'), async (req, res) => {
   try {
      //게시물 존재 여부 확인
      // select * from posts where id = ? and UserId = ?
      const post = await Post.findOne({ where: { id: req.params.id, userId: req.user.id } })
      if (!post) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }

      //게시물 수정
      await post.update({
         title: req.body.title, // ✅ 제목도 업데이트 추가
         content: req.body.content,
         img: req.file ? `/${req.file.filename}` : post.img,
      })

      //업데이트 된 게시물 다시 조회
      const updatedPost = await Post.findOne({
         where: { id: req.params.id },
         //users와 hashtags 테이블의 컬럼 값을 포함해서 가져옴
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'], //user테이블의 id, nick 컬럼 값만 가져옴
            } /* 
            {
               model: Hashtag,
               attributes: ['title'], //hashtags 테이블의 title 컬럼 값만 가져옴
            }, */,
         ],
      })

      res.json({
         success: true,
         post: updatedPost,
         message: '게시물이 성공적으로 수정되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물 수정 중 오류가 발생했습니다.', error })
   }
})

//게시물 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      // 삭제할 게시물 존재 여부 확인
      const post = await Post.findOne({ where: { id: req.params.id, userId: req.user.id } })
      if (!post) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }

      // 게시물 삭제
      await post.destroy()

      res.json({
         success: true,
         message: '게시물이 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물 삭제 중 오류가 발생했습니다.', error })
   }
})

//특정 게시물 불러오기(id로 게시물 조회) localhost:8000/post/:id
router.get('/:id', async (req, res) => {
   try {
      const post = await Post.findOne({
         where: { id: req.params.id },
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
            {
               model: Images,
               attributes: ['id', 'path'],
            },
         ],
      })

      if (!post) {
         return res.status(404).json({ success: false, message: '게시물을 찾을 수 없습니다.' })
      }

      res.json({
         success: true,
         post,
         message: '게시물을 성공적으로 불러왔습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '게시물을 불러오는 중 오류가 발생했습니다.', error })
   }
})
module.exports = router
