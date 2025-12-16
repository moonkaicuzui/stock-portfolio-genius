# Stock Portfolio Genius - Makefile
# 간편한 실행을 위한 명령어 모음

.PHONY: start stop install dev backend frontend clean help

# 기본 명령어 (make만 실행하면 도움말 표시)
help:
	@echo ""
	@echo "🚀 Stock Portfolio Genius 명령어"
	@echo ""
	@echo "  make start     - 백엔드 + 프론트엔드 동시 실행"
	@echo "  make install   - 모든 의존성 설치"
	@echo "  make backend   - 백엔드만 실행"
	@echo "  make frontend  - 프론트엔드만 실행"
	@echo "  make clean     - 캐시 및 빌드 파일 삭제"
	@echo ""

# 전체 앱 실행
start:
	@chmod +x scripts/start.sh
	@./scripts/start.sh

# 의존성 설치
install:
	@echo "📦 의존성 설치 중..."
	@cd backend && pip install -r requirements.txt
	@cd frontend && npm install
	@echo "✅ 설치 완료!"

# 백엔드만 실행
backend:
	@echo "📡 백엔드 시작..."
	@cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 프론트엔드만 실행
frontend:
	@echo "🎨 프론트엔드 시작..."
	@cd frontend && npm run dev

# 캐시 정리
clean:
	@echo "🧹 캐시 정리 중..."
	@rm -rf frontend/.next
	@rm -rf frontend/node_modules/.cache
	@rm -rf backend/__pycache__
	@echo "✅ 정리 완료!"

# 빌드
build:
	@echo "🔨 프로덕션 빌드 중..."
	@cd frontend && npm run build
	@echo "✅ 빌드 완료!"
