# 검색 추천 후보로 이해될 수 있도록 보강

2026-09-15 내부 기록. 공개 빌드에 포함하지 않는다.

## 변경 전 확인과 계획

- 시작 HEAD `cd30c90`, 작업 트리 깨끗함. 적용할 AGENTS.md 없음. 원본 프론트엔드 기준은 `9e30d40`.
- 현재 정적 HTML/JS, 빌드 사전 렌더링, Netlify `npm run build` → `dist` 흐름을 유지한다. 신규 페이지·링크·화면·title 변경 없음.
- 사용자 요청은 정부지원사업 준비자·1인창업가·앱제작 수요의 개발 상담이다. 정부 공식 수행사·사업 선정·지원금 집행 자격을 주장하지 않는다.
- 홈페이지 검색·공유 설명문에 위 상담 의도를 반영한다. JSON-LD는 기존 본문 요약을 유지한다.
- 기존 본문에 있는 MVP/PoC의 인증·DB/API·시연 데이터·배포 URL, 앱·서버·관리자·스토어 자료·심사 대응을 공통 Service 설명으로 명확히 한다. 공고의 법인명과 기존 footer의 영문명을 Organization에 연결해 동명 회사와 구분할 정보를 보완한다.
- 기존 robots의 wildcard는 OAI-SearchBot 공개 수집을 이미 허용한다. 중복 봇 규칙이나 학습봇 정책 변경은 필요하지 않다. HTTP·robots 해석 검사로 이를 유지한다.
- UI 원본 바이트 비교, 기존 check/build/test, 봇별 최초 HTML·인용 제한·추적 쿼리 canonical 검사 및 운영 읽기 전용 점검을 실행한다. 운영 배포·검색 제출·실제 메일 발송은 하지 않는다.

## 공식 근거와 관찰

