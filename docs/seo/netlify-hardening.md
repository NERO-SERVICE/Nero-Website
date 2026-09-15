# Netlify 환경과 검색 정보 보완 계획

2026-09-15. 기준 화면은 HEAD `9e30d40`; 기존 6개 페이지·본문·제목·링크·브라우저 JS·CSS와 문의 API를 유지한다. 운영 배포·DNS·검색 등록·문의 실제 발송은 하지 않는다.

## 변경 근거와 범위

1. 민감한 SMTP/배포 인증값은 현재 비추적 `.env` 값을 보존하며 용도별로 정리한다. 환경변수 예시는 빈 값만 제공한다. Netlify에는 실제 사용하는 문의용 변수만 UI에서 설정하며 `.env` 전체를 업로드하거나 import하지 않는다. Netlify CLI 인증값과 별도 Firebase 자격증명은 홈페이지 공개 빌드에 필요하지 않다.
2. 현재 로컬 개발 서버가 저장소 루트의 파일을 정적으로 제공할 수 있으므로 기존 공개 파일만 허용한다. 실제 민감 파일의 HTTP 본문은 읽지 않고 임시 파일로 검증한다.
3. 빌드는 검색엔진 소유권 검증 키 3개만 공개 설정으로 선택해 읽는다. 공개 검증 토큰은 비밀번호가 아니며, 실제 소유자가 발급받은 값이 없으면 태그를 출력하지 않는다. `process.env` 전체를 HTML로 전달하지 않는다.
4. production canonical은 `https://www.nero.ai.kr`로 고정한다. Netlify 비운영 context에는 noindex를 적용하고 sitemap을 비운영 URL 목록으로 만들지 않는다. robots 비공개 경로·학습봇 정책은 보존한다.
5. 외주개발·앱개발은 기존 H1/본문에서 확인된다. 풀스택은 화면·서버·DB·API·관리자·배포 범위를 요약한 표현으로 설명에 사용한다. 관련 Service 구조화 데이터도 이 범위만 반영한다.
6. 사용자는 ‘모두의창업’ 실제 수행 이력이 없음을 확인했다. 관련 키워드·선정·제휴·수행 관계를 숨김 문구나 구조화 데이터로 삽입하지 않는다. 새 페이지·가이드·메뉴를 만들지 않는다.
7. 공개 산출물 파일 허용 목록, symlink 거부, 비밀키/알려진 환경변수 값 유출 검사, 공고 데이터의 공개 필드 선택을 빌드에서 검증한다.

## 공식 근거

- Netlify 환경변수: https://docs.netlify.com/build/environment-variables/overview/
- Functions 환경변수: https://docs.netlify.com/build/functions/environment-variables/
- 배포 context와 색인: https://docs.netlify.com/deploy/deploy-overview/#search-engine-indexing
- Google AI 검색/검색엔진·AI별 세부 근거는 `search-evidence.md`에 기록한다.

Netlify의 함수 환경변수는 `netlify.toml`로 설정하지 않고 UI/CLI/API에 등록해야 한다. 범위별 설정은 지원 요금제에서만 선택할 수 있다. 추가 유료 서비스 없이 진행하며 범위 기능이 없을 때도 비밀값을 공개 빌드로 직렬화하지 않는다.

## 검증 계획

빌드·기존 검사·production/preview context·환경변수 공개 경계·내부 파일 차단·실제 HTTP HTML/robots/sitemap/404·원본 화면 및 문의 회귀를 검증한다. 실제 결과는 완료 보고에서 따로 확정한다. 검색 수집·색인·추천은 보장하지 않는다.

## 실행 결과

현재 구현과 검증은 `completion-report.md`에 기록했다. Node 46개, 브라우저 28개, Python 10개가 통과했다. 기존 H1 부재 두 항목은 원형 보존으로 남는다. Netlify/CI는 현재 지원되는 Node 22 LTS로 설정했으며 운영 배포·계정 설정은 하지 않았다.
