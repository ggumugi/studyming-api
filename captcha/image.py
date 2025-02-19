# import mysql.connector
# import random
# import string
# import base64
# import uuid  # 고유한 토큰 생성을 위한 uuid 모듈
# from flask import Flask, request, jsonify
# from dotenv import load_dotenv
# import os

# # 환경 변수 로드
# load_dotenv()

# app = Flask(__name__)

# # MySQL 연결 설정 (환경 변수 사용)
# db = mysql.connector.connect(
#     host=os.getenv("MYSQL_HOST"),
#     user=os.getenv("MYSQL_USER"),
#     password=os.getenv("MYSQL_PASSWORD"),
#     database=os.getenv("MYSQL_DATABASE")
# )
# cursor = db.cursor()

# # 고유한 토큰 생성 함수
# def generateUniqueToken():
#     while True:
#         token = str(uuid.uuid4())  # 고유한 UUID를 생성
#         cursor.execute("SELECT token FROM captchas WHERE token = %s", (token,))
#         if not cursor.fetchone():  # 이미 존재하는 토큰이 없다면
#             return token  # 유니크한 토큰 반환

# # 보안문자 이미지 생성 함수 (Base64 인코딩된 문자열 반환)
# def generateCaptchaImage(text):
#     return base64.b64encode(f"CAPTCHA-{text}".encode()).decode()

# # 보안문자 생성 API
# @app.route('/captchaImage', methods=['GET'])
# def generateCaptcha():
#     captchaText = ''.join(random.choices(string.ascii_uppercase, k=6))
#     captchaImage = generateCaptchaImage(captchaText)
#     token = generateUniqueToken()  # 고유한 토큰 생성

#     # 보안문자 DB 저장
#     cursor.execute("INSERT INTO captchas (img, text, token) VALUES (%s, %s, %s)", (captchaImage, captchaText, token))
#     db.commit()

#     return jsonify({"img": captchaImage, "captchaText": captchaText, "token": token})  # 클라이언트에게 token 반환

# # 보안문자 검증 API
# @app.route('/verifyCaptcha', methods=['POST'])
# def verifyCaptcha():
#     data = request.json
#     token = data.get("token")
#     userInput = data.get("captcha").upper()

#     # DB에서 보안문자 조회
#     cursor.execute("SELECT text FROM captchas WHERE token = %s", (token,))
#     result = cursor.fetchone()

#     if result and result[0] == userInput:
#         cursor.execute("DELETE FROM captchas WHERE token = %s", (token,))  # 검증 성공 시 삭제
#         db.commit()
#         return jsonify({"success": True, "message": "보안문자 인증 성공"})

#     return jsonify({"success": False, "message": "보안문자 인증 실패"})

# if __name__ == '__main__':
#     app.run(debug=True, port=5000)

import io
import mysql.connector
import random
import string
import base64
import uuid  # 고유한 토큰 생성을 위한 uuid 모듈
from captcha.image import ImageCaptcha  # 실제 이미지 생성용
from flask import Flask, request, jsonify
from flask_cors import CORS  # CORS 임포트 추가
from dotenv import load_dotenv
import os

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  # CORS 설정 추가

# MySQL 연결 설정 (환경 변수 사용)
db = mysql.connector.connect(
    host=os.getenv("MYSQL_HOST"),
    user=os.getenv("MYSQL_USER"),
    password=os.getenv("MYSQL_PASSWORD"),
    database=os.getenv("MYSQL_DATABASE")
)
cursor = db.cursor()

# 고유한 토큰 생성 함수
def generateUniqueToken():
    while True:
        token = str(uuid.uuid4())  # 고유한 UUID를 생성
        cursor.execute("SELECT token FROM captchas WHERE token = %s", (token,))
        if not cursor.fetchone():  # 이미 존재하는 토큰이 없다면
            return token  # 유니크한 토큰 반환

# 보안문자 이미지 생성 함수 (실제 이미지 생성 후 Base64 인코딩)
def generateCaptchaImage(text):
    image_captcha = ImageCaptcha(width=280, height=90)
    image = image_captcha.generate_image(text)
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

# 보안문자 생성 API
@app.route('/captchaImage', methods=['GET'])
def generateCaptcha():
    captchaText = ''.join(random.choices(string.ascii_uppercase, k=6))
    captchaImage = generateCaptchaImage(captchaText)
    token = generateUniqueToken()  # 고유한 토큰 생성

    # 보안문자 DB 저장
    cursor.execute("INSERT INTO captchas (img, text, token) VALUES (%s, %s, %s)", (captchaImage, captchaText, token))
    db.commit()

    return jsonify({"img": captchaImage, "captchaText": captchaText, "token": token})  # 클라이언트에게 token 반환

# 보안문자 검증 API
@app.route('/verifyCaptcha', methods=['POST'])
def verifyCaptcha():
    data = request.json
    token = data.get("token")
    userInput = data.get("captcha").upper()

    # DB에서 보안문자 조회
    cursor.execute("SELECT text FROM captchas WHERE token = %s", (token,))
    result = cursor.fetchone()

    if result and result[0] == userInput:
        cursor.execute("DELETE FROM captchas WHERE token = %s", (token,))  # 검증 성공 시 삭제
        db.commit()
        return jsonify({"success": True, "message": "보안문자 인증 성공"})

    return jsonify({"success": False, "message": "보안문자 인증 실패"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
