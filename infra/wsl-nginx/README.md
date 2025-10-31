# WSL용 nginx/Certbot 구축 가이드

이 디렉터리는 Windows 호스트 대신 WSL(Ubuntu)에서 nginx와 Certbot으로 `zzirit.kr`을 직접 서비스할 때 필요한 설정 템플릿과 절차를 정리한 것입니다.

## 1. 패키지 설치

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

> 방화벽(UFW)을 사용한다면 `sudo ufw allow 'Nginx Full'` 로 80/443을 허용하세요.

## 2. 정적 자산 배포 경로 준비

```bash
sudo mkdir -p /var/www/zzirit.kr/html
sudo chown -R "$USER":"$USER" /var/www/zzirit.kr
```

프로젝트 루트에서 `nginx-1.28.0/html` 안의 빌드 결과물을 `/var/www/zzirit.kr/html` 로 복사하면 됩니다. 이를 자동화하려면 `scripts/deploy-static-to-wsl.sh` 를 사용하세요(아래 참고).

## 3. nginx 서버 블록 배치

```bash
sudo cp infra/wsl-nginx/zzirit.kr.conf /etc/nginx/sites-available/zzirit.kr
sudo ln -sf /etc/nginx/sites-available/zzirit.kr /etc/nginx/sites-enabled/zzirit.kr
sudo nginx -t
sudo systemctl reload nginx
```

`zzirit.kr.conf` 는 기본적으로 `127.0.0.1` 의 프론트 dev 서버(4173~5177)와 백엔드(20021)를 프록시하도록 되어 있으니, 서비스 포트가 다르면 파일 내 `upstream` 섹션만 수정하면 됩니다.

## 4. Let's Encrypt 인증서 발급

```bash
sudo certbot --nginx -d zzirit.kr -d www.zzirit.kr
```

Certbot이 자동으로 `/etc/letsencrypt/live/zzirit.kr/` 경로를 생성하고 SSL 블록에 경로를 삽입합니다. 인증서 자동 갱신은 `systemctl list-timers` 로 확인할 수 있으며, 수동으로 갱신 테스트를 하려면 `sudo certbot renew --dry-run` 을 실행하세요.

## 5. 서비스 재시작/적용

정적 파일을 수정하거나 프록시 대상을 바꾼 후에는 다음 명령으로 nginx를 재로드 합니다.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 정적 파일 동기화 스크립트

`scripts/deploy-static-to-wsl.sh` 는 현재 리포지토리 안의 `nginx-1.28.0/html` 폴더를 `/var/www/zzirit.kr/html` 로 통째로 복사합니다. 실행 전에 `npm run build`(또는 각 앱 빌드)를 완료하세요.
