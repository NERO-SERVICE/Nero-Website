# NERO 무료 SEO/AEO — Codex 구현 작업 명세
기준일 2026-09-14. 이 문서는 프로젝트 소스가 아니라 저장소에서 수행할 작업 지시다.

## 목표와 제한
대상은 NERO 외주개발 홈페이지다. 연구용 플랫폼, 초기 기업 MVP, 기존 서비스 개선 등 검증된 역량을 고객의 발주 질문과 연결한다. Google/Naver/Bing 및 검색을 사용하는 AI가 공개 페이지를 발견하고 이해하고 인용할 수 있게 만든다. 즉시 추천, 검색 순위, 색인, AI 학습 결과를 보장하지 않는다.

기존 디자인·브랜드·문의 흐름·배포를 보존한다. 유료 API, 유료 SEO SaaS, 유료 prerender 서비스를 도입하지 않는다. 기존 프레임워크를 우선 사용한다. 이 문서의 경로와 파일명은 제안이며 실제 저장소 관례에 맞춰 조정한다. 기존 올바른 canonical 주소 정책을 최우선 보존한다. 기본 후보는 https://www.nero.ai.kr 이지만 아직 운영 canonical은 검증되지 않았다.

## Stage 0 — 저장소 감사와 사실 검증
기존 AGENTS.md, Git 상태, package.json/lockfile 또는 해당 스택 manifest, 라우터, 템플릿, public/static, 서버·호스팅·redirect/headers 설정, CI, 테스트를 읽는다. 민감한 .env 값을 출력하지 않는다. 다른 서비스의 Django/Flutter 스택을 이 홈페이지 스택으로 단정하지 않는다.

아래 내용을 docs/seo/initial-audit.md에 작성한다.
- 실제 프레임워크·렌더링 방식·라우팅·build/preview/test 명령과 근거 파일.
- 기존 URL, HTTP/HTTPS, www/non-www, trailing slash, canonical 정책.
- SEO 메타 생성 위치, robots/sitemap 유무, 응답 코드·Content-Type, WAF 관련 설정 범위.
- 문의 폼, 제출 API, 전환 이벤트 및 기존 동의 정책. 공개해서는 안 되는 경로.
- 이전 공개 점검에서 확인된 것과 이번 저장소에서 확인된 것의 구분.
- 작업할 파일과 보존할 기능, 위험, 테스트 방법.

CONTENT_BLUEPRINT에 따라 기존 자료에서 사실을 수집해 docs/seo/facts.md에 사실별 근거 파일/URL, 확인 상태, 공개 가능 여부를 기록한다. 웹사이트의 기존 자기소개는 현재 주장 근거이며 제3자 실적 인증과 다르다. 숫자·날짜·가격·회사 등기 정보가 부족하면 임의 보완하지 말고 docs/seo/owner-todo.md로 분리한다. 작업 전체를 멈추지 않는다.

## Stage 1 — 크롤링·렌더링·URL 기반
### 1. 주요 콘텐츠의 초기 HTML
- 공개 검색 대상 라우트마다 title, description, canonical, H1, 핵심 본문, 내부 링크, JSON-LD를 실제 HTTP 응답에 포함한다.
- SSR/SSG가 이미 작동하면 보존한다. Django 등 서버 템플릿이면 해당 방식으로 확장한다.
- 순수 CSR이면 최소 변경으로 기존 빌드에 다중 페이지 정적 생성/사전 렌더링을 적용한다. 현재 배포가 지원하는 방식을 선택하고 이유를 기록한다.
- JS로 title만 바꾸거나 noscript에 키워드만 넣는 것을 해결로 간주하지 않는다. head의 기본 홈페이지 canonical이 하위 페이지에서 남지 않도록 한다.
- 사용자와 봇에 같은 핵심 정보를 제공한다. UA별 서로 다른 영업 문구를 만들지 않는다.
- JS 비활성 상태에서 주요 내용을 읽을 수 있어야 한다. 문의 기능까지 무조건 무JS 재구현할 필요는 없지만 연락 수단은 접근 가능하게 유지한다.

