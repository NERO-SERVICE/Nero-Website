# Netlify 환경변수와 소유자 실행 절차

이 문서는 내부 운영 안내다. 환경변수의 실제 값은 포함하지 않으며 공개 빌드·sitemap에 넣지 않는다. 로컬 최종 검사는 완료했지만 실제 Netlify 설정·운영 배포·검색엔진 소유권 확인·메일 수신은 이 문서의 완료 항목이 아니다. 상세 실행 결과는 `completion-report.md`에 기록한다.

## 현재 저장소 설정

| 항목 | 코드의 설정·처리 |
|---|---|
| 빌드·공개 디렉터리 | base `.`, `npm run build`, publish `dist`. Netlify 로컬 플러그인이 빌드 전 publish 경로·빌드 후 공개 파일 검증 |
| 배포 파일 검사 | `npm run deploy:check`. 이미지·CSS까지 명시적 허용 목록 사용, 정적 산출물 50개 유지 |
| Functions 디렉터리 | `netlify/functions` |
| Node | Netlify `NODE_VERSION = "22"`, GitHub Actions Node 22, package engines `>=22` |
| 로컬 Node 관측 | `v22.18.0`. Netlify의 실제 설치 패치는 운영 빌드 로그에서 확인 필요 |
| 공개 페이지 | `/`, `/landing`, `/about`, `/overview`, `/services`, `/announcement`의 기존 6개 |
| 대표 주소 | 모든 context에서 `https://www.nero.ai.kr`로 고정 |
| 프런트엔드·API | 기존 화면·본문·title·링크·문의 API·분석 소스 보존. 로컬 개발 서버의 정적 파일 제공 범위만 보안상 제한 |
| 로컬 `.env` | 기존 11개 키·값 보존, 공개 검증 키 3개만 빈 값으로 추가. 권한 `0600`과 Git ignore 확인. 실제 값은 문서에 복사하지 않음 |

