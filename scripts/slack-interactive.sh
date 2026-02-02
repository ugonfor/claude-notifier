#!/bin/bash
#
# Slack 양방향 통신 스크립트
# Slack App과 Socket Mode를 사용하여 응답을 받습니다.
#
# 주의: Slack Webhook은 단방향이므로, 양방향 통신을 위해서는
# Slack App + Socket Mode 또는 Slack Bolt를 사용해야 합니다.
#
# 이 스크립트는 간단한 구현을 위해 파일 기반 응답을 사용합니다.
# 실제 환경에서는 Slack Bolt 서버를 별도로 운영하는 것을 권장합니다.
#

TITLE="$1"
BODY="$2"
REQUEST_ID="$3"

RESPONSE_DIR="${CLAUDE_NOTIFIER_RESPONSE_DIR:-/tmp/claude-notifier}"

if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "Error: SLACK_WEBHOOK_URL is not set" >&2
    exit 1
fi

mkdir -p "$RESPONSE_DIR"

# 응답 방법 안내 포함 메시지
MESSAGE="$BODY

*응답 방법:*
터미널에서 다음 명령어 실행:
\`\`\`
# 허용
echo 'y' > $RESPONSE_DIR/response-$REQUEST_ID

# 거부
echo 'n' > $RESPONSE_DIR/response-$REQUEST_ID

# Plan 모드
echo 'plan' > $RESPONSE_DIR/response-$REQUEST_ID
\`\`\`"

# 메시지 전송
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
        "text": "$MESSAGE"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Request ID: $REQUEST_ID | $(date '+%Y-%m-%d %H:%M:%S')"
        }
      ]
    }
  ]
}
EOF
)

curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    --connect-timeout 10 \
    --max-time 30 \
    > /dev/null

exit 0
