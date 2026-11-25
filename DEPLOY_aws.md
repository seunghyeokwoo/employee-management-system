# AWS 배포 (ECR + ECS)

AWS ECR에 이미지를 푸시하고 ECS 서비스를 강제 재배포합니다.

## 사전 준비

- ECR 저장소 생성
- ECS 클러스터 + 서비스 생성 (롤링 업데이트 권장)
- IAM 사용자 — 아래 권한이 필요합니다
  - ECR: 이미지 push
  - ECS: `DescribeServices`, `DescribeTaskDefinition`, `RegisterTaskDefinition`, `UpdateService`
  - IAM: `PassRole` — Task Definition 에 실행 역할이 걸려 있으면 새 리비전 등록에 필요합니다

## 등록해야 하는 GitHub Secrets

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` — 예: `ap-northeast-2`
- `AWS_ECR_REPOSITORY` — ECR 저장소 이름
- `AWS_ECS_CLUSTER` — ECS 클러스터 이름
- `AWS_ECS_SERVICE` — ECS 서비스 이름

## 배포 흐름

1. AWS 자격증명 설정 + ECR 로그인.
2. 이미지 빌드 → 커밋 해시 태그 → ECR 푸시.
3. 서비스가 쓰는 Task Definition 을 읽어 이미지만 이번 태그로 바꾼 새 리비전을 등록.
4. `aws ecs update-service` 로 서비스가 그 리비전을 가리키게 하고 재배포.

## 참고

- 배포마다 커밋 해시로 태그를 붙이고 그 태그를 가리키는 Task Definition 리비전을 새로 등록합니다.
  어느 커밋이 돌고 있는지 리비전으로 확인할 수 있고, 이전 리비전을 지정하면 되돌릴 수 있습니다.
- 이미지 교체는 Task Definition 의 **첫 번째 컨테이너**에만 적용합니다. 한 정의에 컨테이너를
  여러 개 두셨다면 워크플로의 해당 부분을 손봐야 합니다.
