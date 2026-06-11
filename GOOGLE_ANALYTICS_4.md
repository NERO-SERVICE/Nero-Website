# NERO Google Analytics 4 Setup

이 문서는 `nero_website`에 적용된 GA4 태그, CTA 이벤트, 페이지 진입/체류 측정, 배포 후 확인 절차를 정리합니다.

## 현재 코드 적용 상태

- 공통 GA4 스크립트: `scripts/analytics.js`
- 모든 정식 라우트 HTML에 공통 스크립트 삽입 완료:
  - `/` -> `pages/home.html`
  - `/landing` -> `pages/landing.html`
  - `/overview` -> `pages/overview.html`
  - `/about` -> `pages/about.html`
  - `/announcement` -> `pages/announcement.html`
  - `/services` -> `pages/services.html`
- 페이지별 CTA 이벤트 함수는 `window.NERO_ANALYTICS.track()`으로 연결되어 공통 파라미터를 함께 보냅니다.
- `package.json`의 `npm run check`에 `scripts/analytics.js` 문법 검사가 포함되어 있습니다.
- `npm run ga4:check`로 실제 배포 전 GA4 측정 ID와 페이지별 태그 삽입 여부를 검증할 수 있습니다.

## GA4 측정 ID 입력

GA4 측정 ID는 비밀번호나 API Key가 아닙니다. 브라우저에서 로드되는 공개 식별자이므로 `.env`, GitHub Secret, Netlify Secret에 숨기는 대상이 아닙니다.

1. Google Analytics에서 `관리`로 이동합니다.
2. `데이터 수집 및 수정` 또는 `속성 설정` 아래의 `데이터 스트림`을 엽니다.
3. `웹` 스트림을 선택합니다.
4. 스트림 상세의 `측정 ID`를 복사합니다.
5. `scripts/analytics.js` 첫 줄을 실제 값으로 바꿉니다.

```js
const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX";
```

예시:

```js
const GA4_MEASUREMENT_ID = "G-ABC123DEF4";
```

Google 공식 문서 기준으로 GA4 측정 ID는 `G-`로 시작하며, 웹사이트와 GA4 웹 데이터 스트림을 연결하는 식별자입니다.

참고:
- https://support.google.com/analytics/answer/12270356
- https://support.google.com/analytics/answer/9539598

## 수집되는 데이터

GA4 기본 `page_view`로 각 페이지의 방문이 수집됩니다.

공통으로 붙는 파라미터:

