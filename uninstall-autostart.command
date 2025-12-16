#!/bin/bash
# Stock Portfolio Genius - 자동 시작 제거

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📈 자동 시작 제거"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PLIST="$HOME/Library/LaunchAgents/com.stockportfolio.autostart.plist"

if [ -f "$PLIST" ]; then
    # 에이전트 언로드
    launchctl unload "$PLIST" 2>/dev/null

    # 파일 삭제
    rm "$PLIST"

    echo "✅ 자동 시작이 제거되었습니다."
else
    echo "ℹ️  자동 시작 설정이 없습니다."
fi

echo ""
read -p "아무 키나 누르면 종료..."
