# 검색·AI 검색 근거와 최소 메타데이터 계획

확인 기준: 2026-09-15. 이 문서는 내부 검토 자료이며 공개 페이지·sitemap·공개 파일 허용 목록에 포함하지 않는다. 이번 조사에서는 공식 웹 문서와 저장소 소스를 읽고 이 파일만 작성했다. 아래 문안과 JSON-LD는 적용 검토안이며 코드 적용·운영 배포·검색엔진 제출·색인·인용 확인을 완료했다는 뜻이 아니다.

## 결론과 유지 조건

- 외주개발·앱개발은 기존 화면에 직접 명시되어 있다. 사용자 화면부터 서버·DB·API·배포까지의 범위도 명시되어 있으므로 메타데이터에서 실제 개발 범위를 더 분명하게 요약할 수 있다.
- 풀스택은 기존 본문에 나온 정확한 단어가 아니라 위 개발 범위를 요약한 해석이다. 정확한 검색어를 억지로 넣기보다 실제 구성요소를 설명하는 문장을 우선한다.
- 사용자가 이번 대화에서 **모두의창업을 실제 수행하지 않았다고 확인했다.** NERO가 해당 사업의 수행사·선정기업·운영기관·협력사·공식 파트너라는 관계를 등록할 수 없다.
- 기존 화면·본문·title·공개 페이지 6개·내부 링크·문의·분석은 그대로 유지한다. 작업 후보는 빌드에서 생성하는 description·OG description과, 기존 본문에 맞는 Organization·Service 설명에 한정한다.
- 수집·색인·검색 순위·AI 인용·추천은 각각 별도의 결과다. 아래 공식 가이드나 메타데이터 적용으로 순위·즉시 추천을 보장하지 않는다.

## 공식 검색 문서에서 확인한 내용

