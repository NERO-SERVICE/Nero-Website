# 소유자가 확인한 개발 상담 대상 반영

2026-09-15. 내부 기록이며 공개 빌드에 포함하지 않는다.

## 변경 전 확인과 계획

- 시작 시 작업 트리는 깨끗하며 기준 HEAD는 `0f9b967`이다. 기존 화면 기준은 `9e30d40`이다.
- 사용자가 모두의창업·사주앱·디지털노마드를 **개발을 도울 수 있는 대상**이라고 명시했다. 이전의 모두의창업 수행 이력 없음 확인은 그대로 유효하다. 상담 가능 범위를 과거 실적이나 공식 관계로 확대하지 않는다.
- 기존 `/landing`의 description과 OG description에 대상 → 개발 필요 → 기존 개발 서비스 관계를 문장으로 반영한다. 원본 본문에는 MVP/PoC, 회원·결제·관리자·서버·배포 범위가 있다.
- JSON-LD는 기존 본문 요약을 유지하도록 별도 `bodyDescription`을 사용한다. 신규 분야의 사례·FAQ·기관 관계를 구조화 데이터에 만들지 않는다.
- 기존 6개 URL, 화면, title, 링크, 문의·분석, Netlify 설정, 공개 파일 허용 목록, robots·sitemap은 유지한다.
- HTTP HTML의 대상별 설명문, 기존 본문과 JSON-LD, URL·배포 경계 및 화면 보존 검사를 실행한다. 운영 배포·검색 제출·실제 메일 전송은 하지 않는다.

## 대상과 관계

| 대상 | 소유자가 확인한 상담 의도 | 주장하지 않는 내용 |
|---|---|---|
| 모두의창업 준비자 | 아이디어 검증용 MVP/PoC 외주개발 | 공식 수행사·제휴·참여 실적·선정 보장·신청 대행 |
| 사주앱 개발 희망자 | 기존 앱·회원·결제·관리자·서버 개발 범위 상담 | 사주앱 납품 이력·운세 정확도·이미 운영 중인 사주 서비스 |
| 디지털노마드 | 웹·앱 사업 구현에 필요한 개발 상담 | 수익 보장·디지털노마드 교육·취업·비자 지원 |

## 근거와 한계

서비스 대상에 대한 근거는 이번 사용자 확인이며 외부 검증된 실적이 아니다. 기술 범위는 기존 `scripts/landing.js`의 서비스·패키지 설명이다. 단순 검색어 나열, 숨은 본문, 봇별 내용, 새 페이지를 추가하지 않는다.

Google은 검색 설명문을 자체 선택하며 본문을 주로 사용한다. 메타 설명만으로 해당 주제에 대한 상세 본문이나 검색 순위 신호를 대체한다고 주장하지 않는다. 현재 화면 보존 조건에서 가능한 설명 개선이며 세 단어 단독 검색이나 AI 추천·인용 여부는 미확인이다.

- [Google 검색 스니펫 지침](https://developers.google.com/search/docs/appearance/snippet)
- [Google 구조화 데이터 지침](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

## 소유자 확인 및 롤백

기존 Netlify 흐름으로 배포한 뒤 `/landing` 최초 HTML의 description과 OG description을 확인한다. 검색엔진 재수집 이후 실제 검색어별 노출과 클릭을 별도로 확인한다. AI 결과는 실제 도메인 인용 여부로 확인하며 배포 성공과 구분한다.

이 변경을 롤백하려면 `/landing` description을 `bodyDescription`의 기존 값으로 복원하고 별도 필드·렌더러 및 해당 검사 변경을 함께 되돌린다. 배포 설정과 프론트엔드 원본은 복원할 필요가 없다.

## 검증

- `npm run check`: 통과. 별도 lint/typecheck 스크립트는 없어 실행했다고 표현하지 않는다.
- `npm test`: production build 및 Node 검사 **53/53 통과**. 6개 URL 초기 HTTP HTML, 신규 검색·공유 설명문, 기존 JSON-LD, canonical, 내부 링크, TXT robots, XML sitemap, 없는 주소와 내부 문서 404, 공개 파일 50개 및 비밀값·환경 경계 포함.
- `npm run test:browser`: **28/28 통과, 46.4초**. 모바일 390×844와 데스크톱 1440×1000의 기존 6개 페이지 본문·링크·레이아웃 비교, 추가 axe 위반 없음, JavaScript 비활성 상태, 문의 3개 화면의 성공·실패·중복 제출, 공고 기능 확인.
- 브라우저 외부 폰트·CDN·분석·임베드는 대역 처리했다. 문의 API 응답도 대역이며 실제 SMTP 발송 또는 운영 Netlify Functions 검증이 아니다.
- `git diff --exit-code 9e30d40 -- pages css assets components data scripts/home.js scripts/landing.js scripts/about.js scripts/overview.js scripts/announcement.js scripts/components.js scripts/scripts.js scripts/analytics.js netlify/functions`: 차이 없음. 화면 원본·문의 Functions·분석 소스 보존.
- `git diff --check`: 통과. Python SEO 도구·robots 단위 검사는 이번 변경에서 재실행하지 않았다.
- 이번 변경의 운영 배포, 검색엔진 색인·검색 순위·AI 인용은 미검증이며 자동 실행하지 않았다.

## 변경 파일

- `content/site.mjs`: `/landing` 검색·공유 설명문 및 기존 본문 요약 분리.
- `scripts/seo-render.mjs`: JSON-LD가 별도 본문 요약을 사용하도록 지원.
- `tests/seo.test.mjs`: 상담 대상 허용 범위와 허위 관계·화면 주입 방지 HTTP 회귀 검사.
- `docs/seo/service-context-update.md`, `facts.md`, `keyword-targeting.md`, `owner-todo.md`, `completion-report.md`: 사용자 확인과 기존 보류 판단의 변경, 계획·결과·운영 항목 기록. 모두 공개 산출물 제외.
