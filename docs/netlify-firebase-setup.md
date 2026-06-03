# Netlify, Firebase, Contact Form 운영 절차

이 저장소는 정적 사이트를 Netlify에 배포하고, `/landing/#contact` 문의 폼은 Netlify Functions에서 Gmail SMTP로 발송합니다.

현재 운영 기준은 아래처럼 단순하게 유지합니다.

```text
GitHub repository
→ Netlify Git 연결 자동 배포
→ Netlify Functions 런타임 환경변수 직접 사용
→ Gmail SMTP 발송
```

GitHub Actions는 배포와 환경변수 주입을 하지 않고 JavaScript 문법 검증만 실행합니다.

## 1. Netlify에 직접 환경변수 입력

Netlify에 등록해야 하는 값은 `.env`와 같은 이름을 사용합니다. `.env` 파일 자체를 업로드하지 말고, Netlify UI에서 변수로 입력합니다.

Netlify UI 기준:

1. Netlify Dashboard 접속
2. `nero_website`가 연결된 사이트 선택
3. `Project configuration` 이동
4. `Environment variables` 이동
5. `Add a variable` 선택
6. 아래 키를 하나씩 추가
7. Scope는 가능하면 `Functions` 포함
8. Deploy context는 `Production` 포함
9. 저장 후 `Deploys`에서 `Trigger deploy` → `Deploy site` 실행

Netlify Functions에서 `process.env.SMTP_USER`처럼 런타임에 읽으려면 해당 변수의 scope에 `Functions`가 포함되어야 합니다.

중요: Netlify의 `Contains secret values` 표시는 실제 비밀번호인 `SMTP_PASS`에만 사용합니다. `SMTP_HOST`, `SMTP_USER`, `CONTACT_TO`, `SMTP_FROM`은 배포 코드나 문서에 공개 문자열로 등장할 수 있는 운영 설정값이므로 secret으로 표시하지 않습니다.

필수값:

```bash
SMTP_USER=your-smtp-account@example.com
SMTP_PASS=google_app_password
```

권장값:

```bash
CONTACT_TO=your-inbox@example.com
SMTP_HOST=Gmail SMTP host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_FROM="NERO <your-smtp-account@example.com>"
```

Firebase를 Netlify Function에서 직접 사용할 때만 선택적으로 추가합니다. 현재 문의 폼 SMTP 발송에는 필요하지 않습니다.

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
FIRESTORE_DATABASE_ID=nero-web-db
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_service_account_json
```

## 2. 현재 문의 폼 흐름

```text
/landing/#contact
→ POST /.netlify/functions/contact
→ netlify/functions/contact.js
→ netlify/functions/_smtp-mailer.js
→ Gmail SMTP
→ 운영 메일함
```

프론트엔드는 `scripts/landing.js`의 `wireContactForm()`에서 문의 데이터를 JSON으로 보냅니다.

서버리스 함수는 `netlify/functions/contact.js`입니다.

최소 기능 경계:

- `scripts/landing.js`: 입력값 수집, 버튼 상태, 성공/실패 메시지 표시
- `netlify/functions/contact.js`: 요청 방식 검증, 입력값 검증, 스팸 honeypot 확인, 메일 내용 구성
- `netlify/functions/_smtp-mailer.js`: Gmail SMTP 연결, 인증, MIME 메시지 생성, 발송

기본 수신 주소와 발신 표기는 아래 환경변수로 바꿀 수 있습니다.

```bash
CONTACT_TO=your-inbox@example.com
SMTP_FROM="NERO <your-smtp-account@example.com>"
```

메일 구조:

```text
From: NERO <your-smtp-account@example.com>
To: your-inbox@example.com
Reply-To: 고객이 입력한 이메일
Subject: [NERO] 프로젝트 진단 요청 - 고객명
```

운영자는 운영 메일함에서 문의 메일을 열고 `답장`을 누르면 고객 이메일로 바로 회신할 수 있습니다.

## 3. GitHub Actions 역할

`.github/workflows/netlify-deploy.yml`은 이제 배포하지 않습니다.

현재 역할:

- Pull Request: JavaScript syntax check
- `main` 또는 `develop` push: JavaScript syntax check
- 수동 실행: JavaScript syntax check

GitHub Actions에는 SMTP, Firebase, Netlify 배포 토큰을 넣지 않습니다.

배포는 Netlify의 Git 연결 기능으로 처리합니다.

Netlify 자동 배포 확인:

1. Netlify 사이트 선택
2. `Project configuration` → `Build & deploy`
3. `Continuous deployment` 확인
4. Repository가 현재 GitHub 저장소로 연결되어 있는지 확인
5. Production branch가 실제 배포 브랜치인지 확인

이 구조에서는 GitHub Secrets에 `.env` 값을 넣어도 Netlify Function이 읽지 않습니다. 운영 환경 값은 Netlify UI의 Environment variables가 단일 기준입니다.

## 4. 배포 후 확인 절차

환경변수를 추가하거나 수정한 뒤에는 반드시 새 배포가 필요합니다.

1. Netlify `Project configuration` → `Environment variables`에서 값 저장
2. `Deploys` → `Trigger deploy` → `Deploy site`
3. 배포 완료 후 `/landing/#contact`에서 테스트 문의 제출
4. 실패하면 브라우저 Network 탭에서 `/.netlify/functions/contact` 응답 JSON 확인
5. Netlify `Functions` 또는 `Logs`에서 `contact` 함수 로그 확인

