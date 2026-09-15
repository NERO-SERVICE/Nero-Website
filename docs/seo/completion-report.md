# SEO 변경 결과와 검증 범위

최신 SMTP_HOST Secret 검사 실패는 `.env.example` 예시값을 빈 값으로 복원해 수정했다. 사용자는 SEO·내부자료 제외 방식 유지를 선택했다. 이 차수의 변경·실제 실행 검사·미검증 항목은 [Secret 검사 수정 기록](secrets-scan-fix.md)에 있다. 아래 전체 회귀 결과와 이번 실행 범위를 구분한다.

기존 6개 공개 URL과 화면·문의·분석 소스를 보존하고, 사전 렌더링·메타데이터·robots·sitemap에 환경변수 분리, 공개 파일 검증, 비운영 색인 차단과 사실 기반 서비스 설명을 보완했다. 아래는 현재 범위에서 실제 확인한 결과다. 운영 배포·DNS 변경·검색엔진 등록/제출·운영 문의 실제 전송은 하지 않았다.

추가 검색어 요청은 홈의 앱외주개발·iOS 앱개발, landing의 지원사업용 MVP, 회사소개의 정부지원사업 수료 연혁을 설명하는 메타데이터로 반영했다. 이후 사용자가 모두의창업 준비자·사주앱·디지털노마드의 개발 상담 가능 범위를 확인해 landing 검색·공유 설명문에 반영했다. 원본 화면과 JSON-LD의 기존 본문 요약은 유지한다. 최신 변경 파일·근거·검사 결과·개별 롤백은 [서비스 대상 후속 반영](service-context-update.md)에 있다. 아래의 이전 작업 검증 결과와 구분한다.

Netlify Deploy Preview 실패 로그에서 추가한 로컬 플러그인의 경로 가정 오류를 확인해 플러그인·중복 검사 명령을 제거했다. GitHub Actions는 구문 검사와 빌드만 실행한다. 빌드 자체의 정확한 공개 파일 목록·비밀값 검사, 정적 산출물 50개와 기존 화면·SEO는 유지한다. [실패 원인·수정 기록](deploy-preview-fix.md), [현재 배포 절차](deployment-boundary.md)를 확인한다.

## 이번 환경·검색 보완

