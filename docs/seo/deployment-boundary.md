# Netlify 공개 파일 경계와 배포 절차

2026-09-15 내부 운영 안내. 공개 빌드에 포함하지 않는다.

## 현재 배포 흐름

GitHub Actions는 checkout → Node 22 → `npm run check` → `npm run build`만 실행한다. Netlify는 기존 Git 연결로 `npm run build`를 실행하고 `dist`를 게시한다. 문의 Functions는 `netlify/functions`에서 별도로 배포한다.

추가했던 Netlify 로컬 플러그인과 별도 deploy:check 명령은 제거했다. 플러그인이 저장소와 다른 경로에서 실행되어 정상 게시 경로를 차단한 것이 로그로 확인됐다. 원인·삭제 파일·검증은 [Deploy Preview 수정 기록](deploy-preview-fix.md)에 있다.

## 내부 자료 제외

- `content/public-assets.mjs`는 기존 이미지 23개와 CSS 6개를 명시한다. 파일을 assets/css에 추가하는 것만으로 자동 게시되지 않는다.
- `scripts/build.mjs`는 승인된 파일만 복사하며 HTML·메타데이터·JSON-LD·robots·sitemap을 생성한다.
- 빌드 마지막의 `verifyPublicOutput`가 미등록 파일·디렉터리, symlink, 알려진 비밀값을 검사한다. 별도 플러그인 없이 이 검사에 실패하면 빌드가 실패한다.
- 정적 산출물 50개: 페이지 HTML 6, 브라우저 JS 8, 이미지 23, CSS 6, 컴포넌트 HTML 2, 공개 공고 JSON 1, robots/sitemap 2, Netlify 라우팅·헤더 설정 2.
- seo-kit·docs·내부 MD·.env·테스트/보고서·빌드 소스·함수 원본·Firebase 설정·package 파일은 정적 산출물에 없다. 미등록 이미지·CSS와 assets 안의 README도 제외한다.

Netlify는 publish 디렉터리 밖 파일을 정적 사이트에 배포하지 않는다. [공식 빌드 설정](https://docs.netlify.com/build/configure-builds/overview/)

## 소유자 실행

1. 이번 플러그인 삭제와 간소화 변경을 커밋·푸시하면 기존 Git 연결 배포가 변경된 설정을 사용한다. 아직 자동으로 커밋·푸시·재배포하지 않았다.
2. Netlify build는 `npm run build`, publish는 `dist`, Functions는 `netlify/functions`, Node는 22를 유지한다. 환경변수 실제 값은 Git이나 공개 파일에 넣지 않는다.
3. 로컬 사전 확인은 `npm run check`와 `npm run build`로 충분하다. 상세 회귀 검사는 필요할 때 `npm test`, `npm run test:browser` 등으로 실행한다.
4. 저장소 전체 폴더를 Netlify Drop 또는 `--dir .`로 업로드하지 않는다. 수동 폴더 배포는 빌드 명령을 실행하지 않는다. [공식 배포 안내](https://docs.netlify.com/deploy/create-deploys/)
5. 재배포 성공 후 원래 페이지·문의·robots/sitemap과 내부 자료 404를 확인한다. 변경 후 Netlify 원격 배포 성공은 아직 검증하지 않았다.

Git 저장소 자체의 공개 여부, 이전 배포와 로그 접근 권한은 이 정적 사이트 파일 제외와 별개다. 문제가 생기면 이전에 검증한 안전한 배포를 선택하되, 실패한 public-deploy 플러그인이나 저장소 루트 게시 설정을 다시 도입하지 않는다.
