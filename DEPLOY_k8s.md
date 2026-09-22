# Kubernetes 배포

쿠버네티스 클러스터에 Deployment / Service / Ingress 로 배포합니다.

## 사전 준비

- 동작 중인 K8s 클러스터 (1.26+ 권장)
- `nginx-ingress-controller` 설치 (Ingress 리소스 사용 시)
- 이미지 레지스트리 접근 권한

## 등록해야 하는 GitHub Secrets

- `KUBE_CONFIG` — kubeconfig 파일 내용을 base64로 인코딩한 값
  - 로컬에서 `cat ~/.kube/config | base64 | pbcopy` (macOS)
- `REGISTRY`, `REGISTRY_USER`, `REGISTRY_PASSWORD` — 이미지 레지스트리

## 배포 흐름

1. 이미지 빌드 + 레지스트리 푸시.
2. `k8s/deployment.yaml` 의 이미지 플레이스홀더를 새 태그로 치환.
3. `kubectl apply -f k8s/` 로 매니페스트 적용.
4. `kubectl rollout status` 로 배포 완료까지 대기.

## 도메인 설정

`k8s/ingress.yaml` 의 `host: app.example.com` 을 실제 도메인으로 바꾼 뒤 다시 푸시하세요.
