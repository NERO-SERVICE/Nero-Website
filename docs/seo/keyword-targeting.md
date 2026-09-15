# 추가 검색어 반영과 화면 보존

2026-09-15 내부 작업 기록. 이 파일은 공개 빌드에 포함하지 않는다.

후속 사용자 확인으로 모두의창업 준비자·사주앱·디지털노마드를 개발 상담 대상으로 `/landing` 검색·공유 설명문에 반영했다. 아래 보류 판단과 검증 수치는 이전 단계 기록이다. 현재 범위·근거·검증·롤백은 [서비스 대상 후속 반영](service-context-update.md)을 우선한다. 수행 실적이나 공식 제휴를 새로 확인한 것은 아니다.

## 구현 전 확인과 계획

- 상위 디렉터리와 저장소에 적용할 `AGENTS.md`가 없음을 확인했다. 기존 SEO·환경설정 작업은 미커밋 상태이며 그대로 보존한다.
- 기준 커밋은 `9e30d40`이다. 기존 HTML, CSS, 이미지, 컴포넌트, 데이터, 브라우저 JS, 문의 Functions는 이 커밋과 차이가 없다.
- 프레임워크 이전 없이 기존 정적 HTML/JS를 `scripts/build.mjs`로 사전 렌더링한다. Netlify는 `npm run build`의 `dist/`를 게시한다. 기존 공개 URL 6개, 제목, 화면 본문, 링크, 문의·분석, canonical·robots·sitemap 정책을 유지한다.
- 수정 범위는 `content/site.mjs`의 홈·landing·회사소개 description과 공통 개발 Service 설명이다. 기존 생성기가 description을 meta description, OG description, WebPage JSON-LD에 일관되게 사용한다. 브라우저 소스·화면·title은 수정하지 않는다.
- 기존 HTTP·UI 비교 검사를 재실행하고, 실제 배포 HTML에서 검색어의 본문 근거와 미확인 분야 비노출을 확인하는 회귀 검사를 보완한다. 운영 배포·등록·검색엔진 제출·문의 실제 전송은 하지 않는다.

## 요청 검색어별 처리

| 검색어 | 기존 공개 근거 | 작업 범위 |
|---|---|---|
| 앱외주개발·앱개발 | `scripts/home.js:739`~`:741`, `scripts/landing.js:686`~`:688` | 홈 description에 앱외주개발과 실제 개발 범위를 자연스럽게 요약 |
| iOS앱 | home/landing JS `:176`~`:181`의 iOS·Android 서비스, `:527`의 앱 배포 FAQ | 홈 description과 기존 Service에 iOS·Android 앱개발 명시. 문장에서는 읽기 쉬운 띄어쓰기를 사용 |
| 정부지원사업 | `scripts/about.js:21`의 2025 예비창업패키지 수료·중소벤처기업부 창업사업화 지원사업 | 회사소개 description에서 기존 수료 연혁 요약. 정부 지정 수행사·지원금 집행 자격·선정 보장을 주장하지 않음 |
| 지원사업용 MVP | home/landing JS `:119`의 지원사업·초기 검증용 MVP | landing description에 기존 예비창업자 대상 범위를 요약. 특정 사업 참여 이력과 구분 |
| 모두의창업 | 본문에 없음. 사용자가 실제 수행하지 않았다고 확인 | 미반영. 특정 사업의 수행·제휴 관계나 전문성을 추가하지 않음 |
| 사주앱 | 기존 공개 본문에 관련 사례·서비스 설명 없음 | 근거 확인 전 보류. 현재 공개 자료 유무를 사용자에게 질문함 |
| 디지털노마드 | 기존 공개 본문에 관련 서비스·업무 방식 설명 없음 | 근거 확인 전 보류. 현재 공개 자료 유무를 사용자에게 질문함 |

위 근거는 회사 자체 공개 설명이다. 계약·기관 선정·납품 성과를 독립적으로 검증했다는 뜻은 아니다. `/services`는 Nero CARE 소개로 유지하며 일반 외주개발 메타데이터를 주입하지 않는다. `/overview`, `/announcement`에도 관련 없는 검색어를 추가하지 않는다.

## 공식 근거와 적용 한계