- 비추적 `.env`의 기존 assignment 값은 보존해 SMTP/배포 CLI/별도 Firebase/공개 검증 설정으로 나누고 권한을 `0600`으로 제한했다. `.env.example`에는 빈 자격증명만 둔다. Netlify에 `.env` 전체를 업로드·import하지 않는다.
- SMTP는 기존 함수 환경변수를 그대로 쓴다. 공개 빌드는 검색엔진 소유권 검증 키 3개만 선택해 메타 태그로 출력하며 빈 값은 생략한다. 현재 실제 검증 토큰은 입력하지 않았다.
- 로컬 개발 서버의 `.env`·`.git`·내부 문서·함수 소스 정적 제공 경로를 차단했다. 임시 fixture로만 검증했으며 실제 secret HTTP 본문을 요청하지 않았다.
- 공개 산출물은 50개 파일로 검사한다. 허용되지 않은 파일, symlink, 알려진 비밀키 형식과 제공된 비밀 환경변수 값 유출을 검사하며 오류에 비밀값을 출력하지 않는다. 공고 JSON은 현재 브라우저가 사용하는 공개 필드만 선택한다.
- Netlify production은 6개 sitemap URL, branch/deploy-preview 등 비운영 context는 noindex 메타·HTTP 헤더와 빈 sitemap을 생성한다. canonical·og:url·JSON-LD는 모두 `https://www.nero.ai.kr` 기준을 유지한다. robots 비공개 경로·학습봇 정책은 바꾸지 않았다.
- 홈·landing 설명과 Service JSON-LD에 기존 외주개발·앱개발 범위를 반영했다. 풀스택은 기존 화면·서버·DB·API·관리자·배포 범위의 요약이다. 모두의창업은 미수행 확인을 유지하며 후속 검색 설명에서 준비자 대상 개발 상담만 안내한다. 실적·제휴 관계는 추가하지 않았다.
- Netlify와 CI의 Node 설정을 22로 맞췄다. Node 20은 공식 EOL, 22는 지원 중인 LTS이고 현재 로컬 검증 환경도 22다. [Node 릴리스](https://nodejs.org/en/about/previous-releases), [Netlify Node 설정](https://docs.netlify.com/build/configure-builds/manage-dependencies/)

## 변경 파일

| 대상 | 변경 내용 |
|---|---|
| `content/site.mjs` | 기존 6개 URL 목록, 사실 기반 description·개발 서비스 공통 데이터 |
| `scripts/build.mjs`, `scripts/prerender.mjs`, `scripts/seo-render.mjs` | 원래 JS 템플릿의 빌드 시점 사전 렌더링, 기존 title 보존과 description·canonical·OG·JSON-LD 추가, robots·sitemap 생성, 공개 파일 허용 목록 |
| `scripts/preview.mjs` | `dist/` 공개 허용 파일만 제공, 비운영 noindex 헤더를 반영하는 HTTP 검증 서버. 문의 API 실행 차단 |
| `scripts/build-config.mjs`, `scripts/public-output.mjs` | 공개 환경변수 3개·context 처리, 공고 공개 필드 선택 및 산출물·비밀값 유출 검사 |
| `.env`(비추적), `.env.example`, `scripts/local-dev-server.mjs` | 값 보존·용도 구분·권한 정리, 환경 예제, 로컬 내부 파일 차단 |
| `scripts/check-source.mjs`, `tests/`, `playwright.config.cjs`, `package-lock.json` | 소스·사전 렌더링·HTTP·분석·브라우저 회귀 검사와 개발 의존성 |
| `.github/workflows/netlify-deploy.yml`, `.gitignore`, `netlify.toml`, `package.json` | 빌드·검사·CI 설정, `dist/` 공개 설정, 생성 산출물 제외. 기존 추적 파일에서 변경된 파일은 이 4개와 `.env.example`, `scripts/local-dev-server.mjs` |
| `docs/seo/` | 내부 감사·사실 근거·보류·문의 보존·소유자 항목·검증 보고. 공개 산출물 제외 |

`git diff --exit-code 9e30d40 --`로 `pages/`, `css/`, `components/`, `assets/`, `data/`, 원래 브라우저 런타임 JS 전부와 `netlify/functions/`를 비교한 결과 종료 코드 0이었다. 기준 HEAD는 `9e30d40`이며 기존 프런트엔드·API는 바이트 단위로 같다. 본문·H1·CSS·접근성 UI·문의·알림·분석 소스를 수정하지 않았다.

새 서비스·가이드·사례 페이지, 새 메뉴·연결 영역, 별도 문의 페이지는 만들지 않았다. `seo-kit/`은 시작 전부터 있던 사용자 자료로 보존했다. `dist/`의 생성 파일을 직접 편집하지 않는다.

## 유지·수정한 URL

대표 주소는 `https://www.nero.ai.kr`다. 아래 6개 URL 모두 로컬 production preview 직접 GET에서 200을 확인했으며 전부 색인 대상이다. 운영에 배포되었다는 의미는 아니다.

| 경로 | 유지한 내용 |
|---|---|
| `/` | 원래 홈 본문·H1·문의·메뉴 |
| `/landing` | 원래 상담 랜딩 본문·H1·문의·메뉴 |
| `/about` | 원래 회사소개·연혁·H1·배경·메뉴 |
| `/overview` | 원래 소개서 요청 화면과 폼. H1 없음과 색인 대상 상태 유지 |
| `/services` | 원래 Nero CARE 소개와 스토어 링크. H1 없음 유지 |
| `/announcement` | 원래 카드 요약을 최초 HTML로 제공하고 전체 본문은 기존 JS 모달 사용 |
| `/robots.txt`, `/sitemap.xml` | 자동 생성. TXT/XML 응답 확인, sitemap에는 위 공개 canonical 6개만 포함 |

`/contact`는 생성하지 않고 기존 `/#contact` 흐름을 유지한다. 미완성·비공개·리다이렉트 주소는 sitemap에서 제외한다. 없는 임의 URL은 로컬 preview에서 실제 404를 반환한다.

## 실제 실행한 테스트

| 명령·검사 | 확인한 결과 |
|---|---|
| 기존 프런트엔드·API 원본 비교 | 기준 HEAD `9e30d40`과 차이 없음, `git diff --exit-code` 종료 0 |
| `npm run check` | 통과. 기존 JS/API와 새 빌드·검사 소스의 구문 검사 |
| `npm run ga4:check` | 통과. 기존 GA4 정적 설정 검사 |
| `npm test` | 플러그인 제거 후 Node 22.18.0에서 build 및 Node 테스트 51/51 통과. 배포 설정 1개와 자산 목록·심링크 3개 포함 |
| `npm run build` | GitHub의 간소화된 검사와 동일한 명령으로 6개 페이지·50개 공개 파일 생성 및 검증 통과 |
| 앞선 `npm run test:seo-audit` | Python 9/9 통과. 이번 플러그인 제거에서는 재실행하지 않음 |
| 앞선 `npm run test:robots` | robots 1/1 통과. 이번 플러그인 제거에서는 Node HTTP 검사로 정책 보존 확인 |
| HTTP·HTML·공개 파일 테스트 | 기존 6개 canonical의 200, 메타·본문·원래 H1 수·링크·JSON-LD, sitemap 필터, robots, 별칭·없는 URL·내부 자료 비노출 및 공개 파일 보존 검사 통과. 위 Node 51개에 포함 |
| 환경·배포 경계 | 공개 설정 reader 9개, 로컬 resolver 7개, production/branch/preview 실제 빌드·HTTP 및 산출물 보안 9개 통과. 위 Node 51개에 포함 |
| 앞선 실제 로컬 HTTP 감사 | 6/6 URL 200, sitemap URL 6개, robots TXT, sitemap XML, 없는 URL 404 확인. 검토 항목 2개는 원래 `/overview`·`/services`에 H1이 없는 점만 해당. 추가 검색어 작업에서는 이 감사 파일을 재생성하지 않고 위 Node HTTP 검사를 재실행 |
| 앞선 브라우저 검사 | 28/28 통과(45.3초), 이번 플러그인 제거에서는 재실행하지 않음: 원본 대조 12개, JS 비활성 HTTP·본문 검사 2개, 세 문의 폼 성공·실패 6개, 기존 버튼 중복 클릭 6개, 공고 2개 |
| 추가 중복 제출 검사 | 6/6 통과, 위 브라우저 28개에 포함. 처리 중인 기존 disabled 버튼의 반복 클릭에서 요청 1개를 유지하며 원본·preview가 같음 확인. 서버 중복·멱등성 검사는 아님 |
| 모바일·데스크톱·접근성 회귀 | 1440×1000·390×844에서 JS 초기화 후 원본과 화면 상태를 대조. axe의 기존 위반을 기준으로 추가 위반 0 확인. 전체 접근성 위반 0 또는 적합성 인증을 의미하지 않음 |
| 별도 lint·typecheck | 해당 이름의 스크립트가 없어 실행하지 않음 |
| API 자체 SMTP·입력 검증 단위 검사 | 이번 최종 범위에서는 실행하지 않음. 문의 브라우저 검사는 HTTP 응답 대역만 사용 |
| `git diff --check` | 통과, 종료 코드 0 |

실제 HTTP 감사 명령은 `python3 seo-kit/scripts/audit_public_site.py --base-url http://127.0.0.1:4173 --canonical-origin https://www.nero.ai.kr --delay 0 --output docs/seo/preview-audit.json`이다. 감사기는 H1 검토 항목 때문에 종료 코드 1을 반환했다. 이는 숨긴 실패가 아니라 기존 H1 부재를 보존한 결과이며, 검토 항목이 0이라고 보고하지 않는다. 상세 관측은 `preview-audit.json`에 있다.

브라우저 검사는 외부 CDN·폰트·Spline·GA 요청을 모두 대역 처리했다. 정상 화면 비교는 JS 초기화와 원래 등장 효과가 끝난 이후 상태를 기준으로 한다. 문의의 실제 API·SMTP·운영 분석 서버를 호출하지 않았다. 증거 스크린샷과 접근성 비교 첨부는 로컬 테스트 보고서에 있으며 공개 산출물에는 넣지 않는다.

## 미검증과 남는 제한

- 현재 추적 파일과 산출물에서 기존 주요 자격증명 값의 정확 일치가 없음을 확인했지만 Git 전체 이력·Netlify 계정 환경변수·모든 형태의 비밀값을 검사한 것은 아니다.
- 운영 Netlify 빌드·CDN·리다이렉트·WAF·함수 배포와 원격 CI는 미검증이다. 로컬 결과가 운영 결과를 대신하지 않는다.
- 실제 SMTP 전달·수신과 API 입력 검증, 소개서 전달, GA4 서버 수집·전환 설정, 외부 폰트·CDN·Spline 화면, 실제 검색봇 방문·검색엔진 색인은 미검증이다.
- 수동 스크린리더, 실기기·다른 브라우저, 전체 접근성 적합성, Core Web Vitals와 온라인 구조화 데이터 검사는 실행하지 않았다. 기존 접근성 위반은 수정하지 않았다.
- `/overview`·`/services`의 H1 부재와 공고 전체 본문의 JS 모달 의존을 유지했다.
- 사전 렌더링한 DOM을 원래 JS가 다시 생성하므로 초기 입력값이 재설정되거나 배경 iframe이 다시 요청될 수 있다. 이 초기화 과도 상태를 개선한 것은 아니다.
- 원래 reveal·loader·CSS가 남아 있어 JavaScript를 껐을 때 모든 내용이 시각적으로 표시되는 것은 보장하지 않는다. HTTP HTML의 본문 존재와 정상 초기화 이후 화면 일치를 검증한 범위로 한정한다.
- 문의·API·분석은 원래 코드 그대로다. 새 중복 차단·영속 멱등성·성공 전환 개선을 구현했다고 주장하지 않는다. 검증한 중복 범위는 기존 disabled 버튼의 반복 클릭이며 서버 중복·멱등성 검사는 아니다.
- 회사 주소의 불일치와 기존 가격·응답 시간·실적·기관 관계의 정확성은 소유자 검토 대상이다. 새 사실·후기·가격·납기·저자·날짜를 만들지 않았다.
- 새 서비스·가이드·사례, llms.txt·RSS·IndexNow는 현재 범위에 포함하지 않는다.

## 소유자 작업

`netlify-environment.md`에 SMTP·공개 검증값·불필요한 CLI/Firebase 변수의 구분과 실제 Netlify 설정 절차를 정리했다. 계정 설정과 실제 배포·검색 등록은 소유자가 수행한다. Functions scope를 지원하는 요금제에서만 해당 범위를 선택하며 추가 유료 기능을 요구하지 않는다. 공식 검색 근거와 키워드 판단은 `search-evidence.md`에 있다.

`owner-todo.md`에 최종 diff·검증 결과 검토, 운영 배포, 운영 URL 재검증, 실제 소유권 검증값 적용과 검색엔진 등록/제출, 승인한 실제 문의·분석 확인을 기록했다. 이 운영 항목들을 완료했다고 보고하지 않는다. 검색 순위와 AI 인용·추천을 보장하지 않는다.

## 롤백

소유자가 최종 diff를 검토하고 현재 작업을 독립된 커밋으로 보관한다. 롤백이 필요하면 해당 커밋을 revert하고 build·Netlify publish 경로·생성 라우트·테스트 설정을 함께 대조한다. 이번 `.env` 정리만 되돌릴 때에는 비추적 실제 값을 별도로 안전하게 보관하고 현재 값·권한을 보존한다. `.env.example`을 실제 `.env`에 덮어쓰지 않는다. 로컬 개발 서버의 비공개 파일 차단도 보존한다. 기존 프런트엔드·API 소스에는 변경이 없으므로 새 폼/API 응답의 연동을 되돌리는 절차는 없다.

아직 커밋하지 않은 상태에서는 먼저 diff를 보관하고 이 작업에서 추가·변경한 파일만 되돌린다. 사용자 `seo-kit/`이나 이후 생긴 사용자 변경을 전체 파일 복원·삭제로 덮어쓰지 않는다. 운영 배포 후 긴급 롤백은 소유자가 이전 검증된 Netlify 산출물을 선택한다. 내부 자료가 있는 현재 작업폴더에서 publish만 저장소 루트로 바꿔 재배포하지 않는다. 롤백 후 대표 URL과 문의 경로를 다시 확인한다.
