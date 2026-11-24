# 어제의 브리핑

국내 주요 언론사의 공식 RSS에서 전일 기사를 모아 OpenAI로 선별·요약하고, 카테고리별 1~3건을 보여주는 정적 뉴스 브리핑입니다.

## 로컬 실행

```powershell
npm install
npm run dev
```

저장소에는 UI 확인용 예시 브리핑이 포함되어 있습니다. 실제 브리핑을 만들려면 `.env.example`을 참고해 환경 변수를 설정한 뒤 실행합니다.

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-5-mini"
npm run generate
npm run dev
```

특정 날짜를 다시 생성하려면 `BRIEFING_DATE`를 `YYYY-MM-DD` 형식으로 지정합니다. 생성기는 한국시간 00:00~23:59에 발행된 기사만 포함합니다.

## GitHub Pages 배포

1. 저장소를 GitHub에 푸시합니다.
2. **Settings → Secrets and variables → Actions**에서 `OPENAI_API_KEY` Secret을 등록합니다.
3. 필요하면 `OPENAI_MODEL` Variable을 등록합니다. 기본값은 `gpt-5-mini`입니다.
4. **Settings → Pages → Build and deployment**의 Source를 **GitHub Actions**로 선택합니다.
5. **Actions → Daily news briefing → Run workflow**로 첫 실제 브리핑을 생성합니다.

이후 워크플로가 매일 오전 7시(Asia/Seoul)에 실행됩니다. GitHub Actions 예약 작업은 플랫폼 상황에 따라 지연될 수 있습니다. 생성이나 검증이 실패하면 배포 단계로 진행하지 않아 기존 사이트가 유지됩니다.

## 데이터와 출처

- 초기 RSS 목록은 `config/feeds.ts`에서 추가하거나 `enabled` 값으로 비활성화할 수 있습니다.
- 원문 본문이나 이미지는 수집하지 않습니다. RSS의 제목·설명·발행시각·URL만 서버 측 생성 과정에서 사용합니다.
- 결과는 `public/data/briefings/YYYY-MM-DD.json`에 저장하며 최근 7일만 보관합니다.
- 공개 운영 전 각 제공사의 최신 RSS 및 저작권 이용조건을 직접 확인하세요.

## 명령어

- `npm run dev`: 개발 서버
- `npm run generate`: 실제 전일 브리핑 생성
- `npm test`: 단위·UI 테스트
- `npm run build`: 프로덕션 빌드