- Google은 `meta keywords`를 색인·순위에 사용하지 않는다. [지원하는 메타 태그](https://developers.google.com/search/docs/crawling-indexing/special-tags)
- description은 실제 페이지를 요약해야 하며 검색 스니펫으로 선택될 수 있다. 키워드 나열은 명확한 요약을 제공하지 못한다. [스니펫·설명문 안내](https://developers.google.com/search/docs/appearance/snippet)
- 구조화 데이터는 사용자가 보는 내용과 일치해야 하고 무관한 내용·잘못된 제휴 관계를 표현해서는 안 된다. [구조화 데이터 지침](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

위 공식 문서는 이번 작업에서 직접 조회했다. 숨은 본문, 봇별 문구, 새 페이지·링크, FAQ·리뷰·기관 관계·키워드 배열은 추가하지 않는다. 정확한 붙여쓰기 검색어를 모두 반복하는 것은 목표가 아니다. 검색 결과·AI 인용에 표시할 문구는 각 서비스가 선택하므로 적용만으로 노출·순위·추천을 보장하지 않는다.

## 보류 항목의 후속 작업

- 모두의창업: 실제 수행 이력이 없다는 확인을 유지한다. 현재 페이지에 없는 해당 사업 설명을 메타데이터만으로 추가하지 않는다.
- 사주앱·디지털노마드: 기존 공개 자료가 있다면 URL·실제 역할·공개 가능 범위를 확인한다. 외부 자료만 있고 현재 본문에 대응하는 설명이 없다면 이번 화면 보존 범위에서는 적용하지 않는다.
- 소유자 운영 점검: production 배포 후 최초 HTML과 robots·sitemap을 먼저 확인하고, Search Console의 검색어별 실제 노출과 회사명을 주지 않은 AI 웹 검색의 도메인 인용을 따로 기록한다. 키워드 추가 완료와 검색 노출 확인을 구분한다.

## 이번 변경만 롤백할 때

기존 SEO·환경설정 변경은 보존하고 `content/site.mjs`의 아래 값만 되돌린 뒤 다시 빌드한다. 화면 원본이나 Netlify publish 경로를 되돌릴 필요는 없다.

- 홈 description: `외주개발·앱개발 파트너 NERO. 사용자 화면부터 서버·DB·API·관리자까지 풀스택 개발과 배포·유지보수·인수인계를 지원합니다.`
- landing description: `연구자·창업자·기업을 위한 웹·앱 외주개발. MVP/PoC, 관리자, 서버·DB·API, 앱 배포까지 프로젝트 범위와 산출물을 확인하고 상담하세요.`
- about description: `NERO의 회사 소개와 공개 연혁, 회사 연락처를 확인하세요.`
- Service serviceType: `웹사이트·앱개발 및 풀스택 개발`
- Service description: `사용자 화면, 서버·DB·API, 관리자 페이지의 풀스택 개발부터 배포·유지보수·인수인계까지 지원합니다.`

검사는 롤백한 설명의 범위에 맞게 함께 조정한다. 이번 작업과 관련 없는 미커밋 파일이나 사용자 자료를 일괄 복원·삭제하지 않는다.

## 검증 결과

| 실행한 검사 | 결과 |
|---|---|
| `npm run check`, `npm run ga4:check` | 모두 통과. Node 22.18.0 |
| `npm test` | build 및 Node 47/47 통과. 최초 샌드박스 실행은 로컬 포트의 `EPERM`으로 HTTP 검사 20개가 시작되지 못했고, 허용된 환경에서 전체 재실행 후 통과 |
| `npm run test:seo-audit` | Python 단위 검사 9/9 통과 |
| `npm run test:robots` | robots 정책 검사 1/1 통과 |
| `npm run test:browser` | 28/28 통과, 48.4초. 모바일·데스크톱 6개 페이지의 본문·링크·레이아웃 비교, JS 비활성 HTML 검사, 문의 대역 성공·실패·중복 클릭, 공고 기능 포함 |
| 기존 소스 비교 | `git diff --exit-code 9e30d40 --`로 pages·css·assets·components·data·기존 브라우저 JS·문의 Functions 차이 없음 확인 |
| HTTP·공개 산출물 | 위 Node 검사에서 6개 URL 직접 GET, meta·OG·WebPage 설명 일치, Service와 본문 근거, robots TXT·sitemap XML, 실제 404, 비공개 경로와 불필요한 키워드 비노출 확인. 공개 파일 50개·sitemap URL 6개 유지 |
| 접근성 회귀 | 위 브라우저 검사에서 기존 axe 위반 대비 추가 위반 없음. 기존 위반 해소나 전체 적합성 인증이 아님 |
| `git diff --check` | 통과 |

실제 코드 변경은 `content/site.mjs`와 `tests/seo.test.mjs`다. 내부 문서 `keyword-targeting.md`, `facts.md`, `completion-report.md`, `owner-todo.md`도 갱신했다. 메타데이터가 바뀐 URL은 `/`, `/landing`, `/about`이며 새 URL·메뉴·링크는 없다.

별도 lint/typecheck 스크립트는 없어 실행하지 않았다. 브라우저의 외부 CDN·폰트·Spline·GA 요청과 문의 API는 대역 처리했다. 실제 SMTP·Netlify 운영 배포·검색엔진 등록/제출·색인·AI 추천은 실행·검증하지 않았다. 원래 `/overview`, `/services`의 H1 부재와 기존 접근성 문제는 유지했다. 앞선 전체 HTTP 감사 파일은 이번에 재생성하지 않았으며 새 설명문과 경로 응답은 위 Node HTTP 검사로 확인했다.

사주앱·디지털노마드 공개 근거에 대한 추가 답변은 이 검증 시점까지 도착하지 않았다. 미확인 근거가 있다고 가정하지 않고 기존 공개 본문으로 뒷받침되는 범위만 적용했다.
