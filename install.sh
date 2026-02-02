#!/bin/bash
#
# Claude Notifier 설치 스크립트
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$HOME/.claude-notifier"
CLAUDE_SETTINGS_DIR="$HOME/.claude"

echo "Claude Notifier 설치를 시작합니다..."

# 1. 스크립트 복사
echo "스크립트 설치 중..."
mkdir -p "$INSTALL_DIR/scripts"
cp "$SCRIPT_DIR/scripts/"*.sh "$INSTALL_DIR/scripts/"
chmod +x "$INSTALL_DIR/scripts/"*.sh

# 2. 설정 파일 생성 (없는 경우)
CONFIG_FILE="$HOME/.claude-notifier.env"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "설정 파일 생성 중..."
    cp "$SCRIPT_DIR/.env.example" "$CONFIG_FILE"
    echo "  -> $CONFIG_FILE 파일을 편집하여 메신저 설정을 추가하세요."
else
    echo "  -> 기존 설정 파일이 있습니다: $CONFIG_FILE"
fi

# 3. Claude Code settings.json에 hooks 추가
echo ""
echo "Claude Code 설정에 hooks를 추가하시겠습니까?"
echo "  (기존 hooks 설정이 있다면 수동으로 병합해야 합니다)"
read -p "자동으로 추가할까요? [y/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p "$CLAUDE_SETTINGS_DIR"
    SETTINGS_FILE="$CLAUDE_SETTINGS_DIR/settings.json"

    if [ -f "$SETTINGS_FILE" ]; then
        echo "  -> 기존 settings.json이 있습니다. 백업 후 수동으로 병합하세요:"
        cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup"
        echo "  -> 백업: $SETTINGS_FILE.backup"
        echo ""
        echo "다음 hooks 설정을 settings.json에 추가하세요:"
        echo ""
        cat "$SCRIPT_DIR/hooks/settings.json"
    else
        cp "$SCRIPT_DIR/hooks/settings.json" "$SETTINGS_FILE"
        echo "  -> Claude Code hooks 설정이 추가되었습니다."
    fi
else
    echo ""
    echo "수동 설정 방법:"
    echo "  1. ~/.claude/settings.json 파일을 열거나 생성합니다"
    echo "  2. hooks/settings.json 내용을 복사하여 붙여넣습니다"
fi

echo ""
echo "============================================"
echo "설치 완료!"
echo "============================================"
echo ""
echo "다음 단계:"
echo "  1. ~/.claude-notifier.env 파일을 편집하여 메신저 설정을 추가하세요"
echo ""
echo "  Slack 설정:"
echo "    - https://api.slack.com/messaging/webhooks 에서 Webhook URL 생성"
echo "    - SLACK_WEBHOOK_URL 설정"
echo ""
echo "  Telegram 설정:"
echo "    - @BotFather에게 /newbot 명령으로 봇 생성"
echo "    - TELEGRAM_BOT_TOKEN 설정"
echo "    - 봇에게 메시지 보낸 후 Chat ID 확인하여 TELEGRAM_CHAT_ID 설정"
echo ""
echo "  2. Claude Code를 실행하여 테스트하세요"
echo ""
echo "문제가 있으면 다음 명령으로 테스트할 수 있습니다:"
echo "  echo '{\"type\":\"test\",\"message\":\"테스트 메시지\"}' | ~/.claude-notifier/scripts/notify.sh"
echo ""
