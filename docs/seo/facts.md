# 기존 공개 내용과 SEO 메타데이터의 사실 근거

내부 검토 기록이며 공개 파일 목록에 포함하지 않는다. 현재 범위는 기존 6개 페이지의 원문을 보존하고 빌드 단계의 메타데이터와 구조화 데이터를 작성하는 것이다. 신규 서비스·가이드·사례 본문을 발행하지 않는다.

기준 소스는 커밋 `9e30d40`의 `scripts/home.js`, `scripts/landing.js`, `scripts/about.js`, `scripts/overview.js`, `scripts/announcement.js`, `pages/services.html`과 기존 공용 컴포넌트·데이터다. 이 원문에 적힌 내용은 회사 자체 공개 설명이며 계약 문서나 외부 기관의 독립 검증을 확인했다는 뜻이 아니다. 검토자 이름이나 검토일을 생성하지 않는다.

| claim_id | 기존 공개 내용 | 근거 파일 | 확인 수준·공개 범위 | 현재 처리 |
|---|---|---|---|---|
| company-name | 주식회사 네로 / Nero Inc. / NERO | `data/announcements.json` 법인 설립 공고, 기존 footer | 기존 회사 공고·표기 | 기존 표기와 일치하는 회사명만 메타·JSON-LD에 사용 |
| company-email | official@nero.ai.kr | `scripts/home.js`, `scripts/about.js`, 공용 footer | 기존 공개 연락처 | 기존 연락처 유지 |
| public-services | 연구자·예비창업자·기업·서비스 운영자 대상 개발 범위 | `scripts/home.js`, `scripts/landing.js`의 패키지·서비스·FAQ | 기존 회사 자체 설명 | 본문 보존, 해당 페이지의 메타 요약에만 활용 |
| delivery-scope | 웹·앱·서버·DB·관리자·배포·인수인계 범위 | `scripts/home.js`, `scripts/landing.js`의 서비스·진행 단계 | 기존 회사 자체 설명; 모든 계약에 자동 포함된다는 뜻 아님 | 기존 표현을 확대하지 않음 |
| portfolio-nero | 모바일 기록·건강 데이터 연동·관리자 등을 소개하는 Nero 플랫폼 | `scripts/home.js`의 포트폴리오, `pages/services.html`의 Nero CARE 소개와 스토어 링크 | 수행 성격·정확한 역할·현재 운영 상태 외부 확인 안 됨 | 기존 본문 유지, 별도 사례 발행 없음 |
| portfolio-sausalito | 소살리토 공식 온라인 사이트 기능 설명 | `scripts/home.js`의 포트폴리오 | 수행 성격·담당 범위·고객의 상세 공개 허가 확인 안 됨 | 기존 본문 유지, 별도 사례 발행 없음 |
| history | 회사 연혁·입주·수상·특허 출원 등 기존 설명 | `scripts/about.js` | 기존 회사 자체 설명 | 본문 보존, 고객·파트너 관계나 의료 인증으로 확대하지 않음 |
| announcement | 법인 설립 공고와 외부 기사 연결 데이터 | `data/announcements.json`, `scripts/announcement.js` | 기존 공개 데이터 | 원래 카드 요약을 사전 렌더링하고 상세 모달 유지 |
| company-address | 공고는 마포구, 현재 footer는 중구 주소 | `data/announcements.json`, `scripts/home.js`, `scripts/about.js` | 현 주소·이전 시점의 외부 확인 없음 | 원문 보존; JSON-LD에 새 주소를 확정하지 않음 |
| price-response | 기존 가격표와 응답 시간 문구 | `scripts/home.js`, `scripts/landing.js` | 소유자 재확인 필요 | 원문 보존; 새 가격·납기 약속 또는 구조화된 Offer로 확대하지 않음 |

## 메타데이터 작성 제한

- title·description·OG·JSON-LD는 각 기존 페이지의 실제 본문과 일치해야 한다. 새 가이드나 서비스를 제공하는 페이지인 것처럼 설명하지 않는다.
- `/services`는 기존 Nero CARE 소개이며 새 외주개발 서비스 목록으로 바꾸지 않는다. `/overview`는 기존 소개서 요청 화면이며 색인 대상 상태를 유지한다.
- 공고의 초기 HTML은 원래 요약 범위다. 전체 원문이 초기 HTML에 있다고 설명하지 않는다.
- 새 매출·이용자 수·후기·가격·납기·기관 관계·의료 효과·인증·검색 순위·AI 추천 보장을 추가하지 않는다.
- 실제 검토일·저자·작성일이 확인되지 않으면 `datePublished`, `dateModified`, sitemap `lastmod`를 임의로 만들지 않는다.
- 출처 파일을 읽었다는 사실과 해당 공개 주장을 외부 검증했다는 사실을 구분한다. 현재 범위의 메타·본문과 원본 보존 검사는 실행했으며 결과는 `completion-report.md`에 기록했다. 이 검사는 회사 자체 주장의 외부 사실 검증을 뜻하지 않는다.

## 추가 확인

- 사용자는 모두의창업 수행 이력이 없다고 확인했다. 해당 사업의 키워드·수행·제휴 관계를 새 메타/JSON-LD에 넣지 않았다.
- 풀스택은 원문에 있던 정확한 단어가 아니라 기존 화면·서버·DB·API·관리자·배포 범위를 요약한 표현이다. 구체 근거는 `search-evidence.md`에 있다.
- 추가 요청의 앱외주개발·iOS 앱·지원사업용 MVP는 기존 home/landing 본문으로 뒷받침된다. 정부지원사업은 `scripts/about.js:21`의 예비창업패키지 수료 연혁을 회사소개 메타데이터에서 요약하는 범위로만 반영했다.
- 사주앱·디지털노마드는 현재 공개 본문 근거가 없어 보류했다. 이번 검색어별 판단·코드 변경·검증·롤백은 [추가 검색어 작업 기록](keyword-targeting.md)에 있다.
