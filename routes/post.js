const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Op } = require('sequelize') // Sequelize 연산자 추가

const { Post, Images, User, Comment } = require('../models')
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
   fileFilter: (req, file, cb) => {
      cb(null, true)
   },
})

//게시물 등록
router.post('/', isLoggedIn, upload.array('images', 10), async (req, res) => {
   try {
      console.log('📌 req.body:', req.body)
      console.log('📌 req.user:', req.user)

      // 🔥 category 기본값 추가 (없을 경우 'free'로 설정)
      const { title, content, category = 'free' } = req.body

      if (!title || !content) {
         return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' })
      }

      const post = await Post.create({
         title,
         content,
         category, // ✅ undefined 방지
         userId: req.user.id,
      })

      // ✅ 기존 이미지 저장 로직 유지
      if (req.files.length > 0) {
         const images = req.files.map((file) => ({
            url: `/uploads/${file.filename}`,
            path: file.path, // ✅ path 필드 추가
            postId: post.id,
         }))
         await Images.bulkCreate(images)
      }

      // ✅ 응답 반환 (return 추가)
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
         success: false,
         error: error.message,
      })
   }
})

//전체 게시물 가져오기
// router.get('/', async (req, res) => {
//    try {
//       const page = parseInt(req.query.page, 10) || 1
//       const limit = parseInt(req.query.limit, 10) || 3
//       const offset = (page - 1) * limit

//       const category = req.query.category // ✅ 쿼리에서 category 가져오기
//       const whereCondition = category ? { category } : {} // ✅ category가 있으면 필터 적용
//       const count = await Post.count({ where: whereCondition }) // ✅ 필터 적용된 게시글 개수 계산

//       const posts = await Post.findAll({
//          where: whereCondition, // ✅ category 필터 적용
//          limit,
//          offset,
//          order: [['createdAt', 'DESC']], // 최신 날짜 순으로 가져오기
//          include: [
//             {
//                model: User,
//                attributes: ['id', 'nickname', 'email'],
//             },
//          ],
//       })

//       res.json({
//          success: true,
//          posts: posts || [],
//          pagination: {
//             totalPosts: count,
//             currentPage: page,
//             totalPages: Math.ceil(count / limit),
//             limit,
//          },
//       })
//    } catch (error) {
//       console.error('❌ 게시물 리스트 불러오기 실패:', error)
//       res.status(500).json({
//          success: false,
//          message: '게시물 리스트 불러오기 실패',
//          error: error.message,
//          stack: error.stack, // 🛑 [3] 에러 상세 정보 추가 출력
//       })
//    }
// })

// const { Op } = require('sequelize') // Sequelize 연산자 추가

router.get('/', async (req, res) => {
   try {
      const { page = 1, category, searchType, searchKeyword, limit = 10 } = req.query

      const offset = (page - 1) * limit
      const whereCondition = {}

      // 카테고리 필터
      if (category) whereCondition.category = category

      // 검색 조건 (수정된 부분)
      if (searchKeyword && searchType) {
         if (searchType === 'title') {
            whereCondition.title = { [Op.like]: `%${searchKeyword}%` }
         } else if (searchType === 'author') {
            // User 모델의 nickname으로 검색 (Include where 절 사용)
            whereCondition['$User.nickname$'] = { [Op.like]: `%${searchKeyword}%` }
         }
      }

      // 총 게시물 수 계산
      const count = await Post.count({
         where: whereCondition,
         include:
            searchType === 'author'
               ? [
                    {
                       model: User,
                       where: { nickname: { [Op.like]: `%${searchKeyword}%` } },
                    },
                 ]
               : [],
      })

      // 게시물 조회
      const posts = await Post.findAll({
         where: whereCondition,
         limit: parseInt(limit),
         offset,
         order: [['createdAt', 'DESC']],
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
               ...(searchType === 'author' && {
                  where: { nickname: { [Op.like]: `%${searchKeyword}%` } },
               }),
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
      console.error('❌ 게시물 조회 실패:', error)
      res.status(500).json({ success: false, error: error.message })
   }
})

//게시물 수정
// ✅ 게시글 수정 API (제목, 내용, 이미지 포함)
// ✅ 게시글 수정 API (제목, 내용, 카테고리, 이미지 포함)
router.put('/:id', upload.array('images', 10), async (req, res) => {
   try {
      // ✅ postId를 올바르게 가져오기
      const postId = req.params.id

      // ✅ 수정할 데이터 추출 (카테고리 기본값 추가)
      const { title, content, category = 'free' } = req.body
      const removeImageIds = JSON.parse(req.body.removeImageIds || '[]')

      if (!title || !content) {
         return res.status(400).json({ success: false, message: '제목과 내용을 모두 입력해야 합니다.' })
      }

      // ✅ 게시글 찾기
      const post = await Post.findByPk(postId, { include: Images })
      if (!post) {
         return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' })
      }

      // ✅ 게시글 제목, 내용, 카테고리 수정
      await post.update({ title, content, category })

      // ✅ 삭제할 이미지가 있다면 삭제
      if (removeImageIds.length > 0) {
         await Images.destroy({ where: { id: removeImageIds, postId } })
      }

      // ✅ 새로운 이미지가 있다면 추가
      if (req.files && req.files.length > 0) {
         const newImages = req.files.map((file) => ({
            path: file.path.replace(/\\/g, '/'), // 🔥 백슬래시 → 슬래시 변환
            postId,
         }))
         await Images.bulkCreate(newImages)
      }

      // ✅ 수정된 게시글 반환 (이미지 포함)
      const updatedPost = await Post.findByPk(postId, {
         include: [{ model: Images, attributes: ['id', 'path'] }],
      })

      res.json({ success: true, post: updatedPost, message: '게시글이 성공적으로 수정되었습니다.' })
   } catch (error) {
      console.error('게시글 수정 오류:', error)
      res.status(500).json({ success: false, message: '게시글 수정 중 오류 발생', error })
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
      const post = await Post.findByPk(req.params.id, {
         include: [
            {
               model: User,
               attributes: ['id', 'nickname'],
            },
            {
               model: Images,
               attributes: ['id', 'path'],
            },
            {
               model: Comment,
               attributes: [],
            },
         ],
         raw: false,
         nest: true,
      })

      // ✅ `post.Images` 배열이 `o: {}` 형태라면 변환
      if (post.Images && Array.isArray(post.Images)) {
         post.Images = post.Images.map((image) => ({
            id: image.id,
            path: image.path.replace(/\\/g),
         }))
      }

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
