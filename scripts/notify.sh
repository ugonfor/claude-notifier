#!/bin/bash
#
# Claude Code Notification Script
# 사용자 입력이 필요할 때 메신저로 알림을 보냅니다.
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CLAUDE_NOTIFIER_CONFIG:-$HOME/.claude-notifier.env}"

# 설정 파일 로드
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# stdin에서 JSON 입력 받기 (Claude Code hooks가 전달)
INPUT=$(cat)

# JSON 파싱 (jq가 없으면 기본값 사용)
if command -v jq &> /dev/null; then
    NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.type // "unknown"' 2>/dev/null)
    MESSAGE=$(echo "$INPUT" | jq -r '.message // ""' 2>/dev/null)
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
    SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
else
    NOTIFICATION_TYPE="notification"
    MESSAGE="Claude Code needs your attention"
fi

# 프로젝트 경로 (환경변수에서)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROJECT_NAME=$(basename "$PROJECT_DIR")

# 알림 메시지 구성
case "$NOTIFICATION_TYPE" in
    "idle_prompt")
        TITLE="Claude Code 입력 대기"
        BODY="60초 이상 입력을 기다리고 있습니다."
        ;;
    "permission_prompt")
        TITLE="Claude Code 권한 요청"
        BODY="Accept/Reject 선택이 필요합니다."
        ;;
    "tool_error")
        TITLE="Claude Code 오류 발생"
        BODY="도구 실행 중 오류가 발생했습니다."
        ;;
    *)
        TITLE="Claude Code 알림"
        BODY="${MESSAGE:-작업이 완료되었습니다. 확인이 필요합니다.}"
        ;;
esac

# 추가 정보
if [ -n "$TOOL_NAME" ] && [ "$TOOL_NAME" != "null" ]; then
    BODY="$BODY\n도구: $TOOL_NAME"
fi
BODY="$BODY\n프로젝트: $PROJECT_NAME"

# 알림 전송 (활성화된 서비스로)
SENT=false

# Slack 알림
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    "$SCRIPT_DIR/slack.sh" "$TITLE" "$BODY" && SENT=true
fi

# Telegram 알림
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    "$SCRIPT_DIR/telegram.sh" "$TITLE" "$BODY" && SENT=true
fi

# Discord 알림 (옵션)
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    "$SCRIPT_DIR/discord.sh" "$TITLE" "$BODY" 2>/dev/null && SENT=true
fi

# 시스템 알림 (데스크톱)
if [ "$ENABLE_DESKTOP_NOTIFICATION" = "true" ]; then
    if command -v notify-send &> /dev/null; then
        notify-send "$TITLE" "$(echo -e "$BODY")"
        SENT=true
    elif command -v osascript &> /dev/null; then
        osascript -e "display notification \"$(echo -e "$BODY")\" with title \"$TITLE\""
        SENT=true
    fi
fi

# 로그 기록
if [ "$ENABLE_LOGGING" = "true" ]; then
    LOG_FILE="${LOG_PATH:-$HOME/.claude-notifier.log}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $NOTIFICATION_TYPE: $TITLE - $(echo -e "$BODY" | tr '\n' ' ')" >> "$LOG_FILE"
fi

exit 0
