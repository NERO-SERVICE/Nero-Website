# Netlify, GitHub Actions, Firebase 연동 절차

이 저장소는 정적 사이트를 Netlify에 배포하고, 문의 폼은 Netlify Functions를 통해 Firebase Firestore에 저장합니다. 이메일 발송은 `.env`에서 직접 관리하지 않고, Firebase Extension 또는 `nero_website` 내부 코드의 최소 로직으로 다룹니다.

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

`.env.example`에도 Firebase 연결값만 남겨둡니다. 이메일 주소, 제목 prefix, 발송 provider 키는 `.env`에 넣지 않습니다.

로컬에서는 `.env.example`을 참고해 `.env`를 만들고 `npm run netlify:dev`로 실행합니다.

## 2. 문의 폼 최소 기능 구조

현재 흐름:

```text
/landing contact form
→ POST /.netlify/functions/contact
→ Firestore: nero-web/contact_requests/items
→ Firestore: nero-web/email_queue/items
→ optional Firebase Trigger Email extension
```

프론트엔드는 `js/landing.js`의 `wireContactForm()`에서 JSON으로 전송합니다.

서버리스 함수는 `netlify/functions/contact.js`입니다.

최소 기능 단위:

1. `contact_requests/items`: 사용자가 보낸 원본 문의 저장
2. `email_queue/items`: 이메일 발송 요청 문서 저장
3. Firebase Extension: `email_queue/items`에 문서가 생기면 실제 이메일 발송

현재 이메일 수신 주소와 제목 prefix는 `.env`가 아니라 `netlify/functions/contact.js`의 `CONTACT_NOTIFICATION` 상수에서 관리합니다.

```js
const CONTACT_NOTIFICATION = {
    to: "official@nero.ai.kr",
    subjectPrefix: "[NERO]",
    requestCollectionPath: "nero-web/contact_requests/items",
    emailQueueCollectionPath: "nero-web/email_queue/items",
};
```

이 방식은 사이트 JS 번들을 무겁게 만들지 않고, Netlify Function도 Firebase에 문서 2개를 쓰는 역할만 맡습니다.

개발자 관점 추천 경계:

- 프론트엔드: 입력값 수집, 버튼 상태, 성공/실패 메시지 표시만 담당
- Netlify Function: 입력 검증, 스팸 honeypot 확인, Firestore 문서 생성만 담당
- Firebase Firestore: 문의 원본과 이메일 발송 큐 저장
- Firebase Extension: 실제 이메일 발송 provider, SMTP, 발신자 설정 담당
- `.env`: Firebase 연결 자격 증명만 담당

이 구조를 유지하면 랜딩 페이지는 가볍게 유지되고, 이메일 provider를 바꿔도 프론트엔드 코드를 건드리지 않아도 됩니다.

## 3. GitHub Actions CI/CD 설정

`.github/workflows/netlify-deploy.yml`가 추가되어 있습니다.

동작:

- Pull Request: JavaScript syntax check만 실행
- `main` push: check 후 Netlify environment sync, production deploy
- 수동 실행: `main` 브랜치에서 실행한 `workflow_dispatch`만 environment sync, production deploy

deploy job은 Repository secrets만 사용합니다. 공개 저장소 보안을 위해 `pull_request`에서는 deploy job이 실행되지 않습니다.

workflow의 `Sync Netlify function environment` 단계가 Firebase 연결값만 Netlify production/functions scope로 자동 세팅합니다.

공개 repository 보안 원칙:

- secrets는 코드, 문서, `.env`에 직접 쓰지 않습니다.
- `pull_request_target` 이벤트는 사용하지 않습니다.
- PR에서는 `validate` job만 실행되고 secrets가 필요한 deploy job은 실행되지 않습니다.
- production 배포는 `main` push 또는 `main` 브랜치에서의 수동 실행만 허용합니다.
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

## 4. Firebase에 `nero-web` 경로 만들기

Firebase에서 `nero-web-db`는 Cloud Firestore database ID이고, `nero-web`은 그 안에서 쓰는 collection/document path입니다. 두 이름이 달라도 괜찮습니다.

`nero-web`은 미리 만드는 실제 폴더가 아니라, Storage path 또는 Firestore collection/document path입니다.

이 저장소의 기준 경로:

```text
Cloud Storage: nero-web/images/{file}
Cloud Storage backend-only: nero-web/backend/{file}
Cloud Firestore database: nero-web-db
Cloud Firestore contact path: nero-web/contact_requests/items/{autoId}
Cloud Firestore email queue path: nero-web/email_queue/items/{autoId}
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

## 5. Firebase에서 이메일 발송 설정

이메일 발송은 `.env`가 아니라 Firebase Console에서 관리하는 것을 추천합니다.

추천 방식:

1. Firebase Console → `Extensions`
2. `Trigger Email from Firestore` 설치
3. Cloud Firestore collection path를 아래 값으로 설정

```text
nero-web/email_queue/items
```

4. SMTP provider, 발신 주소, 인증 정보는 Extension 설정 화면에서 입력
5. 문의 폼 제출 시 Netlify Function이 `email_queue/items`에 아래 형태의 문서를 생성

```js
{
  to: "official@nero.ai.kr",
  replyTo: "user@example.com",
  message: {
    subject: "[NERO] 프로젝트 진단 요청 - 홍길동",
    text: "...",
    html: "..."
  }
}
```

Firebase 공식 Trigger Email extension은 Firestore collection에 문서가 추가되면 그 문서의 `to`, `message` 필드를 바탕으로 이메일을 발송합니다.

Extension을 설치하지 않아도 문의 접수 저장은 정상 동작합니다. 이 경우 Firestore의 `nero-web/contact_requests/items`에서 직접 확인하면 됩니다.

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

정적 페이지만 확인:

```bash
npm run dev
```

Netlify Function까지 확인:

```bash
npm run netlify:dev
```

Netlify Dev URL은 기본적으로 `http://localhost:8888`이며, 함수 URL은 아래와 같습니다.

```text
http://localhost:8888/.netlify/functions/contact
```

## 8. 배포 후 확인

1. `/landing/#contact`에서 성함, 이메일, 문의내용 입력
2. `아이디어 보내기` 클릭
3. 화면에 접수 완료 메시지 확인
4. Firestore에서 `nero-web/contact_requests/items` 확인
5. Trigger Email extension을 설치했다면 `official@nero.ai.kr` 수신함 확인
