#!/bin/bash
#
# Telegram 양방향 통신 스크립트
# 알림을 보내고 사용자 응답을 기다립니다.
#

TITLE="$1"
BODY="$2"
REQUEST_ID="$3"

RESPONSE_DIR="${CLAUDE_NOTIFIER_RESPONSE_DIR:-/tmp/claude-notifier}"
RESPONSE_TIMEOUT="${CLAUDE_NOTIFIER_TIMEOUT:-300}"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set" >&2
    exit 1
fi

mkdir -p "$RESPONSE_DIR"

# 메시지 구성 (인라인 키보드 포함)
MESSAGE="<b>$TITLE</b>

$BODY"

# 인라인 키보드와 함께 메시지 전송
KEYBOARD=$(cat <<EOF
{
  "inline_keyboard": [
    [
      {"text": "허용", "callback_data": "accept:$REQUEST_ID"},
      {"text": "거부", "callback_data": "reject:$REQUEST_ID"}
    ],
    [
      {"text": "Plan 모드", "callback_data": "plan:$REQUEST_ID"}
    ]
  ]
}
EOF
)

# 메시지 전송
SEND_RESPONSE=$(curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{
        \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
        \"text\": $(echo -n "$MESSAGE" | jq -sR .),
        \"parse_mode\": \"HTML\",
        \"reply_markup\": $KEYBOARD
    }" \
    --connect-timeout 10 \
    --max-time 30)

if ! echo "$SEND_RESPONSE" | grep -q '"ok":true'; then
    echo "Failed to send Telegram message: $SEND_RESPONSE" >&2
    exit 1
fi

# 메시지 ID 추출
MESSAGE_ID=$(echo "$SEND_RESPONSE" | jq -r '.result.message_id')

# 마지막 update_id 저장 (이후 업데이트만 처리하기 위해)
LAST_UPDATE_RESPONSE=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1&limit=1")
LAST_UPDATE_ID=$(echo "$LAST_UPDATE_RESPONSE" | jq -r '.result[-1].update_id // 0')

# 응답 대기 (polling)
START_TIME=$(date +%s)

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))

    if [ $ELAPSED -ge $RESPONSE_TIMEOUT ]; then
        # 타임아웃 - 키보드 제거
        curl -s -X POST \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup" \
            -H "Content-Type: application/json" \
            -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"message_id\": $MESSAGE_ID}" \
            > /dev/null

        echo "timeout" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
        exit 0
    fi

    # 새 업데이트 확인
    UPDATES=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=$((LAST_UPDATE_ID + 1))&timeout=5")

    # callback_query 처리 (버튼 클릭)
    CALLBACK_DATA=$(echo "$UPDATES" | jq -r ".result[] | select(.callback_query.data | startswith(\"accept:$REQUEST_ID\") or startswith(\"reject:$REQUEST_ID\") or startswith(\"plan:$REQUEST_ID\")) | .callback_query.data" 2>/dev/null | head -1)

    if [ -n "$CALLBACK_DATA" ]; then
        # callback_query ID 추출
        CALLBACK_QUERY_ID=$(echo "$UPDATES" | jq -r ".result[] | select(.callback_query.data == \"$CALLBACK_DATA\") | .callback_query.id" | head -1)
        UPDATE_ID=$(echo "$UPDATES" | jq -r ".result[] | select(.callback_query.data == \"$CALLBACK_DATA\") | .update_id" | head -1)

        # callback 응답
        curl -s -X POST \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery" \
            -d "callback_query_id=$CALLBACK_QUERY_ID" \
            -d "text=응답이 처리되었습니다." \
            > /dev/null

        # 메시지 업데이트 (키보드 제거 및 결과 표시)
        ACTION=$(echo "$CALLBACK_DATA" | cut -d: -f1)
        case "$ACTION" in
            "accept")
                RESULT_TEXT="$MESSAGE\n\n<b>허용됨</b>"
                echo "/y" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
                ;;
            "reject")
                RESULT_TEXT="$MESSAGE\n\n<b>거부됨</b>"
                echo "/n" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
                ;;
            "plan")
                RESULT_TEXT="$MESSAGE\n\n<b>Plan 모드로 전환 요청</b>"
                echo "/plan" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
                ;;
        esac

        # 메시지 수정 (키보드 제거)
        curl -s -X POST \
            "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText" \
            -H "Content-Type: application/json" \
            -d "{
                \"chat_id\": \"${TELEGRAM_CHAT_ID}\",
                \"message_id\": $MESSAGE_ID,
                \"text\": $(echo -e "$RESULT_TEXT" | jq -sR .),
                \"parse_mode\": \"HTML\"
            }" \
            > /dev/null

        # update offset 처리
        curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=$((UPDATE_ID + 1))" > /dev/null

        exit 0
    fi

    # 텍스트 메시지 응답 처리
    TEXT_RESPONSE=$(echo "$UPDATES" | jq -r ".result[] | select(.message.chat.id == $TELEGRAM_CHAT_ID) | .message.text" 2>/dev/null | head -1)

    if [ -n "$TEXT_RESPONSE" ] && [ "$TEXT_RESPONSE" != "null" ]; then
        UPDATE_ID=$(echo "$UPDATES" | jq -r ".result[] | select(.message.text == \"$TEXT_RESPONSE\") | .update_id" | head -1)

        case "$TEXT_RESPONSE" in
            "/y"|"/yes"|"/accept"|"y"|"yes")
                echo "/y" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
                curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=$((UPDATE_ID + 1))" > /dev/null
                exit 0
                ;;
            "/n"|"/no"|"/reject"|"n"|"no")
                echo "/n" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
                curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=$((UPDATE_ID + 1))" > /dev/null
                exit 0
                ;;
            "/plan"|"plan")
                echo "/plan" > "$RESPONSE_DIR/telegram-response-$REQUEST_ID"
                curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=$((UPDATE_ID + 1))" > /dev/null
                exit 0
                ;;
        esac

        # update offset 갱신
        LAST_UPDATE_ID=$UPDATE_ID
    fi

    sleep 2
done
