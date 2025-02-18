from flask import Flask, Response
from captcha.image import ImageCaptcha
import random  # random 모듈 추가
import string  # string 모듈 추가
import io

app = Flask(__name__)

@app.route('/captcha-image', methods=['GET'])
def captcha_image():
    image_captcha = ImageCaptcha(width=280, height=90)
    
    # 숫자 제외하고 영어 대문자만 사용
    allowed_characters = string.ascii_uppercase  # 대문자만 사용
    
    # 보안문자 텍스트 생성
    captcha_text = ''.join(random.choices(allowed_characters, k=6))
    
    # 보안문자 문자열 출력
    print(f"Generated CAPTCHA Text: {captcha_text}")
    
    # 글자 간격, 폰트 크기 등을 설정하여 구분 확실하게 만들기
    image_captcha.fonts = ['path_to_a_good_font.ttf']  # 다른 폰트 사용 (경로는 실제로 존재하는 폰트 파일로 변경)
    image_captcha.random_noise = True  # 노이즈 추가
    image_captcha.distort_noise = True  # 왜곡 추가
    
    # 보안문자 이미지 생성
    image = image_captcha.generate_image(captcha_text)

    # 이미지를 PNG 포맷으로 반환
    buf = io.BytesIO()
    image.save(buf, format='PNG')
    buf.seek(0)
    return Response(buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
