# Netlify 공개 파일 경계 보강

2026-09-15 내부 작업 기록. 이 문서는 `dist/`에 복사하지 않는다.

## 구현 전 확인과 계획

- 적용할 `AGENTS.md`는 없으며 기존 SEO·환경설정의 미커밋 변경은 보존한다. 원래 프론트엔드와 문의 API는 기준 커밋 `9e30d40`과 차이가 없다.
- 현재 Netlify는 `npm run build`, publish `dist`, Functions `netlify/functions`를 사용한다. 내부 MD·seo-kit·환경파일·테스트는 이미 정적 산출물에서 제외되지만, `assets`와 `css`는 확장자 기준이어서 새 내부 이미지·CSS가 자동으로 공개될 수 있다.
- 이미지 23개와 CSS 6개를 명시적 파일 목록으로 고정해 복사와 최종 검증에서 공유한다. 원래 파일 바이트와 6개 페이지의 UI·본문·제목·링크·문의·분석은 유지한다.
- 빌드 입력 경로의 파일과 부모 디렉터리, 공개 산출물 루트의 symlink를 거부한다. 공개 파일 목록 밖의 파일·디렉터리가 산출물에 섞이면 검사에 실패한다.
- Netlify 로컬 빌드 플러그인에서 실제 publish 경로가 저장소의 `dist`인지 빌드 전 확인하고, 빌드 후 공개 파일 검사를 다시 수행한다. 별도 `npm run deploy:check`도 로컬 검사만 수행한다.
- 배포·DNS·검색엔진 등록/제출·실제 문의 발송은 실행하지 않는다. 기존 .env 값과 서버측 문의 Function 의존성은 변경하지 않는다.

## 근거

