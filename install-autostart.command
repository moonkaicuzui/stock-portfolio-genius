#!/bin/bash
# Stock Portfolio Genius - 자동 시작 설치

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📈 자동 시작 설치"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 스크립트 위치
cd "$(dirname "$0")"
SOURCE_PLIST="$(pwd)/com.stockportfolio.autostart.plist"
DEST_PLIST="$HOME/Library/LaunchAgents/com.stockportfolio.autostart.plist"

# LaunchAgents 디렉토리 생성
mkdir -p "$HOME/Library/LaunchAgents"

# 기존 에이전트 언로드 (있으면)
launchctl unload "$DEST_PLIST" 2>/dev/null

# plist 복사
cp "$SOURCE_PLIST" "$DEST_PLIST"

# 권한 설정
chmod 644 "$DEST_PLIST"

# 에이전트 로드
launchctl load "$DEST_PLIST"

echo "✅ 자동 시작이 설치되었습니다!"
echo ""
echo "   Mac 로그인 시 Stock Portfolio Genius가 자동으로 시작됩니다."
echo ""
echo "   제거하려면: uninstall-autostart.command 실행"
echo ""
read -p "아무 키나 누르면 종료..."
