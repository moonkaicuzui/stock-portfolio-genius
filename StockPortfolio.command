#!/bin/bash
# Stock Portfolio Genius - 더블클릭으로 실행
# 백엔드 + 프론트엔드 동시 실행

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 스크립트 위치로 이동
cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  📈 Stock Portfolio Genius 시작 중...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 이전 프로세스 정리
echo -e "${YELLOW}▶ 이전 프로세스 정리 중...${NC}"
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1

# Ollama 확인
echo -e "${YELLOW}▶ Ollama 서비스 확인 중...${NC}"
if ! pgrep -x "ollama" > /dev/null; then
    echo -e "${YELLOW}  Ollama 시작 중...${NC}"
    ollama serve &>/dev/null &
    sleep 2
fi
echo -e "${GREEN}  ✓ Ollama 준비됨${NC}"

# 백엔드 시작
echo -e "${YELLOW}▶ 백엔드 서버 시작 중...${NC}"
cd "$PROJECT_DIR/backend"
source venv/bin/activate 2>/dev/null || {
    echo -e "${RED}  가상환경 활성화 실패. 설정을 확인하세요.${NC}"
    exit 1
}

# 백엔드 실행 (백그라운드)
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 3

# 백엔드 확인
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ 백엔드 서버 준비됨 (포트 8000)${NC}"
else
    echo -e "${YELLOW}  백엔드 시작 대기 중...${NC}"
    sleep 5
fi

# 프론트엔드 시작
echo -e "${YELLOW}▶ 프론트엔드 서버 시작 중...${NC}"
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
sleep 5

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Stock Portfolio Genius 실행 중!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐 앱 주소: ${GREEN}http://localhost:3000${NC}"
echo -e "  📡 API 문서: ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "  ${YELLOW}종료하려면 이 창을 닫거나 Ctrl+C를 누르세요${NC}"
echo ""

# 브라우저 열기 (3초 후)
sleep 3
open http://localhost:3000

# 종료 대기
trap "echo '종료 중...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
