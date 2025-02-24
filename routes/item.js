const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Item, Myitem } = require('../models')
const { isAdmin, isLoggedIn } = require('./middlewares')

// ✅ 'uploads/' 폴더가 없으면 자동 생성
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true })
}

// ✅ multer 설정 (파일 저장 위치 & 이름 지정)
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'uploads/') // ✅ 파일 저장 폴더 지정
   },
   filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) // ✅ 확장자 추출
      cb(null, Date.now() + ext) // ✅ 저장 파일명: 현재 시간 + 확장자
   },
})
const upload = multer({ storage }) // ✅ `uploads` 변수로 정의

// ✅ 아이템 등록 API (multer를 사용하여 이미지 업로드)
router.post('/', upload.single('img'), async (req, res) => {
   try {
      console.log('📌 요청 데이터:', req.body) // ✅ 요청 데이터 확인
      console.log('📌 업로드된 파일:', req.file) // ✅ 업로드 파일 확인

      const { name, detail, price, limit, type } = req.body
      const imgPath = req.file ? `/uploads/${req.file.filename}` : null

      if (!name || !price || !type || !imgPath) {
         return res.status(400).json({ success: false, message: '필수 항목을 입력하세요.' })
      }

      const newItem = await Item.create({ name, detail, price, img: imgPath, limit, type })

      console.log('✅ 저장된 아이템:', newItem) // ✅ DB 저장 확인

      res.status(201).json({ success: true, item: newItem })
   } catch (error) {
      console.error('❌ 상품 등록 오류:', error) // ✅ 오류 확인
      res.status(500).json({ success: false, message: '아이템 등록 실패', error: error.message })
   }
})

// ✅ 아이템 수정 API (관리자만 가능)
router.put('/:id', isLoggedIn, isAdmin, upload.single('img'), async (req, res) => {
   if (!req.user) {
      return res.status(401).json({ success: false, message: '로그인이 필요합니다.' })
   }

   try {
      const { id } = req.params
      let { name, detail, price, limit, type } = req.body
      const imgPath = req.file ? `/uploads/${req.file.filename}` : req.body.img

      console.log('🔹 수정 요청 데이터:', req.body)
      console.log('🔹 업로드된 파일:', req.file)

      const item = await Item.findByPk(id)
      if (!item) {
         return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' })
      }

      price = Number(price)
      if (isNaN(price)) {
         return res.status(400).json({ success: false, message: '유효한 가격을 입력하세요.' })
      }

      await item.update({ name, detail, price, limit, type, img: imgPath })

      return res.json({ success: true, message: '상품이 성공적으로 수정되었습니다.', item })
   } catch (error) {
      console.error('상품 수정 실패:', error)
      return res.status(500).json({ success: false, message: '서버 오류 발생' })
   }
})

// ✅ 아이템 목록 조회 API
router.get('/', async (req, res) => {
   try {
      const items = await Item.findAll()

      console.log('📌 서버에서 불러온 아이템 목록:', items) // ✅ 서버에서 데이터 확인

      res.status(200).json({ success: true, items })
   } catch (error) {
      console.error('❌ 아이템 조회 오류:', error)
      res.status(500).json({ success: false, message: '아이템 조회 실패', error: error.message })
   }
})

// ✅ 사용자의 아이템 목록 가져오기
router.get('/myitems', async (req, res) => {
   try {
      console.log('🔹 요청된 사용자 ID:', req.user.id)

      const myItems = await Myitem.findAll({
         where: { userId: req.user.id },
         include: [
            {
               model: Item,
               attributes: ['name', 'detail', 'img'],
            },
         ],
      })

      if (!myItems || myItems.length === 0) {
         return res.status(200).json({ success: true, items: [] }) // ✅ 빈 배열 반환
      }

      const formattedItems = myItems.map((item) => ({
         id: item.id,
         title: item.Item.name, // ✅ 아이템 이름
         description: item.Item.detail, // ✅ 아이템 설명
         img: item.Item.img ? `http://localhost:8000${item.Item.img}` : '/img/default.png', // ✅ 이미지
         limit: item.limit, // ✅ 남은 기간
      }))

      res.status(200).json({ success: true, items: formattedItems })
   } catch (error) {
      console.error('❌ 아이템 내역 조회 중 오류 발생:', error)
      res.status(500).json({ success: false, message: '아이템 내역 조회 중 오류 발생' })
   }
})

// ✅ 아이템 삭제 API 추가
router.delete('/:id', isLoggedIn, isAdmin, async (req, res) => {
   try {
      const { id } = req.params

      // ✅ Sequelize에서는 findByPk 사용
      const item = await Item.findByPk(id)
      if (!item) {
         return res.status(404).json({ message: '아이템을 찾을 수 없습니다.' })
      }

      // ✅ Sequelize 삭제 메서드 사용
      await item.destroy()

      res.status(200).json({ message: '아이템이 성공적으로 삭제되었습니다.' })
   } catch (error) {
      console.error('아이템 삭제 중 오류 발생:', error)
      res.status(500).json({ message: '서버 오류가 발생했습니다.' })
   }
})

module.exports = router
