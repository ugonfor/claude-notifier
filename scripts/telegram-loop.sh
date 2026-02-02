#!/bin/bash

# Telegram Auto-Loop Script for Claude Code Stop Hook
# This script implements automatic message polling when in Telegram chat mode

FLAG_FILE="/tmp/claude-telegram-mode"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
CHAT_ID="${TELEGRAM_CHAT_ID}"

# 1. Check flag file - exit if not in Telegram mode
if [ ! -f "$FLAG_FILE" ]; then
  exit 0
fi

# 2. Prevent infinite loop (check stop_hook_active)
INPUT=$(cat)
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# 3. Get latest update_id to avoid processing old messages
LAST_UPDATE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1&limit=1")
LAST_ID=$(echo "$LAST_UPDATE" | jq -r '.result[0].update_id // 0')
OFFSET=$((LAST_ID + 1))

# 4. Long polling - wait for new message (max 300 seconds)
RESPONSE=$(curl -s --max-time 300 \
  "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${OFFSET}&timeout=300&allowed_updates=[\"message\"]")

# Extract message from the specific chat
MESSAGE=$(echo "$RESPONSE" | jq -r ".result[] | select(.message.chat.id == ${CHAT_ID}) | .message.text" | head -1)

# Handle timeout - no message received
if [ -z "$MESSAGE" ]; then
  cat <<EOF
{
  "decision": "block",
  "reason": "Telegram 메시지 대기 중 타임아웃. 계속 대기합니다."
}
EOF
  exit 0
fi

# 5. Check for exit keywords
if echo "$MESSAGE" | grep -qiE "^(exit|quit|종료|CLI로 돌아가|터미널로 돌아가)$"; then
  # Send exit confirmation message
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=Telegram 대화 모드 종료. CLI로 돌아갑니다!" \
    -d "parse_mode=HTML" > /dev/null

  # Remove flag file to exit chat mode
  rm -f "$FLAG_FILE"
  exit 0
fi

# 6. Pass message to Claude via block decision
# Escape special characters for JSON
ESCAPED_MESSAGE=$(echo "$MESSAGE" | jq -Rs '.')
ESCAPED_MESSAGE=${ESCAPED_MESSAGE:1:-1}  # Remove surrounding quotes from jq

cat <<EOF
{
  "decision": "block",
  "reason": "Telegram 메시지: ${ESCAPED_MESSAGE}"
}
EOF