Node.js 공식 목록에서 Node 20은 EOL, Node 22는 LTS로 확인했다. Netlify는 `NODE_VERSION`에 대버전을 지정하면 해당 계열의 최신 버전을 선택할 수 있다고 안내한다. 따라서 `22`를 지정하고 실제 22.x 패치는 배포 로그로 확인한다. 로컬 22.18.0을 최신 패치라고 주장하지 않는다. [Node.js 릴리스 목록](https://nodejs.org/en/about/previous-releases), [Netlify Node 의존성 설정](https://docs.netlify.com/build/configure-builds/manage-dependencies/)

## 값을 어디에 설정하는가

| 분류 | 변수 | 필요 여부·위치 | 공개 여부 |
|---|---|---|---|
| SMTP 인증 | `SMTP_USER`, `SMTP_PASS` | 기존 문의 API의 필수값. 소유자가 Netlify 프로젝트 UI에 개별 등록 | 서버 전용. 공개 파일·로그에 출력하지 않음 |
| SMTP 서버 | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `SMTP_EHLO_DOMAIN` | 실제 사용 중인 제공자 설정을 유지. 필요한 경우만 UI에 등록 | 서버 전용 설정 |
| 수신·발신 | `CONTACT_TO`, `SMTP_FROM` | 선택값. 미설정 시 기존 fallback 유지 | 서버에서 사용. 빌드 메타에 내보내지 않음 |
| Google 확인 | `NERO_GOOGLE_SITE_VERIFICATION` | 실제 발급한 메타 검증 토큰 | 공개 HTML의 `google-site-verification` |
| 네이버 확인 | `NERO_NAVER_SITE_VERIFICATION` | 실제 발급한 메타 검증 토큰 | 공개 HTML의 `naver-site-verification` |
| Bing 확인 | `NERO_BING_SITE_VERIFICATION` | 실제 발급한 메타 검증 토큰 | 공개 HTML의 `msvalidate.01` |
| CLI 자격 증명 | `NETLIFY_AUTH_TOKEN`, 도구용 사이트 ID | 현재 웹·문의 Function에 불필요. 이 사이트 환경변수로 새 등록하지 않음 | 토큰은 비밀. 사이트 ID와 혼동하지 않음 |
| 플랫폼 제공 값 | `CONTEXT`, `SITE_ID` 등 | Netlify 제공 값. 임의로 운영값으로 덮어쓰지 않음 | 환경 전체를 공개하지 않음 |
| Firebase 관련 값 | 기존 로컬 Firebase 설정·자격 증명 | 현재 공개 웹·문의 Function이 사용하지 않아 Netlify 등록 불필요 | 서비스 계정·비공개 키를 공개 빌드에 넣지 않음 |

`CONTACT_TO`가 없으면 `SMTP_USER`를 수신자로 사용한다. `SMTP_FROM`이 없으면 기존 `SMTP_USER` 기반 발신자 값을 사용한다. 메일러는 별도 설정이 없을 때 기존 Gmail 호스트·465 포트·보안 연결 기본값을 사용한다. 이를 다른 제공자의 올바른 설정이라고 가정하거나 TLS 조건을 임의로 낮추지 않는다. 근거는 `netlify/functions/contact.js`와 `_smtp-mailer.js`다.

`.env.example`에는 SMTP 관련 9개 키의 예제가 있다. 위 3개 공개 검증 키는 실제 발급값이 없어 현재 빈 값이며, 검증 메타도 출력하지 않는다.

## SMTP를 Netlify UI에 설정하는 순서

1. 소유자가 해당 프로젝트의 **Project configuration → Environment variables**를 연다. SMTP 필수값과 실제 필요한 옵션만 키별로 추가하거나 기존 값을 확인한다. `.env` 전체 업로드·붙여넣기·import는 하지 않는다. [Netlify 입력 위치](https://docs.netlify.com/build/environment-variables/get-started/)
2. scope 선택 기능이 있으면 SMTP 값에 **Functions**를 포함한다. 이 기능은 Pro 이상 옵션이므로, 선택할 수 없는 플랜에서는 기본 **all scopes**를 그대로 사용한다. 이를 위해 유료 업그레이드를 요구하지 않는다. all scopes 자체가 웹 공개를 뜻하지는 않지만 코드가 비밀 값을 공개 산출물로 직렬화하면 안 된다. [Netlify scopes](https://docs.netlify.com/build/environment-variables/overview/), [Functions 환경변수](https://docs.netlify.com/build/functions/environment-variables/)
3. 운영 SMTP 값은 **Production** context 전용을 권장한다. Deploy Previews·Branch deploys·Local development에 운영 비밀번호를 자동 공유하지 않는다. 다른 context에 발송이 필요하면 승인한 테스트 계정·수신처를 별도로 준비한다. UI의 **Runtime** scope는 Functions와 다른 용도다. [context·scope 구분](https://docs.netlify.com/build/environment-variables/overview/)
4. SMTP 비밀 값은 `netlify.toml`, `package.json`, 프런트엔드나 CI 명령에 직접 넣지 않는다. 특히 `netlify.toml` 환경변수는 Functions 실행 환경에 제공되지 않으므로 SMTP 설정을 그 파일로 옮기지 않는다. [Functions 제한](https://docs.netlify.com/build/functions/environment-variables/)
5. 환경변수 변경은 새 배포에서 적용된다. UI에 저장했다고 현재 배포의 SMTP 동작이 검증되는 것은 아니다. 배포와 실제 수신 확인은 소유자가 진행한다. [배포별 적용](https://docs.netlify.com/build/functions/environment-variables/)

현재 문의 기능에 Firebase나 Netlify 개인 CLI 토큰은 필요하지 않다. Netlify 문서에 일반 `.env` import 기능이 있더라도 이 저장소는 서로 다른 용도의 값이 함께 있으므로 필요한 키만 개별 등록한다.

## 검색엔진 소유권 확인: 공개 토큰 3개만

`build-config.mjs`가 HTML에 반영하도록 허용한 `.env` 키는 위 `NERO_*_SITE_VERIFICATION` 3개뿐이다. 로컬 파일을 파싱하더라도 SMTP·CLI·Firebase 값을 공개 config로 반환하거나 메타에 넣지 않는다. `process.env` 전체를 HTML·JSON에 내보내지 않는다.

1. 소유자가 Google Search Console·네이버 서치어드바이저·Bing Webmaster Tools에서 소유권 검증 수단을 선택한다. DNS와 메타 검증을 혼동하지 않는다. 실제 토큰이 없는 상태는 정상이며 기본값은 메타 미출력이다.
2. 메타 검증을 선택했다면 발급 태그의 **content 값만** 대응하는 키에 입력한다. 전체 `<meta>` 태그, 예시 문자열이나 SMTP 비밀번호를 넣지 않는다.
3. 로컬은 `.env`의 해당 공개 키만 입력한다. 운영은 Netlify UI에 개별 등록하고 scope 선택이 있다면 **Builds**, context는 **Production**을 사용한다. 선택 기능이 없으면 all scopes로 사용할 수 있어 유료 서비스가 필요하지 않다. [빌드 환경변수 scope](https://docs.netlify.com/build/configure-builds/environment-variables/)
4. 빌드 프로세스 환경의 같은 키가 `.env`보다 우선한다. 프로세스 환경에 명시한 빈 값은 로컬 값을 억제하며 공백 값도 출력하지 않는다.
5. 현재 코드는 영문·숫자·밑줄·하이픈 1~256자의 토큰을 받는다. 실제 발급값이 거절되면 임의로 잘라내거나 변환하지 말고 검증 방식과 구현 조건을 확인한다.
6. 소유자가 승인한 production 배포 후 최초 HTML에 정확한 토큰이 있는지 확인하고 각 검색 도구의 소유권 확인을 실행한다. 이 작업은 실제 토큰 발급·UI 등록·검증 클릭을 하지 않았다.

## 배포 context별 정책

`CONTEXT`는 빌드 프로세스에서만 읽으며 `.env`의 값은 사용하지 않는다. Netlify는 `production`, `deploy-preview`, `branch-deploy`, `dev` 등의 context를 제공한다. [Netlify context](https://docs.netlify.com/build/configure-builds/environment-variables/)

| 빌드 context | HTML robots 메타 | X-Robots-Tag | sitemap | canonical·검증 메타 |
|---|---|---|---|---|
| `production` | 공개 페이지 색인 허용 | 비운영 전체 noindex 헤더 없음 | canonical 6개 | 운영 www 주소, 실제 입력한 검증 토큰만 출력 |
| 미설정·빈 값 | 로컬 기본 production 형태 | 비운영 전체 noindex 헤더 없음 | canonical 6개 | 운영 형태를 로컬에서 검토하는 용도 |
| `deploy-preview`, `branch-deploy`, `dev`, 기타 비어 있지 않은 값 | `noindex, follow` | `noindex, follow` | 유효한 빈 XML urlset | 운영 www canonical 유지, 검증 메타 출력 안 함 |

robots.txt의 기존 비공개 경로 정책은 유지한다. 비운영 noindex는 비밀 자료의 인증·접근 제어를 대신하지 않으므로 `.env`, 내부 문서·테스트·함수 원본을 공개 산출물에 넣지 않는다.

context는 **빌드할 때** 적용한다. 서버를 시작할 때만 값을 바꿔도 이미 생성된 HTML·sitemap은 변하지 않는다. 기본 로컬 산출물을 임의의 검토 호스트에 올렸다고 비운영 정책이 자동 추가되지 않으므로 실제 배포 context와 산출물을 확인해야 한다.

## 소유자의 배포 전후 실행 순서

1. 최신 `completion-report.md`의 검증 결과·한계를 검토한다. 최종 코드 기준 Node 59/59, 브라우저 28/28, Python 9/9, robots 1/1과 check·GA4·deploy:check 통과가 보고되었다. production·branch-deploy·deploy-preview의 별도 임시 빌드·HTTP 검증도 포함한다. 운영 Netlify 검증을 대신하지 않는다. [공개 파일 경계와 배포 절차](deployment-boundary.md)의 새 빌드 파일을 함께 포함하고 저장소 루트 수동 업로드를 피한다.
2. Netlify build·publish·Functions·Node 22 설정을 위 표와 대조한다. UI에 SMTP와 실제 공개 검증 토큰만 개별 설정한다.
3. 검토 배포를 소유자가 선택한다면 noindex 메타·헤더, 빈 sitemap, 운영 canonical을 확인한다. 운영 문의를 실제 발송하지 않는다.
4. production 배포 시점은 소유자가 결정한다. 이 작업은 배포·push·DNS 변경을 하지 않는다. 자동 배포에 연결된 브랜치 push도 배포를 일으킬 수 있다.
5. production 배포 후 기존 6개 URL을 직접 GET해 200, 원래 title·본문, description·canonical·og:url, 운영 noindex 부재와 필요한 검증 메타를 대조한다.
6. robots TXT, sitemap XML·6개 canonical, 임의 없는 URL의 404와 `.env`·docs·seo-kit·함수 원본·테스트 비노출을 확인한다. CDN·호스트·HTTPS·리다이렉트는 운영에서 재검증한다.
7. 소유권 확인 후 운영 sitemap을 세 검색엔진에 제출한다. 검색·학습봇 정책을 무작정 해제하지 않는다. 제출·색인·검색 순위·AI 추천은 별개의 결과이며 즉시 반영을 보장하지 않는다.
8. 별도 승인한 문의로 실제 메일 수신과 원래 GA4 수집을 확인한다. 성공 화면만으로 실제 수신·전환 설정을 완료했다고 판단하지 않는다.

## 로컬 검토와 실제 발송 구분

다음은 로컬 산출물 검토용 명령이며 배포 명령이 아니다.

```sh
npm run build
npm run preview
```

비운영 산출물을 검토하려면 빌드 시 context를 지정한다.

```sh
CONTEXT=deploy-preview npm run build
npm run preview
```

운영 형태로 돌아가려면 다시 빌드한다.

```sh
CONTEXT=production npm run build
```

`npm run preview`는 `dist/`를 제공하고 문의 API를 차단한다. `npm run dev`는 정적 파일 허용 목록을 적용하지만 **기존 문의 Function 실행은 유지**하므로 SMTP 값이 있으면 실제 발송할 수 있다. `npm run netlify:dev`도 Functions를 실행할 수 있다. 화면 확인에는 production preview와 HTTP 대역 테스트를 사용한다.

## 확인된 사항과 미검증

문서 작성 중 직접 확인한 것은 `.env` 권한 600·Git ignore, 로컬 Node 22.18.0, 공개 검증 키·context 분기·정적 파일 허용 목록과 공식 문서다. `.env` 비밀 값은 문서에 옮기지 않았다. 최종 테스트 결과는 작업 담당자의 실행 결과를 반영했으며, `dist` 50개 파일에서 지정한 비밀 값 3개의 누출이 없음을 확인했다는 보고를 포함한다. 실제 Netlify UI 설정·빌드 패치·공개 토큰 발급·SMTP 인증·수신·검색 등록·색인은 미실행·미검증이다. 문의 브라우저 검사는 HTTP 대역이며 실제 API SMTP·입력 검증을 실행한 것으로 해석하지 않는다.

## 롤백

검토한 커밋 단위로 build·Netlify·context·검사 설정을 함께 되돌린다. 로컬 `.env`의 기존 비밀 값을 삭제·복사하지 않고 0600·ignore·비공개 파일 HTTP 차단을 유지한다. 공개 디렉터리만 저장소 루트로 되돌려 내부 자료가 있는 폴더를 배포하지 않는다.

Netlify UI 환경변수는 Git revert로 되돌아가지 않는다. 소유자가 키별·context별 변경 내역을 확인하고 필요한 값만 복원한 뒤 새 배포에서 확인한다. 이전 검증된 배포로 롤백하더라도 그 환경 설정과 문의 동작을 재확인한다. 사용자 `seo-kit/`과 이후 변경은 롤백 대상에서 제외한다.
