# Deploy Preview 실패 확인과 배포 흐름 단순화

2026-09-15 내부 기록. 공개 빌드에 포함하지 않는다.

## 확인한 사실과 한계

- 작업 시작 시 미커밋 변경은 없었다. 현재 커밋은 `f059556`이며 이전 프론트엔드 기준은 `9e30d40`이다.
- GitHub의 해당 커밋 상태는 `netlify/neroinfo/deploy-preview: failure`다. 실패 배포는 `6aa8c6f6fe41b30008d4c4a9`, PR은 #19다.
- 같은 커밋의 GitHub Actions `Build and verify public website` 실행 2개는 모두 success다. GitHub에 표시된 Netlify 실패 알림과 GitHub Actions 검사 실패는 구분해야 한다.
- Netlify 공개 API는 `state: error`, `plugin_state: failed_build`, `context: deploy-preview`를 반환했다. 이 상태만으로 특정 플러그인의 어느 줄이 실패했다고 확정할 수 없다.
- 상세 빌드 API는 접근되지 않아 사용자에게 오류 로그를 요청했고, 사용자가 제공한 로그로 실패 위치를 확인했다. 기존 인증정보를 출력하거나 변경하지 않았다.

## 로그로 확인된 실패 원인

- `./netlify/plugins/public-deploy`의 `onPreBuild`가 예외를 발생시켜 `npm run build` 실행 전에 중단됐다.
- 실제 Netlify 설정은 base `/opt/build/repo`, publish `/opt/build/repo/dist`로 올바르다. 내부 파일이 발견됐거나 `dist` 설정이 잘못돼 실패한 것이 아니다.
- 로그의 플러그인 실행 위치는 `/netlify/plugins/public-deploy/index.js`다. 기존 코드는 `resolve(__dirname, '../../..')`를 저장소 루트로 가정한다. 이 환경에서는 `/opt/build/repo` 대신 `/`를 계산하고 검사 모듈도 `/scripts/verify-deploy.mjs`에서 찾도록 구성된다.
- 모든 import·경로 검사 오류를 하나의 catch에서 `publish must be this repository's dist directory`로 바꿔 출력했기 때문에 로그 메시지가 실제 원인을 가렸다. 원격의 원래 내부 예외는 보존되지 않았지만 플러그인의 경로 가정과 배포 중단 위치는 코드·로그로 확인된다.
- 로컬 fixture는 플러그인과 프로젝트가 같은 트리에 있다고 가정했으므로 Netlify에서 플러그인이 별도 경로에서 실행되는 조건을 검증하지 못했다. 이 중복 플러그인은 제거하며 다른 플러그인으로 교체하지 않는다.

근거: [실패 Netlify 배포](https://app.netlify.com/projects/neroinfo/deploys/6aa8c6f6fe41b30008d4c4a9), [성공한 GitHub 검사](https://github.com/NERO-SERVICE/Nero-Website/actions/runs/34928294048/job/104250945408). Netlify의 GitHub commit status는 별도 배포 결과를 표시한다. [공식 안내](https://docs.netlify.com/deploy/deploy-notifications/)

## 구현 전 결정

1. 최근 추가한 로컬 Netlify 플러그인과 경로 검사 래퍼, 별도 deploy:check 명령을 제거한다. 원래 `npm run build`가 이미 공개 파일 목록과 비밀값 유출을 검사하므로 배포 단계의 중복 검사와 추가 플러그인 로딩이 필요하지 않다.
2. GitHub Actions는 checkout → Node 22 → 구문 검사 → 빌드로 줄인다. npm ci, 브라우저 설치, 전체 Node/Python/브라우저 테스트, 보고서 업로드는 자동 실행에서 제거한다. 상세 테스트 파일·명령은 로컬 회귀 검증용으로 보존한다. 자동 검사의 job 이름은 기존 PR 검사 설정과 호환되도록 유지한다.
3. Netlify의 Git 연결 배포를 유지한다. build `npm run build`, publish `dist`, 기존 문의 Functions 설정은 유지한다. 예전처럼 `publish = "."`로 되돌리면 현재 저장소의 내부 문서가 공개될 수 있어 복원하지 않는다.
4. 사전 렌더링·메타데이터·robots·sitemap·정확한 자산 목록·빌드 내부 공개 파일 검사는 유지한다. 화면·본문·링크·문의·분석은 변경하지 않는다.
5. 플러그인 전용 테스트를 제거하고 간단한 배포 설정 회귀 검사로 대체한다. 로컬 build/check 및 관련 테스트를 실제 실행한다. push·운영 배포·재배포·검색엔진 제출·실제 문의 전송은 하지 않는다.

이 변경은 확인된 실패 플러그인과 중복 절차를 제거하는 조치다. 변경 후 원격 재배포는 소유자가 수행하며, 아직 배포 복구 완료라고 표현하지 않는다.

## 적용·검증 결과

- 수정: `netlify.toml`, `.github/workflows/netlify-deploy.yml`, `package.json`, `scripts/check-source.mjs`와 내부 운영 문서.
- 삭제: `netlify/plugins/public-deploy/index.js`, `manifest.yml`, `scripts/verify-deploy.mjs`, `tests/deploy-guard.test.mjs`.
- 추가: `tests/deploy-config.test.mjs`. 기존 `dist`·문의 Functions 설정과 플러그인/중복 검사 없는 간단한 자동 흐름을 확인한다.
- `npm run check`, `npm run build`, `npm run ga4:check`, `git diff --check` 통과.
- `npm test`: **51/51 통과**. production·branch-deploy·deploy-preview 임시 빌드, 실제 로컬 HTTP·canonical·메타·본문·robots/sitemap, 내부 자료 404, 공개 자산·비밀값 제외 검사 포함.
- 페이지 6개와 공개 파일 50개 유지. 기준 `9e30d40` 대비 원래 프론트엔드·문의 Functions에 차이 없음.
- 이번에는 브라우저·Python 검사를 재실행하지 않았다. 프론트엔드와 렌더링·공개 파일 생성 코드에 변경이 없으며 관련 Node 검사를 수행했다. 기존 브라우저/문의 대역 결과를 이번 실행 결과로 보고하지 않는다.
- 실제 SMTP·운영 배포·원격 재배포·GitHub workflow 재실행은 하지 않았다. 소유자가 수정 사항을 커밋·푸시한 뒤 기존 Netlify Git 연결의 배포 결과를 확인한다. 실패한 과거 커밋을 그대로 재시도하는 것만으로는 이 변경이 적용되지 않는다.

롤백 시 화면·SEO나 `dist` 게시 설정을 되돌릴 필요는 없다. 운영에서는 이전의 안전한 배포를 선택할 수 있지만, 이번 실패 원인인 public-deploy 플러그인은 재도입하지 않는다.