대표 오류:

```text
smtp_env_missing: SMTP_USER 또는 SMTP_PASS가 Netlify Function 런타임에 없음
smtp_timeout: Gmail SMTP 연결 시간 초과
smtp_response_failed: Gmail SMTP 인증/응답 실패
smtp_submit_failed: 기타 SMTP 발송 실패
method_not_allowed: POST가 아닌 요청
```

함수 URL을 브라우저에서 직접 열면 GET 요청이므로 문의가 접수되지 않습니다. 정상 제출은 랜딩페이지 폼에서 POST로 호출됩니다.

## 5. Gmail App Password 설정

`SMTP_PASS`에는 일반 Gmail 로그인 비밀번호를 넣지 않습니다. Google 계정의 App Password를 사용합니다.

1. 발송에 사용할 Google 계정으로 로그인
2. Google Account → `Security`
3. `2-Step Verification` 활성화
4. `App passwords`로 이동
5. 앱 이름 예: `nero-website-smtp-email`
6. 생성된 16자리 App Password 복사
7. Netlify `SMTP_PASS`에 공백 없이 저장

Google Workspace에서 App Password 메뉴가 보이지 않으면 관리자 콘솔에서 App Password 사용이 막혀 있거나 Advanced Protection이 켜져 있을 수 있습니다.

Gmail SMTP 기준:

```text
Host: Gmail SMTP host
Port: 465
Secure: true
User: 발송 계정 이메일
Pass: Google App Password
```

Gmail/Google Workspace에는 발송량 제한이 있습니다. 문의 폼 알림처럼 낮은 빈도의 운영 메일에는 적합하지만, 대량 메일이나 마케팅 메일 발송용으로 쓰면 제한에 걸릴 수 있습니다.

## 6. Firebase의 `nero-web` 경로

문의 폼 이메일 발송에는 Firebase가 필요하지 않습니다.

Firebase는 이미지, 관리자용 데이터, 별도 백엔드 데이터를 저장할 때만 사용합니다.

현재 기준:

```text
Cloud Storage: nero-web/images/{file}
Cloud Storage backend-only: nero-web/backend/{file}
Cloud Firestore database: nero-web-db
Cloud Firestore asset metadata path: nero-web/assets/items/{autoId}
```

`nero-web-db`는 Cloud Firestore database ID이고, `nero-web`은 Firestore collection 또는 Storage path 이름입니다. 서로 달라도 괜찮습니다.

Firebase Console 기준 생성:

1. Firebase Console에서 프로젝트 선택
2. `Build` → `Firestore Database`
3. database ID가 `nero-web-db`인지 확인
4. `Start collection`
5. Collection ID: `nero-web`
6. 문서 ID는 자동 생성 또는 `assets`
7. 이미지 메타데이터를 쓸 경우 하위 collection으로 `items` 생성
8. `Build` → `Storage`
9. `nero-web/images/` 경로에 공개 이미지 업로드
10. `nero-web/backend/` 경로는 클라이언트 공개용으로 쓰지 않음

Rules 배포가 필요하면 Firebase CLI를 사용합니다.

```bash
npx firebase-tools login
npx firebase-tools use your-firebase-project-id
npx firebase-tools deploy --only firestore:rules,storage
```

이 저장소의 rules 파일:

```text
firebase/firestore.rules
firebase/storage.rules
```

기본 정책:

- Firestore `nero-web/**`: 클라이언트 직접 read/write 차단
- Storage `nero-web/images/**`: 공개 read 허용
- Storage `nero-web/images/**`: 로그인 사용자만 이미지 write 가능
- Storage `nero-web/backend/**`: 클라이언트 직접 read/write 차단
