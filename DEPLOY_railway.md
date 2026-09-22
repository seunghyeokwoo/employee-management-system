# Railway 배포

GenBuilder가 Railway 배포에 필요한 `railway.json` + `Dockerfile`을 생성했습니다.

## 연결 방법

1. [Railway](https://railway.app/new)에 로그인합니다.
2. **Deploy from GitHub repo**에서 이 저장소를 선택합니다.
3. `railway.json`이 자동 감지되며 `Dockerfile` 기반 빌드가 시작됩니다.
4. 이후 GenBuilder에서 코드를 Push할 때마다 Railway가 자동 배포합니다.

## 환경 변수

런타임 환경 변수가 필요하면 Railway 프로젝트의 **Variables** 탭에서 추가하세요.
`PORT`는 Railway가 자동으로 주입합니다.
