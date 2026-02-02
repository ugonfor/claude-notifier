---
name: notify
description: Send notifications via Telegram, Slack, or Discord. Use when the user asks to send a notification, alert, or message through a messenger platform.
---

# Notification Skill

Send notifications to messenger platforms using the MCP tools provided by claude-notifier.

## Available Tools

- `send_telegram`: Send message via Telegram
- `send_slack`: Send message via Slack
- `send_discord`: Send message via Discord
- `receive_telegram`: Wait for user response via Telegram (bidirectional)
- `check_status`: Check which channels are configured

## Usage Guidelines

1. When user asks to send a notification, use the appropriate tool based on the platform they specify
2. If no platform is specified, use `check_status` first to see which channels are available
3. For Telegram bidirectional communication, use `send_telegram` followed by `receive_telegram`
4. Always confirm successful delivery to the user

## Examples

- "Telegram으로 빌드 완료 알림 보내줘" → use `send_telegram`
- "Slack에 배포 상태 알려줘" → use `send_slack`
- "Discord로 에러 알림 보내줘" → use `send_discord`
- "작업 완료되면 알림 보내고 응답 기다려줘" → use `send_telegram` then `receive_telegram`
