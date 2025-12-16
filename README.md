# 📊 Stock Portfolio Genius

**미국 주식 투자 분석, 포트폴리오 관리, AI 투자 비서 시스템**

자기 강화 학습 기반으로 시간이 지날수록 더 정교해지는 "나만의 천재 투자 비서"

---

## ✨ 주요 기능

### 📈 대시보드
- 총 자산 및 수익률 현황
- 포트폴리오 가치 변동 차트
- 섹터별 배분 분석
- 보유 종목 실시간 시세

### 📊 기술적 분석
- TradingView 스타일 캔들차트
- RSI, MACD, 볼린저밴드
- 이동평균선 (SMA 20/50/200)
- 매수/매도 시그널

### 🤖 AI 투자 비서
- 규칙 기반 매매 신호
- 로컬 LLM (Ollama) 통합
- 개인화된 투자 조언
- 레벨 시스템으로 성장하는 비서

### 📚 자기 강화 학습
- 거래 결과 학습
- 규칙 가중치 자동 조정
- 패턴 자동 발견
- 예측 추적 및 검증

---

## 🛠️ 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TradingView Lightweight Charts
- Zustand (상태 관리)
- TanStack Query

### Backend
- Python FastAPI
- SQLite (SQLAlchemy)
- pandas + ta (기술적 분석)
- Ollama (로컬 LLM)

### Data Sources
- yfinance (Primary)
- Finnhub
- Tiingo
- Alpha Vantage

---

## 🚀 시작하기

### 요구사항
- Python 3.9+
- Node.js 18+
- macOS (권장)

### 설치

```bash
# 1. 프로젝트 클론
cd stock-portfolio-genius

# 2. 시작 스크립트 실행
./scripts/start.sh
```

### 수동 설치

#### Backend
```bash
cd backend

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env

# 서버 실행
python main.py
```

#### Frontend
```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Ollama 설치 (AI 비서용)

```bash
# Homebrew로 설치
brew install ollama

# 서비스 시작
ollama serve

# 다른 터미널에서 모델 다운로드
ollama pull llama3.1:8b
```

---

## 🔑 API 키 설정 (선택)

더 정확한 실시간 데이터를 원하시면 무료 API 키를 발급받아 `.env` 파일에 추가하세요:

1. **Finnhub**: https://finnhub.io/ (60회/분)
2. **Tiingo**: https://www.tiingo.com/ (1000회/일)
3. **Alpha Vantage**: https://www.alphavantage.co/ (25회/일)

기본적으로 yfinance(Yahoo Finance)만으로도 동작합니다.

---

## 📱 사용법

### 접속
- **웹앱**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs

### 주요 화면
1. **대시보드**: 포트폴리오 현황 한눈에 보기
2. **분석**: 개별 종목 기술적 분석
3. **거래**: 매수/매도 기록 관리
4. **AI 비서**: 투자 조언 및 알림

---

## 📁 프로젝트 구조

```
stock-portfolio-genius/
├── frontend/           # Next.js 앱
│   ├── src/
│   │   ├── app/        # 페이지
│   │   ├── components/ # UI 컴포넌트
│   │   └── lib/        # 유틸리티
│   └── package.json
│
├── backend/            # FastAPI 앱
│   ├── main.py         # 진입점
│   ├── core/           # 설정
│   ├── models/         # DB 모델
│   └── services/       # 비즈니스 로직
│
├── data/               # SQLite DB
├── scripts/            # 실행 스크립트
└── README.md
```

---

## ⚠️ 주의사항

- 이 앱은 **참고용**이며 투자 결정에 대한 책임은 사용자에게 있습니다
- yfinance 데이터는 **15분 지연**될 수 있습니다
- 모든 데이터는 **로컬에 저장**됩니다 (클라우드 연동 없음)

---

## 📄 License

MIT License