- Netlify는 publish 디렉터리에 있는 파일만 정적 사이트에 배포하며 Functions는 별도 디렉터리에서 번들링한다. [빌드 설정](https://docs.netlify.com/build/configure-builds/overview/), [Functions 설정](https://docs.netlify.com/build/functions/configuration/)
- 로컬 플러그인은 저장소의 `index.js`와 `manifest.yml`로 정의할 수 있고 `PUBLISH_DIR`, 빌드 이벤트, 빌드 실패 API를 사용할 수 있다. [Netlify 빌드 플러그인](https://docs.netlify.com/extend/develop-and-share/develop-build-plugins/)
- 폴더 드래그 방식의 수동 배포는 빌드 명령을 실행하지 않는다. 저장소 루트를 직접 업로드하면 이 검사 경로를 우회하게 된다. [배포 방식](https://docs.netlify.com/deploy/create-deploys/)

## 검증 결과와 운영 절차

정적 산출물은 기존과 같은 50개다: HTML 6개, 브라우저 JS 8개, 이미지 23개, CSS 6개, 기존 컴포넌트 HTML 2개, 공개 공고 JSON 1개, robots/sitemap 2개, Netlify 라우팅·헤더 설정 2개. 문의 Functions는 정적 산출물 밖에서 기존 방식으로 별도 번들링된다.

제외 대상은 `seo-kit/`, `docs/`, 내부 MD(`CLAUDE.md`, `GOOGLE_ANALYTICS_4.md`, assets 안의 README 포함), `.env*`, `.git/`, `.netlify/`, 테스트·보고서, 빌드용 content/scripts, Netlify 플러그인 소스, 문의 함수 원본, Firebase 설정, package 파일과 미등록 이미지·CSS다. `robots.txt`로만 숨기는 것이 아니라 정적 산출물에 포함하지 않는다.

| 변경 파일 | 역할 |
|---|---|
| `content/public-assets.mjs` | 기존 이미지·CSS의 명시적 공개 목록 |
| `scripts/build.mjs`, `scripts/public-output.mjs` | 목록에 있는 자산만 복사, 입력 경로와 출력 루트의 symlink 거부, 미등록 파일·디렉터리 실패 |
| `scripts/verify-deploy.mjs` | 실제 `dist` 경로와 산출물 독립 검사. 업로드·배포하지 않음 |
| `netlify/plugins/public-deploy/index.js`, `manifest.yml` | Netlify의 onPreBuild/onPostBuild에서 publish 경로·공개 산출물 검증, 실패 시 failBuild 호출 |
| `netlify.toml` | base를 저장소 루트로 명시, publish `dist` 유지, 로컬 플러그인 연결 |
| `package.json`, `.github/workflows/netlify-deploy.yml`, `scripts/check-source.mjs` | deploy:check 명령과 CI·구문 검사 연결 |
| `tests/deploy-guard.test.mjs`, `tests/public-assets.test.mjs`, `tests/deploy-security.test.mjs`, `tests/seo.test.mjs` | 경로·산출물 오염·심링크·원본 자산·내부 URL 비노출 회귀 검사 |
| `docs/seo/deployment-boundary.md`, `completion-report.md`, `owner-todo.md`, `netlify-environment.md` | 내부 운영 안내와 검사 결과 |

생성·수정된 공개 URL은 없다. 기존 6개 페이지·검색 설명문·canonical·JSON-LD·robots·sitemap을 유지한다. 이미 있던 미커밋 SEO/환경설정 파일은 이 작업에서 삭제하거나 원본으로 복원하지 않았다.

실행 결과:

- `npm test`: build 및 Node **59/59 통과**. 임시 저장소에 내부 MD·환경파일·이미지·CSS를 넣은 실제 빌드, 배포 후 산출물 오염에 대한 플러그인 실패, 잘못된 publish 경로, symlink, 비밀 대역 검사 포함.
- `npm run deploy:check`: **50개 공개 파일 통과**. Netlify 업로드를 수행하는 명령이 아니다.
- `npm run check`, `npm run ga4:check`: 통과.
- `npm run test:seo-audit`: Python 9/9 통과. `npm run test:robots`: 1/1 통과.
- `git diff --exit-code 9e30d40 --`로 원래 pages·css·assets·components·data·브라우저 JS·문의 Functions 차이 없음 확인. `git diff --check` 통과.
- HTTP 검사는 위 Node 테스트에 포함된다. 기존 6개 URL 200, meta·본문·링크·JSON-LD, sitemap 6개, robots TXT·sitemap XML, 내부 문서와 없는 URL의 실제 404를 로컬 preview에서 확인했다.

`npm run test:browser`는 **28/28 통과(45.3초)**했다. 모바일·데스크톱의 6개 페이지에서 본문·링크·레이아웃·접근성 회귀를 비교하고 문의 성공·실패·중복 클릭과 공고 동작을 검사했다. 기존 접근성 위반 대비 추가 위반은 없지만 전체 접근성 적합성을 인증한 것은 아니다. 외부 CDN·폰트·Spline·GA와 문의 API는 테스트 대역을 사용했다.

별도 lint/typecheck 스크립트는 없다. Netlify CLI/원격 Build Plugin 로딩·실제 Functions 번들링·운영 CDN·검색엔진 등록/제출·실제 문의 발송은 실행하지 않았다. 플러그인은 공식 인터페이스와 실제 모듈을 호출하는 로컬 fixture 테스트로 검증했으며 Netlify 원격 실행을 검증한 것으로 표현하지 않는다.

## 소유자의 배포 순서

1. 이번에 추가한 빌드 스크립트·자산 목록·플러그인·테스트 파일도 저장소에 포함한다. 아직 커밋·푸시·배포하지 않았다. 기존 환경변수의 실제 값은 커밋하지 않는다.
2. Git 연결 방식의 Netlify 배포에서 build `npm run build`, publish `dist`, Functions `netlify/functions`, Node 22를 사용한다. root `netlify.toml`에 이 설정과 빌드 플러그인이 포함되어 있다.
3. 로컬에서 미리 확인하려면 `npm run build` 다음 `npm run deploy:check`를 실행한다. `dist`를 직접 편집하거나 내부 파일을 복사하지 않는다.
4. 저장소 전체를 Netlify Drop에 드래그하거나 CLI `--dir .`로 업로드하지 않는다. 수동 폴더 업로드는 빌드·플러그인 검사를 실행하지 않으며 문의 Function의 별도 배포도 이 방식으로 확인되지 않는다. 기존 문의 기능까지 유지하는 배포는 Git 연결의 전체 빌드 경로를 사용한다.
5. 소유자가 배포 후 Netlify Deploy File Explorer에서 내부 문서·환경파일·테스트가 없는지 확인하고, 원래 6개 URL·문의 경로·robots·sitemap을 재검사한다. 공개 URL로 내부 자료를 조회하면 404여야 한다.

이 설정은 Netlify 정적 사이트의 공개 경계를 보호한다. Git 저장소 자체의 공개 여부, 이전 배포 산출물, 배포 로그의 접근 권한은 별도로 관리된다. 기존 운영 배포에 내부 자료가 있었는지까지 검사·삭제한 것은 아니다.

## 롤백

운영 문제가 생기면 소유자가 이전에 확인한 안전한 Netlify 배포로 되돌린다. 코드 변경을 롤백할 때에는 이번 빌드 목록·검사·플러그인·설정·테스트 변경을 함께 검토하고 `publish = "dist"`, 기존 내부 파일 제외와 .env 비추적 상태는 유지한다. `dist` 대신 저장소 루트를 게시하는 방식으로 문제를 우회하지 않는다. 이전 SEO·프론트엔드·문의 소스나 사용자 seo-kit 자료를 일괄 삭제하지 않는다.
