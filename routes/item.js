const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Item } = require('../models')

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

module.exports = router
