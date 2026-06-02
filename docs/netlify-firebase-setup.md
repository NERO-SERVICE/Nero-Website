# Netlify, GitHub Actions, Firebase 연동 절차

이 저장소는 정적 사이트를 Netlify에 배포하고, 문의 폼은 Netlify Functions를 통해 Firebase Firestore에 저장합니다. 이메일 발송은 `backend/email/smtp-mailer.js`의 SMTP 모듈이 Gmail SMTP로 처리하며, Gmail 계정/App Password 같은 민감값은 GitHub Repository secrets와 Netlify Functions 환경변수로 관리합니다.

## 1. GitHub Actions Repository secrets 설정

Netlify의 production 환경에는 `.env` 파일을 업로드하지 않습니다. 민감한 값은 GitHub Actions의 Repository secrets에 저장합니다.

GitHub UI 기준:

1. GitHub repository 선택
2. `Settings` → `Secrets and variables` → `Actions`
3. `Repository secrets`에 아래 값을 추가
4. `main` 브랜치에 push하거나 Actions에서 수동 배포 실행

workflow가 배포 직전에 GitHub Repository secrets를 읽고 Netlify CLI의 `env:set`으로 Netlify Functions 환경변수를 자동 등록합니다. 그래서 Netlify Dashboard에서 함수용 환경변수를 따로 등록할 필요가 없습니다.

배포용 필수:

```bash
NETLIFY_AUTH_TOKEN=netlify_personal_access_token
NETLIFY_SITE_ID=your_netlify_site_id
```

Firebase 연결 필수:

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIRESTORE_DATABASE_ID=nero-web-db
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_service_account_json
```

Gmail SMTP 발송 필수:

```bash
SMTP_USER=cs123@nero.ai.kr
SMTP_PASS=google_app_password
```

Gmail SMTP 발송 선택:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_FROM="NERO <cs123@nero.ai.kr>"
SMTP_EHLO_DOMAIN=nero.ai.kr
```

`.env.example`에는 Firebase 연결값과 Gmail SMTP 발송에 필요한 최소값만 남겨둡니다. `SMTP_PASS`에는 일반 Gmail 로그인 비밀번호가 아니라 Google App Password를 넣습니다.

로컬에서는 `.env.example`을 참고해 `.env`를 만들고 `npm run dev`로 실행합니다.

## 2. 문의 폼 최소 기능 구조

현재 흐름:

```text
/landing contact form
→ POST /.netlify/functions/contact
→ Firestore: nero-web/contact_requests/items
→ backend/email/smtp-mailer.js
→ Gmail SMTP
→ cs123@nero.ai.kr
```

프론트엔드는 `js/landing.js`의 `wireContactForm()`에서 JSON으로 전송합니다.

서버리스 함수는 `netlify/functions/contact.js`입니다.

최소 기능 단위:

1. `contact_requests/items`: 사용자가 보낸 원본 문의 저장
2. `backend/email/smtp-mailer.js`: SMTP 연결, 인증, MIME 메시지 생성, 발송
3. Netlify Function: 입력 검증, Firestore 저장, SMTP 메일러 호출

현재 이메일 수신 주소와 제목 prefix는 `netlify/functions/contact.js`의 `CONTACT_NOTIFICATION` 상수에서 관리합니다. SMTP 계정/비밀번호 등 민감값만 환경변수에 둡니다.

```js
const CONTACT_NOTIFICATION = {
    to: "cs123@nero.ai.kr",
    from: "NERO <cs123@nero.ai.kr>",
    subjectPrefix: "[NERO]",
    requestCollectionPath: "nero-web/contact_requests/items",
};
```

이 방식은 사이트 JS 번들을 무겁게 만들지 않고, 별도 Firebase Extension 없이 Netlify Function 안에서 최소 SMTP 발송만 수행합니다.

개발자 관점 추천 경계:

- 프론트엔드: 입력값 수집, 버튼 상태, 성공/실패 메시지 표시만 담당
- Netlify Function: 입력 검증, 스팸 honeypot 확인, Firestore 문서 생성, SMTP 메일러 호출 담당
- Firebase Firestore: 문의 원본 저장
- `backend/email/smtp-mailer.js`: SMTP 프로토콜 처리 담당
- `.env`/Repository secrets: Firebase 연결값과 Gmail SMTP 인증값만 담당

이 구조를 유지하면 랜딩 페이지는 가볍게 유지되고, 별도 유료 이메일 provider 없이 Gmail 계정만으로 문의 알림을 받을 수 있습니다.

## 3. GitHub Actions CI/CD 설정

`.github/workflows/netlify-deploy.yml`가 추가되어 있습니다.

동작:

- Pull Request: JavaScript syntax check만 실행
- `main` 또는 `develop` push: check 후 Netlify environment sync, production deploy
- 수동 실행: `main` 또는 `develop` 브랜치에서 실행한 `workflow_dispatch`만 environment sync, production deploy

deploy job은 Repository secrets만 사용합니다. 공개 저장소 보안을 위해 `pull_request`에서는 deploy job이 실행되지 않습니다.

