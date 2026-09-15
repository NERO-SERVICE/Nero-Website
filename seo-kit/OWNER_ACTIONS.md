# 소유자가 실행할 작업
이 문서는 등록을 했다는 확인서가 아니다. 실제 로그인·소유권 검증·배포를 수행한 후 체크한다.

## 1. 배포 전
- 기존 working tree와 변경 diff를 확인하고 기존 배포 절차에 따른 Git checkpoint를 만든다.
- 실제 법인 이름, 연락처, 대표자/주소 변경 여부, 수행 범위, 포트폴리오 공개 허가를 확인한다.
- 기존 canonical이 www/비www 중 무엇인지 확인한다. 배포 전 무조건 www로 바꾸지 않는다.
- 테스트 완료 보고서에서 build/폼/초기 HTML/메타/404/sitemap 결과를 본다.
- 템플릿·초안·내부 문서가 public 또는 빌드 산출물에 섞이지 않았는지 확인한다.
- preview는 인증으로 제한한다. noindex는 기밀 보호 기능이 아니다.

## 2. 배포 후 즉시 기술 확인
운영 URL의 실제 GET 응답을 확인한다. 브라우저 주소창에 robots나 sitemap 경로를 입력했는데 홈페이지 화면이 보이면 잘못된 rewrite일 수 있다.

```bash
curl -sS -D - https://www.nero.ai.kr/robots.txt
curl -sS -D - https://www.nero.ai.kr/sitemap.xml
curl -sS -D - https://www.nero.ai.kr/services/research-platform
```
마지막 상세 URL은 실제 구현한 경로로 바꾼다. 대표 호스트가 다르면 전부 그 호스트를 사용한다. robots는 plain text, sitemap은 XML, 페이지는 HTML이어야 한다. 응답 코드와 body를 같이 확인한다.

패키지의 audit_public_site.py를 실행하고 최초 HTML 및 내부 링크를 직접 확인한다. UA만 OAI-SearchBot으로 바꿔서 성공하는 테스트는 그 서버의 실제 봇 IP·WAF 접근을 증명하지 못한다. Google Search Console URL 검사의 실제 수집 결과, 공식 크롤러 IP 확인·서버 로그 등과 함께 본다.

## 3. Google Search Console
https://search.google.com/search-console
기존 속성이 있으면 재사용한다. 없다면 루트 도메인 nero.ai.kr의 Domain 속성을 생성하고 화면이 제공하는 정확한 DNS TXT 값을 추가해 소유권을 확인한다. 기존 DNS/MX/TXT 값을 삭제하지 않는다. 또는 허용된 URL prefix 확인 방법을 사용한다.

소유권 확인 후 Sitemaps에 실제 배포된 대표 호스트의 sitemap.xml을 제출한다. 핵심 공개 페이지는 URL 검사에서 실시간 테스트 후 필요시 색인 생성을 요청한다. 제출됨/가져옴/발견됨/색인됨을 구분하고, 검색 실적은 별도 확인한다. 같은 URL 반복 요청을 작업 루틴으로 만들지 않는다.

일반 회사·서비스 페이지에 Google Indexing API를 쓰지 않는다. 이 API의 사용 대상은 JobPosting 및 VideoObject에 포함된 BroadcastEvent 페이지로 제한된다.

## 4. 네이버 서치어드바이저
https://searchadvisor.naver.com/
웹마스터 도구에서 기존 사이트를 재사용하거나 대표 URL을 추가한다. 화면에서 발급한 HTML 파일 또는 메타 태그로 소유권 확인한다. Codex가 검증값을 만들어내면 안 된다.

요청의 사이트맵 제출 기능에 실제 sitemap을 등록한다. 핵심 URL은 수집 요청 및 검증 기능으로 확인한다. RSS는 실제 공개 글이 있을 때만 추가한다. 네이버 RSS는 본문 전체 공개 권고와 item 조건을 공식 가이드에서 확인한다. 작은 NERO 사이트는 sitemap 우선이며 RSS 없이도 기본 작업을 수행할 수 있다.

## 5. Bing Webmaster Tools
https://www.bing.com/webmasters/
기존 사이트를 재사용하고 화면이 제공하는 방법으로 소유권 확인한다. Search Console에서 가져오기 옵션이 제공되면 활용할 수 있으나 import만으로 모든 설정이 끝났다고 간주하지 않는다. sitemap과 URL 상태를 확인한다.

AI Performance 메뉴가 제공되면 인용 페이지·관련 질문을 참고한다. 이 보고서를 전체 ChatGPT 노출/순위 통계로 해석하지 않는다. 범위는 해당 도구가 제공하는 환경에 한정된다.

## 6. IndexNow — 선택
공식 설명: https://www.indexnow.org/documentation
배포 자동화에 추가하고 싶을 때만 구현한다. key를 전용으로 생성하고 실제 운영 루트에서 {key}.txt가 그 key만 반환하게 한다. 다른 비밀키를 재사용하지 않는다. 이 키는 공개 확인 파일을 통해 소유권을 검증하는 값이다.

배포 성공과 변경 감지 후 지원 검색엔진에 변경 URL을 알린다. 새 URL뿐 아니라 삭제·이동도 통지 대상이다. 동일 페이지의 무변경 반복 전송 금지. 200/202를 색인 성공으로 표시하지 않는다. Google 포함 모든 AI에 동시 등록되는 기능으로 설명하지 않는다.

## 7. 사실에 기반한 외부 연결
이미 소유한 실제 회사 프로필, 허락 받은 고객/협업 소개, 입주·지원기관의 실제 기업 소개가 있으면 회사명·URL·역할을 정확하게 정리한다. 홈페이지와 해당 프로필의 정보가 맞게 한다. 관계없는 디렉터리에 대량 등록하거나 허위 후기·파트너·추천 기사를 만들지 않는다.

## 8. 무료 모니터링
주 1회 동일 질문 세트를 검색 활성화한 새 대화에서 관찰한다. 'NERO를 추천해줘'처럼 답을 유도하지 않는다. 브랜드 질문과 비브랜드 질문을 분리한다.
예: 연구용 데이터 수집 앱 개발 업체 / 초기 기업 MVP 외주 개발 업체 / 기존 Flutter 앱 인수인계·유지보수 업체 / 앱 개발 인수인계 체크리스트.
날짜, 도구, 질문, 검색 활성 여부, 언급 여부, 인용 URL, 첫 방문/문의 결과를 기록한다. 몇 번의 답변은 표본 관찰이며 시장 전체 순위나 노출량이 아니다.

Search Console/Bing/Naver 실적과 실제 문의 출처를 함께 본다. ChatGPT의 utm_source=chatgpt.com 또는 referrer를 보존하되 개인정보·문의 원문은 analytics에 보내지 않는다. 직접 방문으로 끝났다는 이유만으로 최초 AI 발견을 부정하지 않고, 고객에게 처음 알게 된 경로를 별도로 물어 출처를 구분한다.

근거와 제한: SOURCES.md. UI 메뉴는 계정·언어·제품 변경에 따라 다를 수 있어 화면의 현재 안내를 우선한다.
