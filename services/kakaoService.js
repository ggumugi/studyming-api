// kakaoService.js
const getKakaoUserInfo = async (accessToken) => {
   const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
         Authorization: `Bearer ${accessToken}`,
      },
   })

   if (!response.ok) {
      throw new Error('사용자 정보를 가져오는 데 실패했습니다.')
   }

   return await response.json() // 사용자 정보 JSON 파싱
}

module.exports = getKakaoUserInfo // 함수를 내보냄
