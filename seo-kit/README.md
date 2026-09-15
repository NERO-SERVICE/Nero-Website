# NERO 무료 SEO/AEO 실행 패키지
작성 기준: 2026-09-14 · 대상: https://www.nero.ai.kr

## 무엇이 완료됐고 무엇이 아직인가
이 패키지는 저장소에서 실행할 Codex 작업 명세, 콘텐츠 구조, 예시 설정, HTTP 검증 스크립트다. 실제 사이트의 소스코드 수정·운영 배포·검색엔진 계정 등록은 수행하지 않았다. 운영 저장소와 인증된 검색엔진 계정에 접근하지 않았기 때문이다. AI 추천·검색 색인·상위 노출은 보장되지 않는다.

검색 도구에서는 홈페이지 제목과 본문을 확보했다. robots.txt·sitemap.xml의 실제 상태, 원본 HTTP HTML, 프레임워크, canonical, 서버 설정은 확인되지 않았다. 직접 HTTP 시도는 이 실행 환경의 DNS 실패로 끝났으며 사이트 장애의 증거가 아니다. audit/OBSERVED_2026-09-14.md 참고.

## VS Code에서 사용
1. 기존 홈페이지 저장소의 작업 내용을 먼저 확인한다. 미커밋 변경을 덮어쓰지 않는다.
2. 이 폴더 전체를 저장소 루트의 `seo-kit/`에 복사한다. `public/`, 정적 asset 폴더에 넣지 않는다. 패키지 문서는 검색용 공개 콘텐츠가 아니다.
3. VS Code의 Codex에서 아래 명령을 전달한다. Codex가 작업공간 파일을 읽고 수정할 수 있는 기존 설정을 사용하며, 불필요하게 권한을 확장하지 않는다.

```text
seo-kit/README.md와 seo-kit/CODEX_IMPLEMENTATION.md를 읽고 이 저장소의 NERO 웹사이트에 적용해.
먼저 기존 AGENTS.md와 미커밋 변경, 실제 프레임워크·라우팅·배포 구조를 확인해.
기존 디자인·문의 기능·브랜드를 유지하면서 Stage 0부터 순서대로 실제 코드와 테스트를 작성해.
필수 기업 정보가 없으면 만들어내지 말고 그 항목만 보류하며 진행 가능한 구현은 계속해.
유료 서비스는 도입하지 말고, 자동 운영 배포와 검색엔진 제출은 하지 마.
실행 가능한 검증을 수행하고, 완료/미검증/소유자 작업을 구분해 보고해.
```

기존 AGENTS.md가 있다면 AGENTS_SEO_APPEND.md의 관련 원칙만 충돌 없이 병합한다. 파일 전체를 덮어쓰지 않는다.

## 파일 안내
- CODEX_IMPLEMENTATION.md: 실제 코드 수정 범위·단계·완료 기준.
- CONTENT_BLUEPRINT.md: 검색 의도별 페이지, 문안 방향, 사실 검증 규칙.
- OWNER_ACTIONS.md: 배포 검토, Google·Naver·Bing 등록, IndexNow, 측정.
- AGENTS_SEO_APPEND.md: 이후 변경에서도 보존할 개발 규칙.
- templates/: 설계 예시. 바로 배포하는 완성 설정이 아니다.
- scripts/audit_public_site.py: Python 표준 라이브러리만 사용하는 읽기 전용 HTTP 점검.
- tests/test_audit.py: 감사 스크립트의 오프라인 단위 테스트.
- SOURCES.md: 공식 근거와 확인한 공개 페이지.

## 검증 스크립트 실행
저장소 루트에서:
```bash
python3 -m unittest discover -s seo-kit/tests -v
python3 seo-kit/scripts/audit_public_site.py \
  --base-url https://www.nero.ai.kr \
  --max-pages 15 \
  --output seo-audit.json
```
로컬 production preview 검증에는 `--base-url http://127.0.0.1:PORT --canonical-origin https://www.nero.ai.kr`를 사용한다. PORT를 실제 포트로 바꾼다. 현재 canonical이 다른 것으로 확인되면 해당 값을 사용한다.

이 스크립트는 색인 여부·실제 검색봇 신원·WAF 통과·모든 robots 규칙·브라우저 렌더링·콘텐츠 품질을 인증하지 않는다. JSON-LD는 JSON 문법만 검사하며 스키마의 의미와 내용의 진실성을 판정하지 않는다. 최초 HTML 본문 길이는 신호일 뿐 품질 점수가 아니다. `inspected_count`는 실제 점검 개수이며 전체 사이트 검증 완료를 뜻하지 않는다.

## 무료의 범위
추가 유료 SEO/AEO 도구·광고·크롤링 SaaS·유료 API를 요구하지 않는다. 기존 Codex 사용료, 호스팅, 개발·콘텐츠 작성 시간은 별도다. 검색엔진 소유권 검증은 소유자가 직접 한다.
