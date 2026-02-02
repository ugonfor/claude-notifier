#!/bin/bash
#
# Discord 알림 전송 스크립트
#

TITLE="$1"
BODY="$2"

if [ -z "$DISCORD_WEBHOOK_URL" ]; then
    echo "Error: DISCORD_WEBHOOK_URL is not set" >&2
    exit 1
fi

# 줄바꿈 처리
BODY_ESCAPED=$(echo -e "$BODY" | sed 's/\\n/\n/g')

# Discord Embed 메시지 구성
PAYLOAD=$(cat <<EOF
{
  "embeds": [
    {
      "title": "$TITLE",
      "description": "$BODY_ESCAPED",
      "color": 5814783,
      "footer": {
        "text": "Claude Code Notifier | $(date '+%Y-%m-%d %H:%M:%S')"
      }
    }
  ]
}
EOF
)

# 전송
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    --connect-timeout 10 \
    --max-time 30)

if [ "$RESPONSE" = "204" ] || [ "$RESPONSE" = "200" ]; then
    exit 0
else
    echo "Discord notification failed with status: $RESPONSE" >&2
    exit 1
fi