- `page_path`: 현재 경로와 쿼리
- `page_title`: 문서 제목
- `entry_path`: 세션 최초 진입 경로
- `first_referrer`: 최초 referrer, 없으면 `direct`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid`, `fbclid`
- `debug_mode`: `ga4_debug` 사용 시 true

자동 수집 이벤트:

| 이벤트명 | 의미 |
| --- | --- |
| `nero_page_context` | 페이지 로드 시 NERO 사이트 공통 컨텍스트 확인 |
| `click_cta` | `data-track`가 없는 일반 버튼/링크/summary 클릭 |
| `click_outbound` | 외부 도메인 링크 클릭 |
| `form_submit_attempt` | 폼 제출 시도 |
| `scroll_depth` | 25%, 50%, 75%, 90% 스크롤 도달 |
| `time_on_page` | 15초, 30초, 60초, 120초 체류 도달 |
| `time_on_page_exit` | 페이지 이탈 시 체류 시간 |

페이지별 CTA 이벤트:

| 이벤트명 | 대표 위치 |
| --- | --- |
| `click_hero_diagnosis` | 헤더/히어로/주요 CTA |
| `click_portfolio_view` | 소개서/포트폴리오 CTA |
| `click_package_research` | Research-to-Platform 패키지 |
| `click_package_startup` | Grant-ready MVP 패키지 |
| `click_package_growth` | Growth Service Build 패키지 |
| `click_package_operation` | Operation Care 패키지 |
| `click_service_landing` | 전환형 랜딩·신청 페이지 |
| `click_service_mvp` | 검증형 MVP/PoC |
| `click_service_web` | 운영형 웹서비스 |
| `click_service_app` | iOS·Android 앱서비스 |
| `open_feature_modal` | 기능 컴포넌트 모달 열기 |
| `click_scope_sprint` | Scope/문의 CTA |
| `open_faq` | FAQ 열기 |
| `submit_project_diagnosis` | home/landing 문의 제출 성공 |
| `submit_overview_download` | overview 소개서 다운로드 폼 제출 성공 |
| `click_email_contact` | 이메일 문의 링크 |
| `scroll_50`, `scroll_90` | 기존 페이지 스크롤 이벤트 |

## 추천 Key Event

GA4 관리자에서 다음 이벤트를 Key Event로 지정하는 것을 권장합니다.

- `submit_project_diagnosis`
- `submit_overview_download`
- `click_email_contact`
- `click_hero_diagnosis`

`form_submit_attempt`는 제출 시도 이벤트이므로 전환 성과보다는 폼 오류/이탈 분석용으로 봅니다.

## UTM 운영 규칙

광고, 이메일, 소개서 링크, 파트너 공유 링크는 아래처럼 UTM을 붙입니다.

```text
https://www.nero.ai.kr/?utm_source=naver&utm_medium=cpc&utm_campaign=2026_mvp_lead&utm_content=main_text
https://www.nero.ai.kr/landing?utm_source=instagram&utm_medium=social&utm_campaign=nero_landing&utm_content=bio
https://www.nero.ai.kr/overview?utm_source=email&utm_medium=owned&utm_campaign=company_deck&utm_content=footer_cta
```

권장 규칙:

- `utm_source`: 유입 플랫폼, 예: `naver`, `google`, `instagram`, `email`, `partner`
- `utm_medium`: 유입 방식, 예: `cpc`, `social`, `owned`, `referral`
- `utm_campaign`: 캠페인명, 예: `2026_mvp_lead`
- `utm_content`: 버튼/소재 구분, 예: `hero_cta`, `footer_cta`, `bio`

## 배포 후 즉시 확인 절차

1. `scripts/analytics.js`의 `GA4_MEASUREMENT_ID`를 실제 `G-...` 값으로 바꿉니다.
2. `npm run check`를 실행합니다.
3. `npm run ga4:check`를 실행합니다.
4. Git에 커밋하고 Netlify 배포가 끝날 때까지 기다립니다.
5. 아래 URL처럼 `ga4_debug`를 붙여 접속합니다.

```text
https://www.nero.ai.kr/?ga4_debug=1
https://www.nero.ai.kr/landing?ga4_debug=1
https://www.nero.ai.kr/overview?ga4_debug=1
```

6. GA4에서 `보고서 > 실시간`을 엽니다.
7. GA4에서 `관리 > 데이터 표시 > DebugView`를 엽니다.
8. 각 페이지를 방문하고 CTA를 클릭합니다.
9. `submit_project_diagnosis`, `submit_overview_download` 테스트를 진행합니다.
10. Realtime 또는 DebugView에서 이벤트가 들어오는지 확인합니다.

Google 공식 문서에 따르면 일반 보고서와 탐색 분석은 데이터 처리에 24-48시간이 걸릴 수 있습니다. 배포 직후 검증은 Realtime과 DebugView로 진행합니다.

참고:
- https://support.google.com/analytics/answer/9333790
- https://support.google.com/analytics/answer/7201382

## DebugView 켜는 법

코드에서 다음 중 하나를 사용하면 `debug_mode`가 활성화됩니다.

방법 1. URL에 쿼리 추가:

```text
https://www.nero.ai.kr/landing?ga4_debug=1
```

방법 2. 브라우저 콘솔에서 localStorage 설정:

```js
localStorage.setItem("nero_ga4_debug", "true");
```

해제:

```js
localStorage.removeItem("nero_ga4_debug");
```

## QA 체크리스트

배포 후 아래 항목을 확인합니다.

- 배포 전 `npm run check` 통과
- 배포 전 `npm run ga4:check` 통과
- `/` 접속 시 `page_view`, `nero_page_context` 수집
- `/landing` 접속 시 `page_view`, `nero_page_context` 수집
- `/overview` 접속 시 `page_view`, `nero_page_context` 수집
- `/about` 접속 시 `page_view`, `nero_page_context` 수집
- `/announcement` 접속 시 `page_view`, `nero_page_context` 수집
- `/services` 접속 시 `page_view`, `nero_page_context` 수집
- 헤더 CTA 클릭 시 `click_hero_diagnosis` 또는 `click_cta` 수집
- 패키지 카드 클릭 시 `click_package_*` 수집
- 서비스 카드 클릭 시 `click_service_*` 수집
- FAQ 열기 시 `open_faq` 수집
- 문의 폼 제출 성공 시 `submit_project_diagnosis` 수집
- 소개서 다운로드 폼 제출 성공 시 `submit_overview_download` 수집
- 외부 링크 클릭 시 `click_outbound` 수집
- 25/50/75/90% 스크롤 시 `scroll_depth` 수집
- 15/30/60/120초 체류 시 `time_on_page` 수집

## 운영 주의사항

- GA4 측정 ID를 실제 값으로 바꾸기 전에는 스크립트가 비활성화됩니다.
- Google Tag Manager나 Netlify 플러그인으로 같은 GA4 태그를 추가하면 `page_view`가 중복될 수 있습니다.
- 광고 차단 확장 프로그램이나 브라우저 추적 차단 설정이 있으면 로컬 확인에서 이벤트가 안 보일 수 있습니다.
- 개인정보, 이름, 이메일, 연락처, 문의 내용은 GA4 이벤트 파라미터로 보내지 않습니다.
- 폼 내용은 이메일 백엔드로만 처리하고, GA4에는 폼 출처와 성공 이벤트만 남깁니다.
