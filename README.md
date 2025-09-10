![스터디밍](https://github.com/ggumugi/studyming-frontend/blob/main/public/img/%EC%8A%A4%ED%84%B0%EB%94%94%EB%B0%8D.png)
# STUDYMING

캠 & 화면공유와 인증 시스템이 포함된 타이머를 활용하여 함께 집중하고 학습할 수 있는 스터디 플랫폼

<br/>

# 개발기간

25.01.31 ~ 25.03.06

<br/>

# 소개

*혼자하는 공부가 아닌 "같이하는 공부"*

우리는 공부를 보다 효과적으로 실천 할 수 있도록 돕는 스터디 플랫폼을 개발했습니다.

스터디를 진행할 때 회원들을 관리하고, 집중력을 유지하는 것이 중요합니다. 이를 위해 다양한 기능을 제공하여 스터디 그룹이 원활하게 운영될 수 있도록 지원합니다.

<br/>

### 핵심 기능 - 캠 & 화면 공유 , 채팅 , 타이머, 카카오페이

<br/>

**캠 & 화면 공유**
> JITSI Meet
>
> 스터디 참가자들은 화상 카메라를 통하여 서로의 학습 모습을 확인할 수 있습니다.
<br/>

 **채팅**
> Socket.io
> 
> 스터디 룸 내 채팅을 통해 실시간으로 소통하며, 서로 응원하고 피드백을 주고받아 몰입감 있는 학습 환경을 조성할 수 있습니다.
<br/>

**참여 인증 시스템이 포함된 타이머**
>  Python ( 보안코드 이미지 )
> 
> 스터디 중 방장이 설정한 시간마다 나타나는 보안코드가 탑재된 타이머를 사용하여 참가자들이 실시간으로 참여하고 있는지 확인할 수 있습니다.
<br/>

 **카카오페이 결제 시스템**
> i'mport
> 
> 스터디방 채팅에서 사용할 수 있는 이모티콘 및 아이템을 구매할 수 있는 스토어를 운영하며, 이를 위한 결제 시스템을 구축하였습니다.
<br/>

# 팀원
<table>
  <tr align="center">
    <td>
      <a href="https://github.com/ggumugi">
        <img src="https://github.com/ggumugi.png" width="100" height="100"><br>
        <strong>팀장: 박현수</strong>
      </a>
    </td>
    <td>
      <a href="https://github.com/kangwonsik07">
        <img src="https://github.com/kangwonsik07.png" width="100" height="100"><br>
        <strong>팀원: 강원식</strong>
      </a>
    </td>
    <td>
      <a href="https://github.com/jiwoo1114">
        <img src="https://github.com/jiwoo1114.png" width="100" height="100"><br>
        <strong>팀원: 박지우</strong>
      </a>
    </td>
    <td>
      <a href="https://github.com/000Lee">
        <img src="https://github.com/000Lee.png" width="100" height="100"><br>
        <strong>팀원: 이경희</strong>
      </a>
    </td>
  </tr>
</table>
<br/>

### [기능 정의서](https://docs.google.com/spreadsheets/d/1I2MoGMJaKYxN_koUClxVCo37FfeTB7ZJXELmgS2L358/edit?gid=0#gid=0)

### [API 명세서](https://docs.google.com/spreadsheets/d/1I2MoGMJaKYxN_koUClxVCo37FfeTB7ZJXELmgS2L358/edit?gid=1039081252#gid=1039081252)

### [화면 설계서](https://www.figma.com/design/bPH7YyiRWYclDMpJbxT2zb/Studyming?node-id=0-1&t=mG50EjOrFCx8irmo-1)

### [ERD](https://github.com/ggumugi/studyming-frontend/blob/main/public/img/studyming_erd.png)

<br/>

# 아키텍처 다이어그램
![아키텍처 다이어그램](https://github.com/ggumugi/studyming-frontend/blob/main/public/img/%EC%95%84%ED%82%A4%ED%85%8D%EC%B3%90.webp)

<br/>

# 사용 기술 스택  
<br/>

## 🖥 Front-end  
- **React** v19.0.0  
- **사용 라이브러리**  
  - `axios`  
  - `redux`, `@reduxjs/toolkit`  
  - `styled-components`  
  - `socket.io-client`  
  - `slick-carousel`  
  - `react-router-dom`  

<br/>

## 🛠 Back-end  
- **Node.js** v20.15.1  
- **사용 라이브러리**  
  - `Sequelize`  
  - `express`  
  - `nodemailer`  
  - `node-cron`  
  - `axios`  
  - `socket.io`  

<br/>

## 🗄 Database  
- **MySQL** v8.0.36  

<br/>

## 🐍 추가 Python 서비스  
- **Flask 기반 서비스**  
- **사용 라이브러리**  
  - `flask`, `flask-cors`  
  - `captcha`  
  - `mysql-connector-python`  
  - `python-dotenv`, `dotenv`  

<br/>

## ☁ Deploy
- **AWS**  
  - Node.js 백엔드 배포 (Ubuntu Linux)  
  - MySQL (RDS)  
- **Netlify**  
  - React 프론트엔드 배포  