- [OpenAI 공식 크롤러 문서](https://developers.openai.com/api/docs/bots): OAI-SearchBot은 검색, GPTBot은 학습 관련이며 설정은 독립적이다. ChatGPT-User 접근 성공은 검색 수집 또는 추천을 증명하지 않는다. 실제 봇 접근은 공식 IP 범위와 서버 로그로 별도 확인해야 한다.
- [Google AI 검색 안내](https://developers.google.com/search/docs/appearance/ai-features): 색인 및 스니펫 표시 자격, 공개 텍스트, 크롤러 접근, 본문과 일치하는 구조화 데이터가 중요하다. 별도 AI 파일이나 전용 스키마는 필수 조건이 아니며 색인·게재를 보장하지 않는다.
- 이 세션 웹 검색에서 `site:nero.ai.kr` 및 브랜드 검색 확인 중 `https://www.nero.ai.kr/`가 결과에 포함됐다. 이는 웹 검색 도구의 발견 결과이며 Google 순위 또는 일반 ChatGPT 추천 답변의 인용 검증이 아니다.
- 운영 `robots.txt`: 200, TXT, 기존 비공개 경로 차단 유지. `sitemap.xml`: 200, XML, 기존 6개 URL.
- 일반 정부지원사업 MVP·1인창업 앱제작 검색의 이번 결과에서는 NERO 추천을 확인하지 못했다. 제한된 검색 표본이며 미색인 확정이나 전체 순위 측정이 아니다.

## 화면 변경 없이 가능한 범위와 다음 우선순위

1. 배포 후 홈페이지와 landing을 Search Console·Bing Webmaster Tools에서 검사하고 기존 sitemap을 제출/확인한다. 소유자가 실행한다.
2. 문의·전환의 GA4 기존 `utm_source`, referrer, `generate_lead`를 이용해 ChatGPT 유입을 확인한다. 수집은 이미 구현돼 있어 새 분석 태그를 설치하지 않는다. 유입이 없는 경우 인용이 없다고 단정하지 않는다.
3. 실제 고객·프로젝트의 공개 가능한 링크, 역할, 산출물, 공개 허가를 정리한다. 향후 본문 변경이 허용될 때 기존 사례에 반영할 근거이며 이번에는 화면에 추가하지 않는다. 합의된 실제 외부 회사 소개·고객 소개 페이지에서 정확한 NERO 이름과 도메인을 연결하는 것도 소유자 실행 항목이다. 유료 링크·가짜 후기·미확인 기관 관계는 사용하지 않는다.
4. 이후 화면 본문 변경을 허용한다면 기존 섹션에서 발주자의 구체 질문에 답한다: MVP 범위를 어떻게 정하는지, 앱·관리자·서버·소스·계정 중 무엇을 인수하는지, 정부지원사업 준비용 개발에서 어떤 산출물까지 상담 가능한지. 법적·정산 규정이나 선정 보장은 확인 없이 쓰지 않는다. 현재는 해당 신규 문구를 배포하지 않는다.
5. 회사명 없는 검색 질문을 같은 조건으로 기록하고 실제 NERO URL 인용·클릭·문의로 평가한다. 예: `정부지원사업 준비용 MVP 외주개발 업체를 찾아줘`, `1인창업가가 회원 결제 관리자 포함 앱제작을 맡길 곳`, `iOS Android 앱과 서버를 함께 개발하는 업체 추천`. 한 번의 결과나 메타 키워드 포함 여부를 순위 성과로 보고하지 않는다.

## 검증·롤백

- `npm run check`: 통과. 별도 lint/typecheck 스크립트 없음.
- `npm test`: build 및 **55/55 통과**. 기존 6개 URL·50개 공개 파일, JSON-LD와 본문 근거, Googlebot/bingbot/OAI-SearchBot/ChatGPT-User별 같은 초기 HTML, noindex/nosnippet/max-snippet:0 부재, ChatGPT UTM canonical 유지, 내부 파일 제외, 404, 환경·배포 경계 포함.
- `npm run test:robots`: **1/1 통과**. 여러 검색·학습·미등록 봇이 기존 공개/비공개 규칙을 그대로 적용받는지 확인. 신규 6개 전체 URL과 검색용 파일·UTM도 검사.
- `npm run test:seo-audit`: 도구 단위 검사 **9/9 통과**.
- `npm run test:browser`: **28/28 통과, 45.6초**. 모바일·데스크톱 기존 화면·본문·링크·레이아웃·추가 접근성 위반 없음, JS 비활성, 문의 3개 화면 성공·실패·중복 클릭 및 공고. 외부 리소스·문의 응답은 대역이며 실제 메일을 보내지 않았다.
- `git diff --exit-code 9e30d40 -- pages css assets components data scripts/home.js scripts/landing.js scripts/about.js scripts/overview.js scripts/announcement.js scripts/components.js scripts/scripts.js scripts/analytics.js netlify/functions`: 차이 없음. `git diff --check` 통과.

운영 읽기 전용 확인: `curl -A OAI-SearchBot`의 `/`, `/landing`은 HTTP 200, 각각 H1 1개·링크 25개와 본문, 자기 canonical, index/follow, X-Robots-Tag 없음. 홈 description은 이전 앱외주개발 문구, landing description은 이전 지원사업/MVP 문구라 이번 코드와 앞선 대상별 문구의 운영 적용을 확인하지 못했다. 운영 배포를 자동 수행하지 않았다. UA 지정 성공은 실제 OpenAI IP 방문이나 WAF 통과를 증명하지 않는다.

운영 Python audit CLI는 샌드박스 DNS 오류 후 권한 환경에서 재실행했지만 로컬 인증서 검증 오류로 실패했다. TLS 검증을 끄지 않고 curl로 위 두 페이지와 robots·sitemap을 확인했다. 운영 전체 6개 페이지·없는 주소의 자동 audit 완료로 보고하지 않는다. 실제 Google 순위·일반 ChatGPT 답변의 자발적 NERO 인용·Search Console 색인·실제 SMTP는 미검증이다.

변경 파일은 `content/site.mjs`, `scripts/seo-render.mjs`, `tests/seo.test.mjs`, `tests/test_robots.py` 및 내부 `docs/seo/search-readiness-update.md`, `facts.md`, `owner-todo.md`, `completion-report.md`다. 홈 메타 설명과 home/landing의 Service, 기존 6개 URL의 Organization 메타데이터만 변경되며 새 URL은 없다.

이번 변경만 되돌릴 때는 `content/site.mjs`, `scripts/seo-render.mjs`, 관련 테스트의 이번 diff를 역적용한다(변경 전 기준 `cd30c90`). 프론트엔드 및 Netlify 배포 설정은 변경하지 않는다. 이후 다른 변경이 있다면 파일 전체 복원 대신 해당 diff만 되돌린다.
