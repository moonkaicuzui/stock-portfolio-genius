# Stock Portfolio Genius - 무료 클라우드 배포 가이드

## 비용 요약: $0/월

| 서비스 | 용도 | 무료 한도 |
|--------|------|----------|
| Vercel | 프론트엔드 | 무제한 배포, 100GB/월 |
| Render | 백엔드 API | 750시간/월 |
| Render | PostgreSQL | 256MB (90일 후 삭제) |

---

## 1단계: GitHub 저장소 준비

```bash
# 프로젝트 루트에서
cd /Users/ksmoon/Coding/취미\ 주식\ 배우기/stock-portfolio-genius

# Git 초기화 (이미 되어있으면 스킵)
git init
git add .
git commit -m "Initial commit"

# GitHub에 새 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/stock-portfolio-genius.git
git push -u origin main
```

---

## 2단계: Render 백엔드 배포

### 2.1 Render 가입
1. https://render.com 접속
2. GitHub 계정으로 가입

### 2.2 Web Service 생성
1. Dashboard → **New +** → **Web Service**
2. GitHub 저장소 연결: `stock-portfolio-genius`
3. 설정:
   - **Name**: `stock-portfolio-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

### 2.3 환경 변수 설정
Render Dashboard → Environment:
```
FINNHUB_API_KEY=your_finnhub_api_key_here
DATABASE_URL=sqlite:///./data/portfolio.db
```

### 2.4 배포 확인
- URL: `https://stock-portfolio-api.onrender.com`
- 테스트: `https://stock-portfolio-api.onrender.com/health`

**참고**: 무료 플랜은 15분 비활성 시 휴면 → 첫 요청 시 30초 대기

---

## 3단계: Vercel 프론트엔드 배포

### 3.1 Vercel 가입
1. https://vercel.com 접속
2. GitHub 계정으로 가입

### 3.2 프로젝트 가져오기
1. Dashboard → **Add New** → **Project**
2. GitHub 저장소 선택: `stock-portfolio-genius`
3. 설정:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`

### 3.3 환경 변수 설정
```
NEXT_PUBLIC_API_URL=https://stock-portfolio-api.onrender.com
```

### 3.4 배포
- **Deploy** 클릭
- URL: `https://stock-portfolio-genius.vercel.app`

---

## 4단계: 도메인 연결 (선택)

### Vercel 커스텀 도메인
1. Project Settings → Domains
2. 도메인 추가: `portfolio.yourdomain.com`
3. DNS 설정 안내 따르기

### Render 커스텀 도메인
1. Service Settings → Custom Domain
2. 도메인 추가 및 CNAME 설정

---

## 제한사항

### Render 무료 플랜
- 15분 비활성 시 휴면 (콜드 스타트 ~30초)
- 월 750시간 (1개 서비스 기준 충분)
- PostgreSQL 90일 후 자동 삭제

### 해결책
1. **UptimeRobot** (무료): 5분마다 핑 → 휴면 방지
   - https://uptimerobot.com
   - Monitor: `https://stock-portfolio-api.onrender.com/health`

2. **Cron-job.org** (무료): 정기 실행
   - 가격 수집 트리거: `POST /api/collector/collect`

---

## Ollama AI 기능

클라우드에서는 Ollama 사용 불가 (로컬 전용)

**대안**:
- 로컬에서만 AI 기능 사용
- 또는 OpenAI API 연동 (유료)

---

## 업데이트 방법

```bash
# 코드 수정 후
git add .
git commit -m "Update feature"
git push

# Render & Vercel 자동 재배포
```

---

## 문제 해결

### Render 빌드 실패
```bash
# 로그 확인
Render Dashboard → Logs

# 일반적인 문제
- Python 버전 호환성
- requirements.txt 패키지 충돌
```

### Vercel 빌드 실패
```bash
# 로그 확인
Vercel Dashboard → Deployments → Build Logs

# 일반적인 문제
- Node.js 버전
- 환경 변수 누락
```

---

## 비용 절약 팁

1. **하나의 백엔드만 유지**: 여러 서비스 = 시간 분산
2. **캐싱 활용**: API 응답 캐싱으로 요청 감소
3. **휴면 활용**: 주간 사용 시 야간 휴면 OK

---

**작성일**: 2025-12-16
