# 초기 감사와 현재 구현 범위

이 문서는 내부 작업 기록이며 공개 산출물에 포함하지 않는다. 시작 시 `git status --short`에는 사용자 제공 `seo-kit/`만 미커밋 항목으로 표시되었고, 저장소 및 상위 경로에서 AGENTS.md는 발견되지 않았다. `seo-kit/` 원본은 수정하지 않는다.

## 변경 전 구조

- 별도 앱 프레임워크 없이 HTML/CSS/JavaScript를 사용한다. 서비스·공고 화면 일부는 Bootstrap을 사용한다.
- 홈·상담 랜딩·회사소개·소개서 페이지는 브라우저 JavaScript가 본문과 헤더를 생성한다. JavaScript 실행 전 HTTP HTML에 핵심 본문이 없는 점이 기술 SEO 개선 대상이다.
- Netlify 설정은 저장소 루트를 공개 디렉터리로 사용했고 별도 build 명령이 없었다. 기존 경로는 `/`, `/landing`, `/about`, `/overview`, `/services`, `/announcement`의 6개다.
- 기존 명령은 `npm run check`, `npm run ga4:check`, `npm run dev`이며 별도 build/lint/typecheck/test 명령은 없었다.
- 문의·소개서 요청은 `/.netlify/functions/contact`와 기존 SMTP 메일러를 사용한다. 분석 태그는 `scripts/analytics.js`에 있다. 운영 자격 증명 값은 이 문서에 기록하지 않는다.

## 최초 운영 HTTP 관측

최초 감사 시 읽기 전용 GET으로 `https://www.nero.ai.kr/`의 200 응답과 non-www 주소의 www 리다이렉트를 관측했다. 홈 HTML에는 canonical·og:url이 없었고 `/robots.txt`와 `/sitemap.xml`은 404 HTML이었다. 임의 없는 URL도 실제 404였다. 이 관측은 수정 후 산출물 또는 운영 배포를 검증한 결과가 아니다. CDN·WAF·검색엔진 계정의 비공개 설정과 실제 검색봇 접근은 확인하지 않았다.

## 확정한 구현 경계와 근거

1. 공개 페이지는 기존 6개만 유지한다. 새 서비스·가이드·사례 페이지와 그 연결 링크를 추가하지 않는다. `/overview`도 기존과 같이 색인 대상에 둔다.
2. 기존 프런트엔드·API 소스는 기준 커밋 `9e30d40`과 바이트 단위로 같게 보존한다. 기존 본문, H1, CSS, 접근성 UI, 폼, 알림, 분석 동작은 변경 대상이 아니다.
3. 빌드 단계에서 원래 JavaScript 템플릿을 이용해 HTML을 미리 생성한다. 별도 프레임워크 이전이나 새로운 런타임 템플릿으로 본문을 재작성하지 않는다.
4. 기존 title을 보존하고 head에 페이지별 description·canonical·OG·본문에 맞는 JSON-LD를 생성한다. 대표 호스트는 `https://www.nero.ai.kr`로 통일한다. 회사 정보·실적·날짜를 새로 추정하지 않는다.
5. 실제 발행되는 6개 페이지 목록에서 sitemap을 자동 생성하고 robots를 생성한다. 기존 비공개 경로 제한을 유지하며 특정 검색봇·학습봇에 대한 허용 정책을 임의로 추가하지 않는다.
6. 공개 파일 허용 목록으로 `dist/`를 구성해 `seo-kit/`, `docs/`, 테스트, 함수 소스, 환경 파일 등 내부 자료를 제외한다. 운영 배포·DNS 변경·검색엔진 제출·실제 문의 전송은 실행하지 않는다.

## 원형 보존에 따른 의도적 제한

- 원래 H1이 없는 `/overview`와 `/services`에는 H1을 새로 넣지 않는다.
- 공고의 최초 HTML에는 원래 카드의 요약을 미리 렌더링한다. 전체 본문은 기존 JavaScript 모달로 열며, 새 details UI나 전체 원문을 추가하지 않는다.
- JavaScript 없이 본문 소스를 읽을 수 있게 하는 작업과 JavaScript 비활성 화면의 표시·상호작용 개선은 구분한다. 기존 reveal·loader·CSS의 동작은 유지한다.
- 폼의 중복 제출 방지, API 응답 형식, 전환 이벤트와 접근성 문제의 수정은 현재 범위가 아니다. 발견 사항은 결과와 한계에 기록한다.

## 검증 계획과 실행 기록 연결

기존 소스의 바이트 일치, build·기존 검사, 로컬 preview의 6개 URL·HTML·robots·sitemap·404·내부 자료 비노출과 브라우저 원본 대조를 실행했다. 문의 검증은 실제 API나 SMTP 실행이 아닌 브라우저 HTTP 대역의 성공·실패에 한정했다. 기존 disabled 버튼의 반복 클릭으로 요청 1개를 유지하는 중복 검사도 통과했으며 서버 전체의 중복·멱등성 검사는 아니다. 명령별 통과 수치와 남는 한계는 `completion-report.md` 및 `contact-verification.md`, 실제 HTTP 감사 결과는 `preview-audit.json`에 기록했다. 감사의 검토 항목 2개와 종료 코드 1은 원래 overview/services의 H1 부재를 보존한 결과다.

검색엔진의 발견·수집·색인과 검색 순위·AI 인용·추천은 서로 다른 결과다. 기술 SEO 수정은 순위나 즉시 추천을 보장하지 않는다.

## 환경·검색 추가 보완

후속 요청에 따라 `.env` 용도 구분과 권한·예제, 로컬 개발 서버의 비공개 파일 차단, 빌드 공개값 allowlist와 비운영 noindex, 사실 기반 Service 설명을 추가했다. 현재 변경과 검증 결과는 `completion-report.md`, 환경 설정은 `netlify-environment.md`가 기준이다. 원래 브라우저 파일과 문의 API는 유지하되 로컬 개발 서버는 이 보안 범위에서 변경했다.