workflow의 `Sync Netlify function environment` 단계가 Firebase 연결값과 Gmail SMTP 인증값을 Netlify production/functions scope로 자동 세팅합니다.

공개 repository 보안 원칙:

- secrets는 코드, 문서, `.env`에 직접 쓰지 않습니다.
- `pull_request_target` 이벤트는 사용하지 않습니다.
- PR에서는 `validate` job만 실행되고 secrets가 필요한 deploy job은 실행되지 않습니다.
- production 배포는 `main`/`develop` push 또는 해당 브랜치에서의 수동 실행만 허용합니다.
- Netlify 자동 Git 배포가 켜져 있으면 GitHub Actions 배포와 중복될 수 있으므로 하나만 사용하세요.

Netlify Access Token:

1. Netlify user settings
2. `Applications`
3. `Personal access tokens`
4. 새 토큰 생성

Netlify Site ID:

1. Netlify Dashboard에서 사이트 선택
2. `Site configuration` → `General`
3. `Site ID` 복사

이미 Netlify가 GitHub repository와 직접 연결되어 자동 배포 중이면, GitHub Actions 배포와 중복될 수 있습니다. 이 경우 Netlify의 자동 빌드를 끄거나, GitHub Actions만 production 배포 경로로 사용하세요.

문의 폼이 배포 환경에서 500을 반환하면 브라우저 Network 탭에서 `/.netlify/functions/contact` 응답 JSON의 `code`를 확인하세요.

대표 원인:

```text
firebase_env_missing: Netlify Function에 FIREBASE_PROJECT_ID 또는 FIREBASE_SERVICE_ACCOUNT_BASE64가 없음
firebase_token_failed: 서비스 계정 JSON 또는 Google IAM 인증 실패
firestore_write_failed: Firestore DB 이름, 권한, API 활성화, 경로 문제
smtp_env_missing: SMTP_USER 또는 SMTP_PASS가 Netlify Function에 없음
smtp_timeout: Netlify Function에서 Gmail SMTP 서버 연결 지연/차단/네트워크 실패
smtp_response_failed: Gmail App Password, 계정, 발신자 주소, SMTP 인증 실패
```

함수 URL을 브라우저에서 직접 열면 GET 요청이므로 문의가 접수되지는 않습니다. 랜딩페이지 버튼은 POST로 호출하므로, 실제 버튼 실패 원인은 500 응답의 `code`와 Netlify Function logs에서 확인합니다.

## 4. Firebase에 `nero-web` 경로 만들기

Firebase에서 `nero-web-db`는 Cloud Firestore database ID이고, `nero-web`은 그 안에서 쓰는 collection/document path입니다. 두 이름이 달라도 괜찮습니다.

`nero-web`은 미리 만드는 실제 폴더가 아니라, Storage path 또는 Firestore collection/document path입니다.

이 저장소의 기준 경로:

```text
Cloud Storage: nero-web/images/{file}
Cloud Storage backend-only: nero-web/backend/{file}
Cloud Firestore database: nero-web-db
Cloud Firestore contact path: nero-web/contact_requests/items/{autoId}
Cloud Firestore asset metadata path: nero-web/assets/items/{autoId}
```

### Firebase 프로젝트 생성

1. Firebase Console에서 프로젝트 생성
2. 프로젝트 이름은 예: `nero-web`
3. Web App 추가
4. Firebase config 값을 확인
5. Cloud Firestore 생성
6. Cloud Storage 생성

주의: Firebase Cloud Storage는 프로젝트/버킷/지역/요금제 상태에 따라 Blaze가 필요할 수 있습니다. Firebase 공식 Pricing에서 Cloud Storage는 Blaze 영역에 no-cost quota가 표시됩니다. 비용이 절대 발생하면 안 되는 상태라면 Storage를 활성화하기 전에 Firebase Console의 현재 플랜과 버킷 생성 조건을 확인하세요.

### Rules 배포

Firebase CLI를 사용합니다.

```bash
npx firebase-tools login
npx firebase-tools use your-firebase-project-id
npx firebase-tools deploy --only firestore:rules,storage
```

이 저장소에는 아래 rules가 있습니다.

```text
firebase/firestore.rules
firebase/storage.rules
```

기본 정책:

- Firestore `nero-web/**`: 클라이언트 직접 read/write 차단
- Storage `nero-web/images/**`: 공개 read 허용
- Storage `nero-web/images/**`: 로그인 사용자만 이미지 write 가능
- Storage `nero-web/backend/**`: 클라이언트 직접 read/write 차단

Netlify Function에서 서비스 계정으로 쓰는 Firestore 저장은 클라이언트 rules가 아니라 Google IAM 권한으로 처리됩니다.

## 5. Gmail SMTP 이메일 발송 설정

이메일 발송은 `backend/email/smtp-mailer.js`가 담당합니다. 별도 npm 패키지를 설치하지 않고 Node 기본 모듈로 Gmail SMTP 서버에 접속합니다.

코드는 `SMTP_HOST`가 없으면 `smtp.gmail.com`을 기본값으로 사용합니다. GitHub Repository secrets에는 아래 두 값만 반드시 추가하면 됩니다.

