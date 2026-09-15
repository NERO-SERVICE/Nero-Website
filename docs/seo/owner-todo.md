# 소유자가 실행할 항목

운영 배포·DNS 변경·검색엔진 등록/제출·IndexNow 전송·운영 문의 실제 발송은 자동 실행하지 않는다. 실패 플러그인 제거 후 로컬 검사는 Node 51/51 및 check·build·GA4 통과다. 이전 브라우저 28/28·Python 9/9·robots 1/1 결과를 이번 재실행 결과로 표현하지 않는다. 상세 결과와 한계는 `completion-report.md`에서 확인한다. 운영 환경을 확인했다는 뜻은 아니다.

배포 전 [공개 파일 경계와 배포 순서](deployment-boundary.md)를 확인한다. 실패한 public-deploy 플러그인과 별도 deploy:check 명령은 삭제했다. 이 변경을 커밋·푸시하면 기존 Git 연결이 일반 빌드로 `dist`를 게시한다. 변경 후 실제 Netlify 배포·Functions·CDN 응답은 소유자가 확인한다.

추가 검색어 중 모두의창업은 미수행 확인을 유지하고, 사주앱·디지털노마드는 공개 근거 확인 전 보류한다. 정부지원사업은 회사소개에 이미 공개된 예비창업패키지 수료 연혁의 요약이며 정부 지정 수행사·선정 보장을 뜻하지 않는다. [검색어별 작업·검증·롤백](keyword-targeting.md)을 확인한다.

환경변수별 입력 위치와 순서는 [Netlify 환경설정 안내](netlify-environment.md)에 있다. `.env` 전체 업로드·import를 하지 않고 필요한 값만 개별 설정한다.