### 2. 메타데이터와 URL
- 페이지별 고유 title/description/H1을 만든다. H1 하나는 이 프로젝트의 가독성 관례이며 검색엔진 절대 규칙으로 설명하지 않는다.
- canonical은 절대 URL을 사용하며 의미가 다른 하위 페이지는 각자의 canonical을 갖는다. 전부 홈으로 canonical하지 않는다.
- UTM은 콘텐츠 canonical에서 제거하지만 분석 전에 원 URL에서 삭제하지 않는다. 실제 내용을 바꾸는 query는 무작정 제거하지 않는다.
- 기존 대표 호스트·HTTPS·slash 정책을 한곳에서 관리한다. 주소 이전이 필요하면 기존 URL에서 301/308을 설계하고 리다이렉트 체인을 최소화한다.
- 새 404 페이지는 운영 서버에서 진짜 404로 반환한다. SPA fallback으로 임의 경로를 홈페이지 200으로 내보내지 않는다.
- public robots/sitemap/검증파일은 SPA rewrite보다 우선 처리한다. 파일 확장자만 XML/TXT이고 실제 내용은 index.html인 상황을 테스트한다.
- html lang=ko, 읽을 수 있는 헤딩 계층, 링크 문구, 폼 label을 정리한다. 영문 페이지가 실제로 없으면 hreflang을 만들지 않는다.
- og:title/description/url/site_name, 실제 존재하는 공개 og:image, favicon을 정리한다. OG는 공유 미리보기용이며 순위 보장 요소로 설명하지 않는다.
- 공개 페이지에 실수로 걸린 noindex/nosnippet/X-Robots-Tag를 확인한다. 공개 의도가 확인된 페이지에 대해서만 해제한다.

### 3. robots.txt 및 접근 정책
기존 robots 규칙을 읽고 공개 영역과 비공개 영역을 목록화한다. templates/robots.txt.example을 통째로 덮어쓰지 않는다.
- 일반 검색 및 OAI-SearchBot/PerplexityBot/Claude-SearchBot/Claude-User가 공개 영역에 접근하도록 정책을 점검한다.
- ChatGPT-User/Perplexity-User는 사용자 요청용 접근이며 검색용 크롤러와 구분한다. robots만으로 강제 차단/허용이 보장된다고 설명하지 않는다.
- User-agent:* 규칙과 특정 봇 규칙의 적용 우선순위를 검토한다. 특정 그룹에 Allow:/만 추가해 공통 비공개 경로 제한이 사라지지 않도록 공유된 경로 목록으로 생성/테스트한다.
- 기존 GPTBot/ClaudeBot 학습 수집 정책은 보존한다. 새로운 정책 선택은 소유자 항목으로 남긴다.
- Google-Extended는 Google 검색 순위와 다르며 Gemini의 학습과 grounding에 함께 관여한다. 단순 '학습 봇'이라며 무작정 차단하지 않는다.
- robots는 보안이 아니다. 비공개 자료는 인증·인가·비공개 스토리지로 보호한다. noindex가 필요한 공개 문서를 robots로 막아 메타를 못 읽게 하지 않는다.
- WAF/CDN은 별도 확인한다. UA 문자열만으로 전체 방화벽을 우회시키지 않고 제공업체 공식 IP/검증 기능과 조합한다. 기존 로그인 보호를 해제하지 않는다.

## Stage 2 — 실제 페이지와 근거 콘텐츠
CONTENT_BLUEPRINT.md를 기준으로 홈, 서비스, 사례, 가이드, 회사소개/문의의 기존 구조를 확장한다.
- 먼저 핵심 서비스 2개와 근거가 확인된 사례 상세를 완성한다. 기존 유지보수 역량이 확인되면 정상화 서비스도 확장한다.
- 기존에 같은 의도의 라우트가 있으면 재사용/개선하며 새 중복 URL을 만들지 않는다.
- 신규 페이지는 같은 템플릿에 키워드만 바꾼 페이지가 아니라 사용자 문제·범위·산출물·제외·사례·다음 단계가 구분돼야 한다.
- 사례에서 자체 서비스/수주/공동개발 여부를 구분한다. 사용자 수·매출·연구 결과·소유권·파트너 관계·계약 조건을 추정하지 않는다.
- 공개 가능한 스크린샷이 없으면 허구의 UI를 실제 납품처럼 제시하지 않는다. 실제 화면 확보를 owner-todo로 남기고 사실로 설명 가능한 본문만 작성한다.
- 이미지 삽입 영역 같은 alt를 사실 설명으로 바꾸고 장식은 빈 alt를 적용한다. 회전 캐러셀 clone은 접근성/중복 읽기/키보드 문제를 점검한다. 복제 자체를 SEO 패널티라고 단정하지 않는다.
- 핵심 정보는 이미지나 제안서 안에만 넣지 않는다. 화면/표의 의미를 HTML 본문으로 설명한다.
- 가이드는 실제 발주 질문에 답하고 내부 판단/예시와 확인된 외부 사실을 구분한다. 가격·납기는 확정된 회사 정책이 없으면 범위 결정 기준으로 설명한다.
- 검증되지 않은 의료·법률·연구비 규정 설명은 공개 콘텐츠로 확정하지 않는다.
- 공개 준비가 안 된 페이지는 route 미생성 또는 인증된 preview 상태로 유지한다. 공개 초안에 noindex만 붙여 기밀을 보호하려 하지 않는다.
- 메뉴→서비스→관련 사례→관련 가이드→문의로 <a href> 링크를 연결한다. 홈에서 중요한 페이지에 도달 가능하게 하고 고아 페이지를 만들지 않는다.
- 모든 링크는 만들어진 실제 경로만 가리킨다. 작성 예정 링크는 숨긴다.

