# VPS SSH 배포

자체 서버(VPS)에 SSH로 접속해 컨테이너 이미지를 배포합니다.

## 사전 준비

서버에 다음이 설치되어 있어야 합니다.

- Docker, Docker Compose
- SSH 접근 (키 기반 인증 권장)
- 서버 사용자 홈에 `~/app` 디렉토리 (없으면 생성)

## 등록해야 하는 GitHub Secrets

- `SSH_HOST` — 서버 IP 또는 도메인
- `SSH_PORT` — SSH 포트 (선택 — 비워두면 22)
- `SSH_USER` — SSH 접속 사용자명
- `SSH_PRIVATE_KEY` — SSH 개인키 (PEM 형식 그대로)
- `REGISTRY` — 이미지 레지스트리 (예: `docker.io`, `ghcr.io`)
- `REGISTRY_USER` — 레지스트리 사용자명
- `REGISTRY_PASSWORD` — 레지스트리 토큰/비밀번호

## 배포 흐름

1. GitHub Actions가 Docker 이미지를 빌드해 레지스트리에 푸시합니다.
2. SSH로 서버에 접속해 `docker compose pull && docker compose up -d` 를 실행합니다.
3. 컨테이너가 `${HOST_PORT}` (기본 80) 포트에서 트래픽을 받습니다.

## 수동 배포 실행

GitHub 저장소 → Actions 탭 → "Deploy to VPS (SSH)" → Run workflow 클릭.
또는 GenBuilder UI의 "지금 배포" 버튼을 누르세요.