1. 최종 diff에서 기존 프런트엔드·문의 API·분석 소스를 유지한 상태를 검토한다. 기준 HEAD와의 바이트 비교는 차이 없음으로 확인되었으며, **로컬 개발 서버는 예외**로 비공개 파일 정적 제공을 막는 허용 목록을 추가했다. 기존 6개 페이지와 화면·본문·title·링크, 사용자 `seo-kit/`은 보존한다.
2. build·검사·환경별 HTTP·공개 파일·문의 대역·브라우저 회귀 결과를 검토한 뒤 독립된 커밋으로 보관한다. 별도 lint/typecheck가 없으면 실행한 것으로 보고하지 않는다. production·branch-deploy·deploy-preview 임시 빌드와 실제 로컬 HTTP 검증은 운영 CDN 검증을 대신하지 않는다.
3. Netlify 설정의 build `npm run build`, publish `dist`, Functions `netlify/functions`, Node 22를 대조한다. Node 20은 공식 EOL이고 Node 22는 LTS다. `NODE_VERSION=22`가 선택한 실제 패치는 빌드 로그로 확인한다. 로컬 22.18.0을 최신 패치라고 가정하지 않는다. [Node.js 릴리스](https://nodejs.org/en/about/previous-releases), [Netlify Node 설정](https://docs.netlify.com/build/configure-builds/manage-dependencies/)
4. Netlify **Project configuration → Environment variables**에 `SMTP_USER`·`SMTP_PASS`와 필요한 기존 SMTP 옵션만 개별 설정한다. scope 선택 기능이 있다면 Functions, 없다면 기본 all scopes를 사용한다. 유료 업그레이드는 필요하지 않다. 운영 값은 Production context 전용을 권장하며 `CONTACT_TO`·`SMTP_FROM` 미설정 시 기존 fallback을 유지한다. [Functions 환경변수](https://docs.netlify.com/build/functions/environment-variables/)
5. `.env` 전체 import, 비밀 값의 `netlify.toml` 기록, 환경 전체 HTML·JSON 직렬화를 하지 않는다. `NETLIFY_AUTH_TOKEN`·도구용 사이트 ID·Firebase 자격 증명은 현재 웹/문의 Function에 필요하지 않아 Netlify에 새 등록하지 않는다. 로컬 `.env`의 기존 11개 키·값과 0600 권한·ignore를 유지한다. 추가한 공개 검증 키 3개는 실제 발급값이 없어 현재 빈 값이다.
6. Google·네이버·Bing 소유권 검증은 기존 계정을 재사용한다. 실제 발급 메타의 content 값만 `NERO_GOOGLE_SITE_VERIFICATION`, `NERO_NAVER_SITE_VERIFICATION`, `NERO_BING_SITE_VERIFICATION`에 넣는다. scope 선택이 있다면 Builds, context는 Production을 사용한다. 미발급·빈 값은 메타 미출력이 정상이다. DNS 검증을 선택했다면 메타 토큰과 혼동하지 않고 기존 DNS/MX를 보존한다.
7. 검토 배포의 비운영 context에서는 noindex 메타·X-Robots-Tag, 빈 XML sitemap, `https://www.nero.ai.kr` canonical을 확인한다. robots의 비공개 경로·학습 정책은 유지한다. noindex는 인증 수단이 아니므로 비밀 자료를 공개 산출물에 넣지 않는다.
8. 배포 시점은 소유자가 선택한다. main push가 자동 배포를 유발할 수 있으므로 검토 없이 push하지 않는다. 환경변수 변경이 새 배포에서 적용되는지 확인한다. [Netlify 배포별 적용](https://docs.netlify.com/build/functions/environment-variables/)
9. production 배포 후 `/`, `/landing`, `/about`, `/overview`, `/services`, `/announcement`를 직접 GET한다. 200, 원래 title·본문, description·canonical·og:url, 운영 noindex 부재와 실제 검증 메타를 대조한다. `/overview`도 운영 색인 대상이다. HTTP/non-www/슬래시·CDN·WAF는 운영에서 확인한다.
10. 운영 robots가 TXT, sitemap이 XML이며 공개 canonical 6개만 포함하는지 확인한다. 없는 URL은 실제 404여야 한다. `.env`, docs, seo-kit, 함수 원본·테스트 비노출도 확인한다. 로컬 감사의 검토 항목 2개·종료 코드 1은 원래 overview/services의 H1 부재이며 이를 검토 항목 0으로 표현하지 않는다. 비운영의 빈 sitemap을 운영 sitemap으로 제출하지 않는다.
11. 소유권 확인 후 운영 sitemap을 Google Search Console·네이버 서치어드바이저·Bing Webmaster Tools에 제출한다. 실제 봇 접근은 공식 검사·로그·IP 자료로 확인한다. User-Agent만 바꾼 GET은 실제 크롤러 방문 증거가 아니다. IndexNow는 별도 선택 작업이다.
12. 별도 승인한 테스트 문의를 고객 리드와 구분해 SMTP 전달·실제 수신·소개서 안내를 확인한다. 소개서 요청은 담당자 알림이며 PDF 자동 발송을 추가하지 않았다. GA4의 원래 이벤트·전환 설정·유입 정보도 확인한다. HTTP 대역 성공과 기존 disabled 버튼의 요청 1개 유지 검사는 실제 수신·서버 멱등성 검증이 아니다.
13. 회사 주소와 과거 공고의 관계, 가격·응답 시간·실적·기관 관계의 정확성·공개 허가를 확인한다. 사용자가 수행하지 않았다고 확인한 모두의창업에 NERO 선정·수행·공식 협력 관계를 등록하지 않는다. 개인정보 처리·보관·동의와 분석 동의 정책도 실제 운영에 맞게 확인한다.
14. 원래 overview/services H1 부재, 기존 접근성 위반, 공고 상세의 JS 의존, 초기 DOM 재생성의 입력값 재설정·iframe 재요청 가능성과 reveal/loader의 JS 비활성 가시성 한계는 별도 개선 범위에서 검토한다. 환경설정 작업이 이를 수정했다고 해석하지 않는다.

검색엔진의 발견·수집·색인·순위와 AI 인용·추천은 서로 다른 결과다. 등록·제출이나 기술 수정으로 즉시 반영·순위·추천을 보장하지 않는다.

## 로컬 검토와 실제 전송의 구분

`npm run build` 후 `npm run preview`는 `dist/`를 제공하고 문의 API를 차단한다. 비운영 정책은 `CONTEXT=deploy-preview npm run build`처럼 빌드에 지정한다. 이미 만든 산출물은 서버 실행 시 context만 바꿔도 변하지 않으며 production 형태는 다시 빌드해야 한다.

`npm run dev`의 정적 파일 허용 목록은 비공개 파일 노출을 제한하지만 기존 문의 API 실행은 유지한다. `npm run netlify:dev`도 Functions를 실행할 수 있으므로 자격 증명이 있으면 메일이 발송될 수 있다. 화면 검토에는 production preview와 HTTP 대역 테스트를 사용한다. 실제 API SMTP·입력 검증, 외부 CDN·폰트·Spline·GA 서버 결과는 브라우저 대역 검사로 검증된 것이 아니다.

## 롤백 준비

독립된 커밋을 기준으로 build·publish·context·라우팅·검사 설정을 함께 검토해 되돌린다. 원래 프런트엔드·API는 유지하며 로컬 개발 서버의 비공개 파일 차단과 `.env` 권한·ignore를 해제하지 않는다. `.env` 기존 비밀 값은 Git 롤백에 포함하지 않는다.

Netlify UI 환경변수는 Git revert로 되돌아가지 않는다. 소유자가 키별·context별 변경 내역과 이전 배포 식별자를 보관하고 필요한 값만 복원한다. 이전 검증된 운영 배포로 되돌린 뒤에도 환경변수·문의 경로를 확인한다. 내부 자료가 있는 작업폴더에서 publish만 저장소 루트로 바꿔 배포하지 않는다. 사용자 `seo-kit/` 및 이후 변경은 롤백 대상에서 제외한다.