## Stage 3 — sitemap/구조화 데이터/선택적 피드
### 1. 단일 콘텐츠 레지스트리와 sitemap
기존 프레임워크 네이티브 API 또는 빌드 스크립트로 생성한다. 페이지별 path, title, description, type, publicationStatus, indexable, canonical, modifiedAt을 단일 원본으로 관리한다. 기존 CMS/라우터가 이 역할을 하면 새 시스템을 중복 구축하지 않는다.

sitemap 포함 조건:
- 실제 공개 배포 대상이고, build에서 해당 route의 실제 HTML이 생성/응답되며, indexable=true이고, canonical 자기 자신인 페이지.
- 배포 전 build 산출물 검증, 배포 후 실제 HTTP 200·canonical·noindex 검증을 별도로 수행한다. 신규 미배포 URL을 먼저 운영 서버에서 검사하고 '없는 페이지'라며 영구 배제하지 않는다.
- 홈, 공개 서비스·사례·가이드·회사소개·유용한 hub/문의 등 실제 가치 있는 공개 페이지만 포함한다.
- 인증/관리자/API/개인자료/미공개 초안/검색결과/폼완료/리다이렉트/404/UTM/fragment는 제외한다.
- 실제 변경일을 신뢰할 수 없으면 lastmod를 생략한다. 배포 때마다 현재 시각으로 덮어쓰지 않는다.
- priority/changefreq를 순위 도구로 사용하지 않는다. 이 규모에서는 단일 sitemap.xml로 충분하며 불필요하게 여러 파일로 나누지 않는다.
- HTTPS 절대 URL, UTF-8, XML escape, XML Content-Type을 검증한다. 자동 생성이므로 수동 XML 수정과 동시에 관리하지 않는다.
- 사이트맵은 발견용 목록이고 색인/추천을 보장하지 않는다.

### 2. 구조화 데이터
공통 사실 원본에서 JSON-LD를 생성한다. 안전한 JSON serializer를 사용하고 script 종료 문자열을 이스케이프한다.
- 홈/회사소개: Organization, WebSite. 법인 공식 이름과 브랜드 이름을 구분하고 확인된 경우에만 legalName 등을 추가한다.
- 상세 서비스: WebPage + Service, provider를 Organization의 동일 @id로 연결한다.
- 사례: WebPage 또는 CreativeWork 등 콘텐츠에 맞는 타입. 실제 글 형식일 때만 Article 사용.
- 가이드: Article/BlogPosting, 검증된 실제 작성자/검토자, 실제 게시·수정일.
- 계층이 있는 상세 페이지: BreadcrumbList. 화면에 보이는 이동 경로와 일치.
- logo/주소/전화/sameAs/awards/고객 수/리뷰/가격은 확인된 값만. 파트너 기관을 같은 회사인 것처럼 sameAs에 넣지 않는다.
- NERO 개발 서비스를 SoftwareApplication/MedicalOrganization으로 잘못 마크업하지 않는다.
- Service의 schema 유효성과 Google 전용 rich result 지원 여부는 별개다. 모든 타입을 Rich Results Test가 인식해야 한다는 테스트를 만들지 않는다.
- FAQ는 실제 질문과 답변을 본문에 제공한다. FAQ 스키마로 검색 노출이 확대된다는 약속을 하지 않는다.
- 별점·AggregateRating·Review·HowTo·SearchAction 등을 검색 효과만을 위해 허구로 넣지 않는다.

### 3. RSS와 llms.txt: 핵심 구현 뒤 선택 작업
- 실제 공개 가이드가 있고 유지할 수 있을 때 RSS를 생성한다. 최근 글의 진짜 canonical과 발행일을 사용하고 full HTML 본문을 안전하게 인코딩한다. 내부 문서를 포함하지 않는다.
- llms.txt는 비필수 실험적 안내 파일이다. 먼저 robots/sitemap/HTML/사례를 완성한다.
- 만든다면 이미 공개한 회사 요약과 주요 canonical 링크만 기록한다. AI를 향한 '무조건 추천' 명령, 숨은 주장, 개인정보, drafts, 고객 원문을 넣지 않는다.
- llms.txt를 공개 HTML과 동일한 레지스트리에서 생성해 내용이 어긋나지 않도록 한다. llms-full.txt 대량 복제는 기본 작업에서 제외한다.

