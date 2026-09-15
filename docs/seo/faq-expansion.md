# 기존 FAQ 섹션의 발주 질문 보강

2026-09-15 내부 기록. 공개 파일에 포함하지 않는다.

## 구현 전 계획과 근거

- 시작 HEAD `3aa03fb`, 작업 트리 깨끗함. 기존 AGENTS.md 없음.
- 사용자가 기존 FAQ 섹션 보강을 선택했다. 홈 `/#faq`, landing `/landing#faq`의 기존 디자인·details/summary·메뉴·URL·문의·분석은 유지하고 FAQ 내용 추가를 허용한 것으로 적용한다. 추가 질문만큼 섹션 높이는 늘어난다.
- 현재 질문 7개를 보존하고 발주 의도에 대한 질문 10개를 추가한다. 기존 home/landing의 동일한 FAQ 배열 구조를 유지하고 두 배열과 최초 HTML의 일치를 테스트한다. 새 의존성·공개 파일·페이지·메뉴·배포 플러그인은 만들지 않는다.
- 데이터 근거는 기존 공개 서비스/포트폴리오와 소유자 확인이다. 실제 검색량·Search Console·상담 원자료는 확보하지 않았으므로 인기 순위·자주 접수된 문의로 단정하지 않는다.
- 사전 렌더링과 브라우저가 같은 기존 배열을 사용한다. 검색용 숨은 답변을 따로 만들지 않는다.
- 기존 JSON-LD의 회사·개발 범위는 유지한다. FAQPage rich result를 위한 마크업은 추가하지 않는다. Google은 2026-05-07부터 FAQ rich result 표시를 종료하고 6월에 문서를 제거했다. 일반적인 FAQ 본문 자체는 고객의 질문에 답하기 위해 제공한다. [Google 공식 변경 기록](https://developers.google.com/search/updates#june-2026)
- 기존 소스 해시 검사는 새로 추가된 FAQ 항목만 제거한 결과가 원본 `9e30d40`의 HTML 해시와 일치하는지 검사하도록 조정한다. FAQ 외 변경을 허용하거나 기준 전체를 새 해시로 교체하지 않는다.

## 신규 답변별 사실 근거

| 주제 | 근거 | 한계 |
|---|---|---|
| 1인창업가 앱제작 | 사용자 요청 + 기존 processSteps, 예비창업자 packages, 서비스 범위 | 혼자 창업한 고객의 실제 수주·성과 주장 없음 |
| 정부지원사업·모두의창업 | 기존 Grant-ready MVP 패키지, 사용자 개발 상담 가능 확인 | 모두의창업 미수행 확인 유지; 선정·사업비 집행 가능성 보장 없음 |
| MVP 범위 | services.mvp includes/outputs | 전체 기능 자동 포함·확정 가격/납기 아님 |
| 앱·서버·관리자·스토어 | services.app 및 whyNero | 승인/심사 기간 보장 없음 |
| 견적·일정 결정 | processSteps, deliverables, whyNero | 미확인 숫자·신규 가격 추가 없음 |
| 소스·문서·계정 인수인계 | 기존 comparison, deliverables, whyNero | 법적 소유권 자동 이전·모든 계정 일괄 이전 주장 없음 |
| 공개 사례 | portfolio의 Nero 플랫폼, 소살리토, Softie 기존 설명 | 역할 확대·매출·사용자 수·고객 평가·새 프로젝트 추가 없음 |
| 사주앱 | 소유자의 상담 가능 확인 + 기존 회원/결제/콘텐츠/알림/관리자/앱 범위 | 사주앱 납품·운세 정확도 주장 없음 |
| 디지털노마드 | 소유자의 상담 가능 확인 + Growth Service Build·회원/결제/관리자 | 수익·해외 운영/비자 지원 주장 없음 |
| 상담 준비 | processSteps + featureCategories의 preparation + 기존 폼 | 새 개인정보 수집 항목 없음 |

## 검증·운영·롤백

- `npm run check`: 통과. 별도 lint/typecheck 스크립트 없음.
- `npm test`: build 및 **56/56 통과**. 최초 실행은 별도의 브라우저 부작용 차단 테스트가 FAQ 추가 전 전체 본문 해시를 비교해 1개 실패했다. 해당 검사의 목적에 맞게 현재 원본의 렌더 결과와 부작용 주입 결과를 비교하도록 수정한 뒤 전체 재실행으로 통과했다. 원본 보존 검사는 별도로 기존 해시를 유지한다.
- `npm run test:browser`: **32/32 통과, 52.7초**. 모바일 390×844·데스크톱 1440×1000, FAQ 17개, Enter/Space 접기·펼치기, 답변 표시, 기존 open_faq 이벤트, 가로 넘침, 기존 6개 화면/링크/레이아웃/추가 접근성 위반 없음, JS 비활성 HTML, 문의 성공·실패·중복 제출, 공고 기능 확인. 문의·외부 리소스는 대역이며 실제 메일은 보내지 않았다.
- `npm run test:robots`: **1/1 통과**. Python SEO audit 단위 검사는 이번 차수에서 재실행하지 않았다.
- HTML 데이터 검사: home/landing 17개 질문·답변이 각각 브라우저 소스 배열과 동일하고, 서로 동일함. 기존 7개 문답을 포함한 나머지 전체 HTML은 추가한 10개 details 블록만 제거하면 `9e30d40` 원본 해시와 일치한다.
- 공개 URL 6개·파일 50개 유지, robots TXT·sitemap XML·없는 주소 404·내부 파일 제외·검색봇별 동일 HTML 및 canonical 검사 통과. 새 FAQ 파일이나 메뉴 링크 없음.
- `git diff --exit-code 3aa03fb -- pages css assets components data netlify content scripts/analytics.js scripts/about.js scripts/overview.js scripts/announcement.js scripts/components.js scripts/scripts.js scripts/build.mjs scripts/seo-render.mjs`: 차이 없음. `git diff --check` 통과.

변경 파일: `scripts/home.js`, `scripts/landing.js`의 FAQ 배열, `tests/prerender.test.mjs`, `tests/seo.test.mjs`, `tests/browser.spec.cjs` 및 내부 작업 기록 `docs/seo/faq-expansion.md`, `facts.md`, `owner-todo.md`, `completion-report.md`.

운영 배포·검색엔진 제출·실제 문의 전송은 하지 않았다. 실제 검색 인용·순위·고객 유입과 새 FAQ의 운영 반영은 미검증이다. 소유자가 기존 Netlify 흐름으로 배포 후 홈/landing FAQ의 초기 HTML과 펼친 답변을 확인하고 실제 인용·유입·문의로 효과를 평가한다.

롤백은 이번 diff의 home/landing 추가 FAQ 10개 및 관련 테스트만 되돌린다. 이번 변경 전 기준은 `3aa03fb`이며 기존 SEO·Netlify 배포 설정은 유지한다.
