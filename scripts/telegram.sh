#!/bin/bash
#
# Telegram 알림 전송 스크립트
#

TITLE="$1"
BODY="$2"

if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set" >&2
    exit 1
fi

# 줄바꿈 처리
BODY_ESCAPED=$(echo -e "$BODY" | sed 's/\\n/\n/g')

# 메시지 구성 (HTML 형식)
MESSAGE="<b>$TITLE</b>

$BODY_ESCAPED

<i>$(date '+%Y-%m-%d %H:%M:%S')</i>"

# URL 인코딩된 메시지
ENCODED_MESSAGE=$(echo -n "$MESSAGE" | jq -sRr @uri 2>/dev/null || echo -n "$MESSAGE" | sed 's/ /%20/g; s/\n/%0A/g')

# 전송
RESPONSE=$(curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${MESSAGE}" \
    -d "parse_mode=HTML" \
    --connect-timeout 10 \
    --max-time 30)

# 결과 확인
if echo "$RESPONSE" | grep -q '"ok":true'; then
    exit 0
else
    echo "Telegram notification failed: $RESPONSE" >&2
    exit 1
fi