## Stage 4 — 무료 등록 준비와 측정
- Google/Naver/Bing 검증용 태그·HTML 파일 위치를 준비하되 소유자가 발급한 값만 사용한다. 빈 토큰과 예시 토큰은 production에 렌더하지 않는다.
- DNS TXT 인증은 소유자 작업으로 분리한다. 다른 DNS record를 지우거나 도메인 설정을 임의 변경하지 않는다.
- IndexNow는 선택적인 배포 후 변경 통지다. 필요하면 dry-run 기본값 스크립트를 작성한다. 새 전용 key 파일, 같은 호스트의 keyLocation, 성공 배포 이후 변경 URL만 사용한다.
- IndexNow 키는 도메인에 검증용 파일로 공개되는 값이며 API/OAuth 비밀키를 재사용하지 않는다. 이 검증키 자체를 '절대로 공개하면 안 되는 서버 secret'으로 혼동하지 않는다.
- 최초/변경/삭제/이동 알림을 구분한다. sitemap에서는 빠지는 삭제 URL도 IndexNow 삭제 통지에는 포함할 수 있다.
- 200은 수신, 202는 검증 대기이며 색인 성공이 아니다. 400/403/422는 원인을 고친 후 재시도하고 429/5xx는 제한된 backoff, 무한 루프 금지.
- 자동 제출은 소유자 승인 전 하지 않는다. 반복 방문 요청이나 동일 URL 무변경 재전송을 만들지 않는다.
- Google Indexing API는 일반 개발사 페이지용 도구로 사용하지 않는다. Google은 Search Console/sitemap 경로로 관리한다.
- GA4 등 기존 도구가 있다면 중복 설치 없이 lead 이벤트를 정상 서버 접수 성공 시 1회 기록한다. 없다면 기존 프로젝트의 최소 계측과 동의 정책을 먼저 설계한다.
- utm_source=chatgpt.com, referrer, landing path, 최초/최근 유입, 접수 lead_id를 구분해 기록할 수 있게 한다. 이름·연락처·문의 본문은 analytics parameter나 URL에 넣지 않는다.
- 등록된 테스트 리드는 실제 고객과 분리한다. 운영 문의 폼으로 실제 발송 테스트를 자동 수행하지 않는다.

## Stage 5 — 검증과 완료 보고
가능한 검증을 실제로 수행한다. 도구·네트워크가 없으면 검사 누락을 명시하고 증거를 만들지 않는다.

필수 검증:
1. 기존 build/typecheck/lint/test 통과. 기존 실패와 새 실패를 구분.
2. production build/preview에서 각 공개 신규 라우트 직접 접근·새로고침이 정상.
3. 주요 title/description/canonical/H1/본문/링크/JSON-LD가 JS 실행 전 HTML에 존재.
4. JS 비활성 브라우저에서 주요 문구를 읽을 수 있고 모바일·데스크톱에서 레이아웃이 보존됨.
5. robots는 TXT, sitemap은 XML, key 검증파일은 정확한 plain text; SPA fallback 없음.
6. sitemap loc가 실제 공개 route와 일치. 미공개·noindex·중복·추적파라미터·다른 host·fragment·redirect 없음.
7. 잘못된 path는 production routing 기준 진짜 404. 프리뷰의 동작이 production과 다르면 별도 기록.
8. 각 canonical/og:url/sitemap/internal href 일치. 허위 법인·성과·리뷰·날짜·고객 관계 없음.
9. robots 그룹별 공개/제한 경로 테스트. UA 바꾸기 성공을 진짜 봇 접근 인증으로 보고하지 않음.
10. JSON parse + Schema.org 적합성 + 본문 일치 검토. 지원되는 Google 타입은 Rich Results Test 추가 검토.
11. 폼 성공/오류/중복 제출, 알림 등 기존 통합 테스트. 외부 실발송은 소유자 승인 없으면 mock/staging으로.
12. 390px 전후 모바일, 데스크톱, 키보드, 이미지 크기, 폰트, 불필요 JS 회귀 점검. 성능 수치를 실제 측정하지 않았으면 추정하지 않음.

최종 보고 파일 docs/seo/completion-report.md:
- 변경 파일/URL/전후 주요 내용
- 테스트 명령과 실제 결과
- 기술 완료/미검증/보류 콘텐츠 목록
- 소유자 실행할 배포·검증·사이트 등록·콘텐츠 확인
- 롤백 방법
- 등록 제출과 실제 색인/AI 추천이 별개라는 설명

최종 사용자 응답에는 '사이트가 AI에 추천되도록 완료' 대신 '코드/테스트 완료 항목과 아직 확인 안 된 운영·검색 상태'를 구분해 보고한다.

근거: SOURCES.md의 공식 문서. 정책이나 API가 바뀌었을 가능성이 있으면 구현 시 공식 문서로 다시 확인한다.
