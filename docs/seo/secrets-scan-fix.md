# SMTP_HOST 예시값으로 인한 Netlify Secret 검사 실패

2026-09-15 내부 기록. 공개 빌드에 포함하지 않는다.

## 원인과 선택한 범위

- 사용자가 제공한 새 로그는 `.env.example:9`의 `SMTP_HOST` 값 한 건을 Secret 값과 일치한다고 보고한다. 이전 public-deploy 플러그인 문제와 별개의 실패다.
- Netlify 배포 이력에서 마지막 성공은 `797823db6345afbce49b25810b45341df356940a`의 production 배포 `6a2aa5ad3ac02a0008972154`다. 해당 커밋의 공개 `.env.example`을 직접 읽어 `SMTP_HOST`가 빈 값이었음을 확인했다.
- 이 예시값은 SEO 작업에서 추가됐다. 배포 산출물에 환경파일이 노출된 증거가 아니라, Netlify가 저장소 코드도 검사하면서 예시값과 환경변수의 일치를 발견한 것이다. [Netlify Secret 검사 범위](https://docs.netlify.com/build/environment-variables/secrets-controller/)
- 사용자는 범위를 확인한 뒤 **오류만 수정하고 SEO·내부자료 제외 방식 유지**를 선택했다. 따라서 마지막 성공 때의 저장소 루트 전체 게시 방식으로 되돌리지 않고 현재 `npm run build`·`dist` 게시를 유지한다.

## 변경과 실제 검증

- `.env.example`의 `SMTP_HOST`를 마지막 성공 시점처럼 빈 값으로 복원했다. 실제 `.env`·Netlify 환경변수·비밀번호·문의 Function은 변경하지 않았다.
- `tests/deploy-config.test.mjs`에 예시값 공란과 Secret 검사 우회 설정 부재를 확인하는 회귀 검사를 추가했다. Secret 검사를 비활성화하거나 검사 제외 경로/키를 추가하지 않았다.
- `npm run check`, `npm run build`, `node --test tests/deploy-config.test.mjs` **2/2**, `git diff --check` 통과.
- 추적 중인 작업 파일 전체와 생성된 공개 파일 50개에서 이전 예시값이 더 이상 나타나지 않음을 확인했다. 값 자체는 검사 출력이나 이 문서에 복사하지 않았다.
- Netlify 설정·GitHub workflow·빌드·공개 파일 검사·SEO 데이터·화면·문의 소스는 HEAD `fcd1502`와 차이가 없다.

전체 Node·브라우저·SMTP 실제 전송·Netlify 원격 Secret 검사는 이번에 실행하지 않았다. 이번 오류에 관련된 예시값과 배포 설정, 로컬 빌드를 검증했다. 변경을 커밋·푸시한 다음 새 커밋으로 배포해야 하며, 실패한 이전 커밋을 다시 실행하는 것만으로는 적용되지 않는다. 운영 배포나 환경변수 설정은 자동 변경하지 않았다.

롤백할 때도 문제가 된 예시값을 다시 넣을 필요는 없다. 실제 SMTP 설정은 소유자의 환경변수에서 유지한다.
