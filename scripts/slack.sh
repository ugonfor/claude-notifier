#!/bin/bash
#
# Slack 알림 전송 스크립트
#

TITLE="$1"
BODY="$2"

if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "Error: SLACK_WEBHOOK_URL is not set" >&2
    exit 1
fi

# 줄바꿈 처리
BODY_ESCAPED=$(echo -e "$BODY" | sed 's/\\n/\n/g')

# Slack Block Kit 메시지 구성
PAYLOAD=$(cat <<EOF
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "$TITLE",
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "$BODY_ESCAPED"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "$(date '+%Y-%m-%d %H:%M:%S') | Claude Code Notifier"
        }
      ]
    }
  ]
}
EOF
)

# 전송
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    --connect-timeout 10 \
    --max-time 30)

if [ "$RESPONSE" = "200" ]; then
    exit 0
else
    echo "Slack notification failed with status: $RESPONSE" >&2
    exit 1
fi
