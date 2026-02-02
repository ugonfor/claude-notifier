---
name: chat
description: Interactive Telegram chat mode. Use when the user wants to have a conversation through Telegram instead of CLI.
---

# Telegram Chat Mode Skill

Enter interactive chat mode via Telegram. All conversation happens through Telegram until the user exits.

## Entry Triggers

- "텔레그램으로 대화하자"
- "Telegram chat mode"
- "텔레그램 모드"

## Exit Keywords

The chat loop ends when user sends any of these:
- `exit`
- `quit`
- `종료`
- `CLI로 돌아가`
- `터미널로 돌아가`

## Workflow (Stop Hook Based Auto-Loop)

This skill uses Stop Hook for automatic message polling. When Telegram chat mode is active, Claude's Stop Hook automatically waits for Telegram messages and blocks with the received message.

### Prerequisites

Ensure required tools/permissions:
- `mcp__claude-notifier__check_status`
- `mcp__claude-notifier__send_telegram`
- Bash tool for flag file management

If permissions are not available, inform the user:
```
Telegram 대화 모드를 사용하려면 MCP 도구 권한이 필요합니다.

~/.claude/settings.json에 다음을 추가하거나, 각 도구 사용 시 "Always allow"를 선택하세요:

{
  "permissions": {
    "allow": [
      "mcp__claude-notifier__send_telegram",
      "mcp__claude-notifier__check_status"
    ]
  }
}
```

### Entry Steps

1. **Check status**: Use `check_status` to verify Telegram is configured
2. **Create flag file**: Run `touch /tmp/claude-telegram-mode` via Bash
3. **Send entry message**: Use `send_telegram` to notify user:
   "Telegram 대화 모드 시작! 'exit' 또는 '종료'로 CLI로 돌아갈 수 있습니다."
4. **Wait for Hook**: After sending the entry message, Claude's turn ends and Stop Hook automatically handles message polling

### Auto-Loop Flow (Handled by Stop Hook)

```
[Claude sends response via send_telegram]
       ↓
[Claude's turn ends]
       ↓
[Stop Hook: telegram-loop.sh executes]
       ↓
1. Checks /tmp/claude-telegram-mode exists
   → No: exit (normal mode)
   → Yes: continue
       ↓
2. Long poll Telegram API (max 300s)
       ↓
3. On message received:
   → Exit keyword: Remove flag file + send goodbye + exit
   → Normal message: Block with {"decision":"block","reason":"Telegram 메시지: ..."}
       ↓
[Claude receives blocked reason as next input]
       ↓
[Claude generates response + sends via send_telegram]
       ↓
[Loop continues...]
```

### Exit Handling

Exit is automatically handled by the Stop Hook when user sends exit keywords.
The hook will:
1. Send goodbye message: "Telegram 대화 모드 종료. CLI로 돌아갑니다!"
2. Remove flag file `/tmp/claude-telegram-mode`
3. Exit cleanly (not blocking Claude)

After exit, inform user in CLI: "Telegram 대화 모드를 종료했습니다. 터미널에서 계속 대화하실 수 있습니다."

## Instructions

When entering Telegram chat mode:

1. First, call `check_status` to ensure Telegram is properly configured
2. Create the flag file to enable auto-loop:
   ```bash
   touch /tmp/claude-telegram-mode
   ```
3. Send entry message via `send_telegram`:
   "Telegram 대화 모드 시작! 'exit' 또는 '종료'로 CLI로 돌아갈 수 있습니다."
4. Your turn ends here - Stop Hook will handle the rest automatically
5. When Stop Hook blocks with a Telegram message:
   - Generate a helpful response to the message
   - Send response via `send_telegram`
   - Your turn ends, Stop Hook handles next message
6. When user exits (via exit keywords), the hook handles cleanup
7. After exiting, inform user in CLI that they're back

## Example Conversation

```
[CLI] User: "텔레그램으로 대화하자"

[Claude: creates /tmp/claude-telegram-mode flag file]
[Telegram] Claude: "Telegram 대화 모드 시작! 'exit' 또는 '종료'로 CLI로 돌아갈 수 있습니다."

[Stop Hook waits for Telegram message...]

[Telegram] User: "오늘 날씨 어때?"
[Stop Hook blocks with: "Telegram 메시지: 오늘 날씨 어때?"]
[Telegram] Claude: "죄송합니다, 실시간 날씨 정보에는 접근할 수 없습니다. 다른 질문이 있으시면 말씀해주세요!"

[Stop Hook waits for Telegram message...]

[Telegram] User: "exit"
[Stop Hook: removes flag file, sends goodbye, exits cleanly]
[Telegram] Claude: "Telegram 대화 모드 종료. CLI로 돌아갑니다!" (sent by hook)

[CLI] Claude: "Telegram 대화 모드를 종료했습니다. 터미널에서 계속 대화하실 수 있습니다."
```

## Tools Used

- `check_status`: Verify Telegram configuration
- `send_telegram`: Send messages to user
- Stop Hook (`scripts/telegram-loop.sh`): Auto-polls Telegram messages

## Flag File

- Location: `/tmp/claude-telegram-mode`
- Created on entry, removed on exit
- Stop Hook checks this file to determine if chat mode is active
