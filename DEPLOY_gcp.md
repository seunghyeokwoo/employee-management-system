# GCP 배포 (Cloud Run)

GCR(Google Container Registry)에 이미지를 푸시하고 Cloud Run 서비스를 갱신합니다.

## 사전 준비

- GCP 프로젝트 생성, Cloud Run / Container Registry API 활성화
- 서비스 계정 생성 — 권한: Cloud Run Admin, Storage Admin, Service Account User

## 등록해야 하는 GitHub Secrets

- `GCP_SA_KEY` — 서비스 계정 키 JSON 전체 내용 (그대로 붙여넣기)
- `GCP_PROJECT_ID` — 프로젝트 ID
- `GCP_REGION` — 예: `asia-northeast3`

## 배포 흐름

1. 서비스 계정으로 gcloud 인증.
2. `docker push gcr.io/{PROJECT}/app:{sha}` 로 이미지 푸시.
3. `gcloud run deploy app --image ...` 로 Cloud Run 서비스 갱신.

## 도메인 설정

기본은 Cloud Run이 자동 생성한 URL을 사용합니다. 커스텀 도메인이 필요하면
GCP 콘솔 → Cloud Run → 도메인 매핑에서 추가하세요.
