//댓글 crud,채택 (지우)

const express = require('express')
const multer = require('multer')
const { Comment, User, Post, Images } = require('../models')
const { isLoggedIn } = require('../routes/middlewares') // ✅ 로그인한 사용자만 댓글 작성 가능
const path = require('path')
const fs = require('fs')

const router = express.Router()

// uploads 폴더가 없을 경우 새로 생성
try {
   fs.readdirSync('uploads') //해당 폴더가 있는지 확인
} catch (error) {
   console.log('uploads 폴더가 없어 uploads 폴더를 생성합니다.')
   fs.mkdirSync('uploads') //폴더 생성
}

// ✅ 이미지 업로드 설정
const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/') // ✅ uploads 폴더에 따로저장
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

//댓글내용 등록 localhost:8000/comment

//  댓글 작성 API (이미지 여러 개 업로드 가능)
router.post('/', isLoggedIn, upload.array('images', 10), async (req, res) => {
   try {
      console.log('파일 정보:', req.files) // ✅ 여러 파일 확인
      const { postId, content } = req.body

      //  댓글 내용이 비어 있는 경우 에러 반환
      if (!content.trim()) {
         return res.status(400).json({ success: false, message: '댓글 내용을 입력하세요.' })
      }

      //  이미지가 여러 개일 경우, 배열로 변환
      const images = req.files.length > 0 ? req.files.map((file) => `/uploads/${file.filename}`) : []

      //  댓글 생성
      const newComment = await Comment.create({
         postId,
         userId: req.user.id, // 작성자 ID
         content,
         images, //  images 배열 저장 (팀원의 스타일 유지)
      })

      //  응답 반환
      res.status(201).json({
         success: true,
         comment: {
            ...newComment.get({ plain: true }), // Sequelize 모델을 JSON으로 변환
            images, // 추가된 이미지 정보 포함
         },
      })
   } catch (error) {
      console.error('🚨 댓글 작성 오류:', error)
      res.status(500).json({ success: false, message: '댓글 작성 실패', error })
   }
})

//댓글내용 등록 localhost:8000/comment/:id
router.patch('/:id', isLoggedIn, upload.array('images', 10), async (req, res) => {
   try {
      const { id } = req.params
      const { content, keepOldImages } = req.body // 🔥 기존 이미지를 유지할지 여부 받음
      console.log('업로드된 파일:', req.files)

      //  댓글 존재 여부 확인
      const comment = await Comment.findOne({ where: { id: Number(id) } })
      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // 댓글 작성자가 맞는지 확인 (관리자 예외)
      if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
         return res.status(403).json({ success: false, message: '본인의 댓글만 수정할 수 있습니다.' })
      }

      //  기존 이미지 유지 여부 체크
      let updatedImages = []
      if (keepOldImages === 'true' && comment.images) {
         updatedImages = [...comment.images] // 기존 이미지 유지
      }

      //  새 이미지 추가 (업로드된 경우만)
      if (req.files.length > 0) {
         const newImages = req.files.map((file) => `/uploads/comments/${file.filename}`)
         updatedImages = [...updatedImages, ...newImages] // 기존 이미지 + 새로운 이미지 결합
      }

      //  수정할 내용이 없으면 400 에러
      if (!content?.trim() && updatedImages.length === 0) {
         return res.status(400).json({ success: false, message: '수정할 내용 또는 이미지를 입력하세요.' })
      }

      // 댓글 업데이트 (업데이트된 필드만 반영)
      const updateData = {}
      if (content?.trim()) updateData.content = content
      if (updatedImages.length > 0) updateData.images = updatedImages

      await Comment.update(updateData, { where: { id: Number(id) } })

      // 업데이트된 댓글 다시 조회 후 응답 반환
      const updatedComment = await Comment.findOne({ where: { id: Number(id) } })

      res.json({ success: true, message: '댓글이 수정되었습니다.', comment: updatedComment })
   } catch (error) {
      console.error('🚨 댓글 수정 오류:', error)
      res.status(500).json({ success: false, message: '댓글 수정 실패' })
   }
})

// 댓글 삭제 localhost:8000/comments/:id
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const { id } = req.params

      // ✅ 삭제할 댓글 조회 (본인 댓글 또는 관리자만 삭제 가능)
      const comment = await Comment.findOne({ where: { id } })

      if (!comment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
      }

      // ✅ 본인 댓글인지 또는 관리자인지 확인
      if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
         return res.status(403).json({ success: false, message: '본인의 댓글만 삭제할 수 있습니다.' })
      }

      // ✅ 댓글 삭제
      await comment.destroy()

      res.json({
         success: true,
         message: '댓글이 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error('🚨 댓글 삭제 오류:', error)
      res.status(500).json({ success: false, message: '댓글 삭제 중 오류가 발생했습니다.', error })
   }
})

// 전체 댓글 목록 불러오기 (페이징 기능) localhost:8000/comments?postId=1&page=1&limit=5
router.get('/', async (req, res) => {
   try {
      const { postId } = req.query // 특정 게시글의 댓글 조회
      const page = parseInt(req.query.page, 10) || 1 // 기본 페이지 1
      const limit = parseInt(req.query.limit, 10) || 5 // 기본 페이지당 댓글 수 5
      const offset = (page - 1) * limit // 오프셋 계산

      if (!postId) {
         return res.status(400).json({ success: false, message: 'postId를 입력해주세요.' })
      }

      // 전체 댓글 개수 조회
      const count = await Comment.count({ where: { postId } })

      // 댓글 데이터 가져오기
      const comments = await Comment.findAll({
         where: { postId }, // 해당 게시글의 댓글만 가져오기
         limit,
         offset,
         order: [['createdAt', 'DESC']], // 최신 댓글 순으로 정렬
         include: [
            {
               model: User,
               attributes: ['id', 'nickname', 'email'], // 댓글 작성자 정보 포함
            },
         ],
      })

      res.json({
         success: true,
         comments,
         pagination: {
            totalComments: count, // 전체 댓글 수
            currentPage: page, // 현재 페이지
            totalPages: Math.ceil(count / limit), // 총 페이지 수
            limit, // 한 페이지당 댓글 수
         },
         message: '댓글 목록을 성공적으로 불러왔습니다.',
      })
   } catch (error) {
      console.error('🚨 댓글 목록 불러오기 오류:', error)
      res.status(500).json({ success: false, message: '댓글 목록을 불러오는 중 오류가 발생했습니다.', error })
   }
})

module.exports = router
