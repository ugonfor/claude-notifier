---
name: notify
description: Send notifications via Telegram. Use when the user asks to send a notification or message through Telegram.
---

# Telegram Notification Skill

Send notifications via Telegram using MCP tools.

## Tools

- `send_telegram`: Send message
- `receive_telegram`: Wait for user response (bidirectional)
- `check_status`: Check if configured

## Examples

- "Telegram으로 알림 보내줘" → use `send_telegram`
- "작업 완료되면 알림 보내고 응답 기다려" → use `send_telegram` then `receive_telegram`
