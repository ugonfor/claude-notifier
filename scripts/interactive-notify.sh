#!/bin/bash
#
# Claude Code Interactive Notification Script
# 사용자에게 알림을 보내고, 응답을 기다려 Claude Code에 전달합니다.
#
# PreToolUse hook에서 사용되며, 사용자가 메신저로 응답하면:
# - /accept 또는 /y -> 도구 실행 허용
# - /reject 또는 /n -> 도구 실행 차단
# - /plan -> Plan 모드로 전환하라는 메시지 표시
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CLAUDE_NOTIFIER_CONFIG:-$HOME/.claude-notifier.env}"
RESPONSE_DIR="${CLAUDE_NOTIFIER_RESPONSE_DIR:-/tmp/claude-notifier}"
RESPONSE_TIMEOUT="${CLAUDE_NOTIFIER_TIMEOUT:-300}"  # 5분 기본

# 설정 파일 로드
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 응답 디렉토리 생성
mkdir -p "$RESPONSE_DIR"

# stdin에서 JSON 입력 받기
INPUT=$(cat)

# JSON 파싱
if command -v jq &> /dev/null; then
    TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null)
    TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // {}' 2>/dev/null)
    SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)

    # 파일 경로 추출 (Edit/Write의 경우)
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // .path // ""' 2>/dev/null)

    # Bash 명령어 추출
    COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""' 2>/dev/null)
else
    TOOL_NAME="unknown"
    FILE_PATH=""
    COMMAND=""
fi

# 인터랙티브 모드 비활성화 시 바로 허용
if [ "$INTERACTIVE_MODE" = "false" ]; then
    exit 0
fi

# 프로젝트 정보
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROJECT_NAME=$(basename "$PROJECT_DIR")

# 고유 요청 ID 생성
REQUEST_ID="$(date +%s)-$$"
RESPONSE_FILE="$RESPONSE_DIR/response-$REQUEST_ID"

# 알림 메시지 구성
case "$TOOL_NAME" in
    "Edit"|"Write")
        ACTION_DESC="파일 수정"
        DETAIL="파일: $FILE_PATH"
        ;;
    "Bash")
        ACTION_DESC="명령어 실행"
        # 명령어가 길면 자르기
        if [ ${#COMMAND} -gt 100 ]; then
            DETAIL="명령어: ${COMMAND:0:100}..."
        else
            DETAIL="명령어: $COMMAND"
        fi
        ;;
    *)
        ACTION_DESC="도구 실행"
        DETAIL="도구: $TOOL_NAME"
        ;;
esac

MESSAGE="Claude Code가 작업을 수행하려 합니다.

$ACTION_DESC
$DETAIL
프로젝트: $PROJECT_NAME

응답:
/y - 허용
/n - 거부
/plan - Plan 모드로 전환

요청 ID: $REQUEST_ID"

# 알림 전송 함수
send_notification() {
    local title="$1"
    local body="$2"

    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        "$SCRIPT_DIR/telegram-interactive.sh" "$title" "$body" "$REQUEST_ID" &
        return 0
    fi

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        "$SCRIPT_DIR/slack.sh" "$title" "$body"
        return 0
    fi

    return 1
}

# 응답 대기 함수
wait_for_response() {
    local timeout=$1
    local start_time=$(date +%s)

    while true; do
        # 응답 파일 확인
        if [ -f "$RESPONSE_FILE" ]; then
            RESPONSE=$(cat "$RESPONSE_FILE")
            rm -f "$RESPONSE_FILE"
            echo "$RESPONSE"
            return 0
        fi

        # Telegram에서 직접 응답 폴링 (telegram-interactive.sh가 처리)
        if [ -f "$RESPONSE_DIR/telegram-response-$REQUEST_ID" ]; then
            RESPONSE=$(cat "$RESPONSE_DIR/telegram-response-$REQUEST_ID")
            rm -f "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
            echo "$RESPONSE"
            return 0
        fi

        # 타임아웃 체크
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        if [ $elapsed -ge $timeout ]; then
            echo "timeout"
            return 1
        fi

        sleep 2
    done
}

# 메인 로직
if [ "$ENABLE_INTERACTIVE" = "true" ]; then
    # 알림 전송
    send_notification "Claude Code 확인 요청" "$MESSAGE"

    # 응답 대기
    RESPONSE=$(wait_for_response $RESPONSE_TIMEOUT)

    case "$RESPONSE" in
        "/y"|"/yes"|"/accept"|"y"|"yes"|"accept")
            # 허용 - 빈 출력 또는 allow
            echo '{"decision": "allow"}'
            ;;
        "/n"|"/no"|"/reject"|"n"|"no"|"reject")
            # 거부
            echo '{"decision": "block", "reason": "사용자가 메신저에서 거부했습니다."}'
            ;;
        "/plan"|"plan")
            # Plan 모드 전환 요청
            echo '{"decision": "block", "reason": "Plan 모드로 전환하세요. (Shift+Tab)"}'

            # 추가 알림 전송
            if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
                "$SCRIPT_DIR/telegram.sh" "Plan 모드 전환" "Shift+Tab을 눌러 Plan 모드로 전환하세요."
            fi
            ;;
        "timeout")
            # 타임아웃 - 기본적으로 허용 (또는 거부로 변경 가능)
            if [ "$TIMEOUT_ACTION" = "block" ]; then
                echo '{"decision": "block", "reason": "응답 타임아웃"}'
            else
                # 기본: 허용
                exit 0
            fi
            ;;
        *)
            # 알 수 없는 응답 - 허용
            exit 0
            ;;
    esac
else
    # 인터랙티브 모드가 아니면 단순 알림만
    "$SCRIPT_DIR/notify.sh" <<< "$INPUT"
fi

exit 0