```bash
SMTP_USER=cs123@nero.ai.kr
SMTP_PASS=google_app_password
```

`SMTP_PASS`에는 일반 Gmail 로그인 비밀번호를 넣지 않습니다. Google 계정에서 2단계 인증을 켠 뒤 생성한 App Password를 넣어야 합니다.

권장 선택값:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_FROM="NERO <cs123@nero.ai.kr>"
SMTP_EHLO_DOMAIN=nero.ai.kr
```

Gmail App Password 생성:

1. `cs123@nero.ai.kr` 계정으로 Google에 로그인
2. Google Account → `Security`
3. `2-Step Verification` 활성화
4. `App passwords`로 이동
5. 앱 이름은 예: `nero-website-smtp-email`
6. 생성된 16자리 App Password를 복사
7. GitHub Repository secret `SMTP_PASS`에 공백 없이 저장

Google Workspace에서 App Password 메뉴가 보이지 않으면 Workspace 관리자 설정에서 App Password 사용이 막혀 있거나, 계정에 Advanced Protection이 켜져 있을 수 있습니다. 이 경우 관리자 콘솔에서 App Password 사용을 허용해야 합니다.

Gmail SMTP 기준:

```text
Host: smtp.gmail.com
Port: 465
Secure: true
User: cs123@nero.ai.kr
Pass: Google App Password
```

문의 폼 제출 시 Netlify Function이 SMTP로 발송하는 메일 구조:

```text
From: NERO <cs123@nero.ai.kr>
To: cs123@nero.ai.kr
Reply-To: 고객이 입력한 이메일
Subject: [NERO] 프로젝트 진단 요청 - 고객명
```

운영자는 `cs123@nero.ai.kr` 받은메일함에서 문의를 열고 `답장`을 누르면 고객 이메일로 바로 회신할 수 있습니다.

Gmail/Google Workspace에는 발송량 제한이 있습니다. 문의 폼 알림처럼 낮은 빈도의 운영 메일에는 적합하지만, 대량 메일이나 마케팅 메일 발송용으로 쓰면 계정 제한에 걸릴 수 있습니다.

공식 참고:

- Google App Password: https://support.google.com/accounts/answer/185833
- Gmail SMTP: https://developers.google.com/gmail/imap/imap-smtp
- Google Workspace Gmail sending limits: https://support.google.com/a/answer/166852

정상 동작 확인:

1. `/landing/#contact`에서 테스트 문의 제출
2. Firestore `nero-web/contact_requests/items`에 원본 문의 문서가 생성되는지 확인
3. `cs123@nero.ai.kr` 수신함에서 메일 확인

## 6. Firebase 이미지 업로드 연동

브라우저에서 이미지 업로드 UI를 만들 때는 `js/firebase-nero-web.js`를 사용합니다.

HTML에서 Firebase config를 먼저 주입합니다.

```html
<script>
  window.NERO_FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    databaseId: "nero-web-db",
    storageBucket: "YOUR_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
</script>
```

업로드 예시:

```js
import { uploadNeroWebImage, addNeroWebData } from "/js/firebase-nero-web.js";

const file = document.querySelector("input[type=file]").files[0];
const image = await uploadNeroWebImage(file, {
  folder: "images",
  purpose: "landing_asset",
});

await addNeroWebData("assets", {
  type: "image",
  path: image.path,
  url: image.url,
});
```

위 코드는 Storage에 `nero-web/images/...`로 파일을 저장하고, Firestore에는 `nero-web/assets/items/{autoId}` 문서를 추가합니다.

현재 rules 기준으로 브라우저 업로드를 쓰려면 Firebase Auth 로그인이 필요합니다. 운영자 전용 업로드라면 Firebase Console에서 직접 업로드하거나, 별도 관리자 인증 UI를 만든 뒤 Auth 조건을 유지하세요.

## 7. 로컬 확인

Netlify Function까지 포함해 확인:

```bash
npm run dev
```

브라우저에서는 아래 주소를 엽니다.

```text
http://127.0.0.1:4173/
```

랜딩 페이지를 바로 확인하려면 아래 주소를 엽니다.

```text
http://127.0.0.1:4173/landing/
```

`npm run dev`는 정적 페이지와 `/.netlify/functions/contact`를 같은 로컬 서버에서 처리합니다. 문의 폼과 이메일 발송 테스트는 `/landing/` 페이지에서 확인합니다.

이미 `4173` 포트를 다른 서버가 사용 중이면 `npm run dev`가 다음 포트로 자동 전환합니다. 터미널에 출력되는 실제 URL을 열면 됩니다.

함수 URL은 아래와 같습니다.

```text
http://127.0.0.1:4173/.netlify/functions/contact
```

## 8. 배포 후 확인

1. `/landing/#contact`에서 성함, 이메일, 문의내용 입력
2. `아이디어 보내기` 클릭
3. 화면에 접수 완료 메시지 확인
4. Firestore에서 `nero-web/contact_requests/items` 확인
5. `cs123@nero.ai.kr` 수신함에서 SMTP 발송 메일 확인