| 구분 | 확인한 내용 | NERO에 대한 적용 판단 |
|---|---|---|
| Google AI 검색 | 기존 검색의 기술·콘텐츠 기준이 AI 검색에도 적용된다. 색인과 스니펫 노출 자격이 필요하며 수집·색인·노출은 보장되지 않는다. 특별한 AI용 schema나 llms.txt는 필요하지 않고, Google Search는 llms.txt를 사용하지 않는다. 모든 검색 표현을 정확히 반복할 필요도 없다. [Google 생성형 AI 검색 가이드](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | 이미 구현한 HTTP HTML·canonical·sitemap을 유지한다. AI 전용 페이지·파일·키워드 묶음을 만들지 않는다. 소유자는 운영 Search Console의 색인·스니펫 및 AI 검색 표시 설정을 확인한다. |
| Google 구조화 데이터 | 구조화 데이터는 페이지에서 사용자가 보는 실제 내용과 일치해야 하며 소유·제휴 관계를 오인하게 표현해서는 안 된다. 올바르게 작성해도 검색의 별도 표시를 보장하지 않는다. [일반 구조화 데이터 지침](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) | 개발 서비스를 설명하는 기존 홈·landing에만 해당 Service를 둔다. 모두의창업 수행 관계, 새 실적·리뷰·가격·보장·연락처는 추가하지 않는다. |
| Google 스팸·메타 | 순위 조작 목적의 숨은 텍스트와 부자연스러운 키워드 반복은 스팸 정책 대상이다. `meta keywords`는 Google 색인·순위에 효과가 없다. [스팸 정책](https://developers.google.com/search/docs/essentials/spam-policies), [지원하는 메타 태그](https://developers.google.com/search/docs/crawling-indexing/special-tags) | 숨은 본문·키워드 나열·meta keywords·검색봇 전용 문구를 넣지 않는다. |
| 네이버 설명문 | description은 해당 페이지의 간결한 설명이어야 한다. 무관·반복·스팸성 키워드, 키워드 나열과 검색 노출만을 위한 잦은 설명 변경은 불이익을 받을 수 있다. 검색 스니펫은 검색엔진이 선택한다. [콘텐츠 마크업](https://searchadvisor.naver.com/guide/markup-content) | 외주개발·앱개발을 실제 제공 범위와 연결한 자연스러운 문장으로 요약한다. 사업 관계가 없는 모두의창업을 description에 추가하지 않는다. |
| 네이버 구조화 데이터·sitemap | 구조화 데이터는 정보 해석에 쓰이지만 검색 반영을 보장하지 않는다. sitemap은 URL 발견을 돕고 수집 대상은 내부 알고리즘이 고른다. [구조화된 데이터 소개](https://searchadvisor.naver.com/guide/structured-data-intro), [RSS 및 사이트맵 제출](https://searchadvisor.naver.com/guide/request-feed) | 실제 6개 canonical의 sitemap을 유지한다. RSS를 필수 구현으로 취급하지 않는다. 제출은 소유자가 진행한다. |
| Bing·Copilot | 검색과 AI grounding은 수집·색인·랭킹의 기본 기반을 공유한다. sitemap에는 canonical을 싣고 구조화 데이터는 보이는 내용과 일치시켜야 한다. [Bing Webmaster Guidelines](https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a) | 기존 6개 URL의 접근·canonical·본문을 보존하고 정확한 서비스 관계만 기술한다. Bing 문서는 공식 검색 추출 본문으로 확인했으며 직접 열기는 동적 도움말 셸만 추출되었다. |
| IndexNow | 변경 사실을 검색엔진에 알리는 프로토콜이다. 키 소유 확인과 실제 변경 URL 제출 절차가 있으며 제출이 수집·색인이나 즉시 색인을 보장하지 않는다. [Bing 시작 안내](https://www.bing.com/indexnow/getstarted), [IndexNow FAQ](https://www.indexnow.org/faq) | 필요하면 운영 반영 이후 소유자가 선택한다. 이번 조사에서는 키 생성·공개·제출·자동 전송을 하지 않았다. sitemap 대체나 추천 보장 수단으로 취급하지 않는다. |

## 검색봇·사용자 요청·학습봇의 구분

| 제공자 | 검색 목적 | 사용자 요청 | 모델 학습 목적·정책상 구분 |
|---|---|---|---|
| OpenAI | `OAI-SearchBot`은 ChatGPT 검색에 사이트를 표시하는 데 사용한다. robots 정책과 공개 IP 범위의 접근을 확인하도록 안내한다. | `ChatGPT-User`는 사용자 요청에 따른 접근이며 자동 검색 수집·검색 포함 여부를 결정하는 봇이 아니다. 사용자 요청이므로 robots 규칙이 적용되지 않을 수 있다. | `GPTBot`은 모델 학습에 사용될 수 있는 수집이다. 검색봇 허용과 학습봇 차단을 독립적으로 설정할 수 있다. [OpenAI Crawlers](https://developers.openai.com/api/docs/bots) |
| Anthropic | `Claude-SearchBot`은 검색 결과의 관련성과 정확성을 위한 수집이다. | `Claude-User`는 사용자가 요청한 웹 접근이다. | `ClaudeBot`은 모델 개발·학습용 수집과 관련된다. 문서는 세 봇의 목적과 robots 설정을 구분하며 robots 지시를 존중한다고 설명한다. [Anthropic 크롤러 안내](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) |
| Perplexity | `PerplexityBot`은 검색 결과에서 사이트를 표시·연결하기 위한 봇이고 기초모델 학습용 수집에 사용하지 않는다고 설명한다. | `Perplexity-User`는 사용자 요청에 따른 접근이며 일반적으로 robots 규칙을 무시한다고 설명한다. | 공식 문서는 WAF에서 User-Agent와 공개 IP 정보를 함께 확인하도록 안내한다. 사용자 요청 봇도 모델 학습 수집용이 아니다. [Perplexity Crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) |

이 구분의 적용은 기존 robots의 비공개 경로·학습 정책을 보존하는 것이다. 특정 봇의 `Allow: /` 그룹을 무작정 추가하지 않는다. 공개 페이지의 접근 가능 여부와 비공개 경로 제한을 각각 검사하고, WAF 변경이 필요하면 소유자가 현재 공식 IP 자료를 확인한다. User-Agent만 흉내 낸 요청을 실제 검색봇 방문·색인·추천 증거로 사용하지 않는다. 이 조사에서는 운영 WAF나 봇 정책을 변경하지 않았다.

## 모두의창업은 어떤 명칭이며 무엇을 표시할 수 없는가

정부 공식 명칭은 **모두의 창업 프로젝트**다. 중소벤처기업부의 2026년 공식 발표는 일반·기술과 로컬 트랙의 창업 인재 선발·멘토링 등으로 구성된 사업을 설명한다. 여기서 필요한 확인은 정확한 사업명과 정부 사업이라는 점이며 모집 규모·지원 금액·현재 모집 일정 등을 NERO 서비스 조건으로 전용하지 않는다. [중소벤처기업부 공식 발표](https://www.mss.go.kr/site/smba/ex/bbs/View.do?bcIdx=1068081&cbIdx=86&parentSeq=1068081), [중소벤처기업부 정책브리핑](https://www.korea.kr/news/policyNewsView.do?newsId=148966164)

사용자의 미수행 확인과 기존 공개 본문을 함께 적용하면 다음과 같이 처리한다.

- NERO를 해당 사업의 수행사·선정기업·보육기관·공식 협력사로 표현하지 않는다. 로고, `award`, `memberOf`, `sponsor`, `funder`, `parentOrganization`, `sameAs` 등에 정부 사업 관계를 넣지 않는다.
- `sameAs`는 같은 NERO 실체의 확인된 프로필을 연결하는 데 쓰는 속성이다. 정부 사업 소개 URL을 NERO의 동일 실체로 연결하는 용도로 쓰지 않는다. [Schema.org Organization](https://schema.org/Organization)
- 기존 본문의 일반적인 예비창업자·지원사업용 MVP 제공 범위는 해당 특정 사업의 수행 이력을 의미하지 않는다. 모두의창업 키워드를 `description`, `serviceType`, `knowsAbout` 등에 넣어 관계를 암시하지 않는다.
- 명칭을 사용했다는 사실만으로 모든 맥락에서 자동 스팸·불법이라고 단정하는 것은 아니다. **현재 페이지의 내용·사실과 관련 없는 검색어를 넣지 않는 판단**이다. 네이버의 무관 키워드 지침과 Google의 부정확한 구조화 관계·키워드 반복 지침이 그 근거다. [네이버 설명문 기준](https://searchadvisor.naver.com/guide/markup-content), [Google 구조화 데이터 정책](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

## 저장소에 있는 검색 주제별 근거

아래는 현재 공개 본문의 소스 위치다. 회사 자체 설명의 존재를 확인한 것이며 외부 계약·납품·성과를 검증했다는 뜻은 아니다.

| 주제 | 원문 근거와 위치 | 허용 가능한 요약 범위 |
|---|---|---|
| 외주개발 | `scripts/home.js:739`, `scripts/landing.js:686`의 연구자·사업가 대상 외주개발 설명 | NERO의 웹·앱 외주개발. 대상은 기존 연구자·창업자·기업 범위 |
| 앱개발 | `scripts/home.js:740`, `scripts/landing.js:687`의 H1; 양쪽 `:176`의 iOS·Android 앱서비스와 `:180`·`:181`의 앱 화면·서버·관리자·배포 지원 | 앱개발, iOS·Android 앱·서버·관리자 개발. 새 인증·심사 통과·납기 보장은 제외 |
| 화면부터 서버·DB·API까지 | `scripts/home.js:741`, `scripts/landing.js:688`; 양쪽 `:95`, `:160`, `:506` | 사용자 화면·웹·앱과 서버·DB·API·관리자를 함께 개발하는 범위 |
| 배포·운영 | 양쪽 `:508` 배포 산출물; `scripts/home.js:741`, `scripts/landing.js:688`의 배포·유지보수 | 프로젝트에 필요한 배포·운영·인수인계 범위. 모든 프로젝트 자동 포함이나 운영 SLA로 확대하지 않음 |
| 풀스택 | `rg`에서 원문 단어 자체는 확인되지 않음. 위 화면·서버·DB·API·배포의 조합으로 의미를 해석할 수 있음 | 정확한 단어 삽입 없이 구성요소를 서술하는 문장 우선. 단어 사용 시에도 개발 범위의 요약으로만 사용하고 인력 규모·전문 자격·무제한 지원으로 확대하지 않음 |
| 연구·초기 창업 MVP | 양쪽 `:107` 연구 패키지, `:110`·`:111` 데이터 수집·관리자, `:116`·`:119`·`:120` 초기 검증 MVP | 연구자·예비창업자 대상 개발 범위. 특정 정부 사업 관계로 연결하지 않음 |
| 회사 연락처 | `scripts/home.js:680`, `scripts/landing.js:665`, `scripts/about.js:98` | `official@nero.ai.kr` 및 기존 회사명·로고. 미확인 주소·전화번호는 추가하지 않음 |

## 구현 가능한 최소 변경안

이 절은 구현 담당자에게 제시하는 계획이다. 기존 본문·title·H1·페이지·메뉴·링크·문의·분석은 변경하지 않는다. 실제 적용 파일·검증 결과는 별도 완료 보고에서 확정해야 한다.

1. `content/site.mjs`에서 홈과 landing의 description을 기존 공개 범위에 맞게 간결하게 정리한다. 같은 description을 여러 페이지에 복사하지 않는다. OG description과 WebPage description도 같은 페이지 설명을 참조한다.
2. 기존 Organization 식별자·회사명·URL·로고·공개 이메일을 유지한다. 회사 description을 보완한다면 홈의 실제 범위만 요약한다. `knowsAbout`·`keywords` 속성을 검색어 저장소처럼 추가할 필요는 없다. [Google Organization 지침](https://developers.google.com/search/docs/appearance/structured-data/organization)
3. 홈과 landing에서 실제 설명하는 웹·앱 외주개발 Service를 최소 속성으로 표현한다. `name`, `serviceType`, `description`, `provider`, `url`, `@id`를 기존 Organization·WebPage와 연결한다. `Service`는 서비스 분류를 설명하는 schema.org 타입이며 AI 추천을 명령하는 규격이 아니다. [Schema.org Service](https://schema.org/Service)
4. `/services`는 기존 Nero CARE 소개이므로 일반 외주개발 페이지인 것처럼 바꾸지 않는다. `/about`, `/overview`, `/announcement`에는 관련 없는 서비스 키워드를 일괄 주입하지 않는다.
5. canonical·OG URL·sitemap 6개와 기존 링크는 유지한다. Service 식별자는 JSON-LD 내 엔터티 식별자이며 새 공개 페이지를 만들지 않는다. 가격·리뷰·정부사업·인증·성과·실제 검토일 미확인 속성은 제외한다.

### description 후보

| 적용 후보 | 문안 |
|---|---|
| 홈 | NERO는 연구자·창업자·기업을 위한 웹·앱 외주개발을 제공합니다. 사용자 화면부터 서버·DB·API, 관리자와 배포까지 프로젝트에 필요한 범위를 함께 설계합니다. |
| landing | 외주개발을 준비하는 연구자·창업자·기업을 위한 NERO 상담 안내입니다. 앱개발과 웹서비스의 기능 범위, 서버·DB·관리자, 검수·배포·인수인계 항목을 확인하세요. |
| Organization 설명 후보 | 연구자·창업자·기업을 위한 웹·앱, 서버·DB·API, 관리자와 배포 범위를 설계하는 외주개발 업체입니다. |

풀스택 검색 의도는 사용자 화면·서버·DB·API·배포를 자연스럽게 설명하는 것으로 대응한다. 특정 검색어가 들어갔다고 그 검색에서 노출·추천되는 것은 아니다. 모든 동의어를 exact match로 넣어야 한다는 주장은 Google의 공식 AI 검색 설명과 맞지 않는다. [Google AI 검색 가이드](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

### Service 데이터 형태 예시

아래는 홈 본문을 설명하는 최소 예시다. 새 URL·새 메뉴·새 계약 조건을 생성하는 예시가 아니다. 실제 구현에서는 기존 graph 식별자와 중복을 확인한다.

```json
{
  "@type": "Service",
  "@id": "https://www.nero.ai.kr/#development-service",
  "name": "웹·앱 외주개발",
  "serviceType": "웹·앱 개발",
  "description": "사용자 화면, 서버·DB·API, 관리자와 배포까지 프로젝트에 필요한 개발 범위를 설계합니다.",
  "url": "https://www.nero.ai.kr/",
  "provider": { "@id": "https://www.nero.ai.kr/#organization" },
  "mainEntityOfPage": { "@id": "https://www.nero.ai.kr/#webpage" }
}
```

Service 명칭과 설명은 기존 본문의 서비스 범위를 요약하며 보이는 본문을 대신해 새로운 주장을 심는 용도가 아니다. 같은 서비스 엔터티를 landing에서도 표현한다면 공통 `@id`와 각 페이지 관계를 명확히 처리한다. 메타·JSON-LD 변경 후 원본 화면·title·본문과 기존 6개 URL이 유지되는지 재검증한다.

## 운영 확인과 조사 한계

- 공식 문서는 이번에 웹으로 조회했다. 검색 서비스의 비공개 순위·추천 알고리즘이나 NERO의 현재 색인·AI 인용 여부는 확인하지 않았다.
- 이 조사에서는 Search Console·네이버 서치어드바이저·Bing 계정에 로그인하거나 등록·제출하지 않았다. 운영 배포·DNS·WAF·IndexNow·실제 문의 전송도 하지 않았다.
- 소유자가 운영 배포 뒤 원문 HTTP, 6개 canonical, robots·sitemap, 실제 크롤링/색인 보고서를 확인해야 한다. 특정 질문에 대한 일회성 AI 답변은 지속적인 추천 보장의 근거가 아니다.
- 현재 화면 보존 범위에서는 새 사례·가이드·콘텐츠 영역으로 검색 질문을 추가로 설명하지 않는다. description과 Service를 보완하는 효과는 실제 본문에 있는 사실을 명료하게 전달하는 범위로 제한된다.
