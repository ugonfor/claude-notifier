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

## Workflow

1. **Check permissions**: Before starting, verify all 3 MCP tools are allowed:
   - `mcp__claude-notifier__check_status`
   - `mcp__claude-notifier__send_telegram`
   - `mcp__claude-notifier__receive_telegram`

   If any permission is denied or requires approval, inform the user:
   ```
   Telegram 대화 모드를 사용하려면 MCP 도구 권한이 필요합니다.

   ~/.claude/settings.json에 다음을 추가하거나, 각 도구 사용 시 "Always allow"를 선택하세요:

   {
     "permissions": {
       "allow": [
         "mcp__claude-notifier__send_telegram",
         "mcp__claude-notifier__receive_telegram",
         "mcp__claude-notifier__check_status"
       ]
     }
   }
   ```

2. **Check status**: Use `check_status` to verify Telegram is configured
3. **Send entry message**: Use `send_telegram` to notify user that chat mode started
4. **Chat loop**:
   - Use `receive_telegram` with timeout=300
   - Check if message is an exit keyword → if yes, exit loop
   - Generate response to the message
   - Use `send_telegram` to send response
   - Repeat loop
5. **Exit**: Send goodbye message and return to CLI

## Instructions

When entering Telegram chat mode:

1. First, attempt to use MCP tools. If permission prompts appear, guide the user to allow them or configure settings.json
2. Call `check_status` to ensure Telegram is properly configured (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
3. Send an entry message: "Telegram 대화 모드 시작! 'exit' 또는 '종료'로 CLI로 돌아갈 수 있습니다."
4. Enter the chat loop:
   ```
   LOOP:
     message = receive_telegram(timeout=300)

     IF timeout occurred:
       send_telegram("아직 계신가요? 메시지를 기다리고 있습니다...")
       CONTINUE loop

     IF message matches exit keywords (exit, quit, 종료, CLI로 돌아가, 터미널로 돌아가):
       send_telegram("Telegram 대화 모드 종료. CLI로 돌아갑니다!")
       BREAK loop

     response = generate response to message
     send_telegram(response)
     CONTINUE loop
   ```
5. After exiting loop, inform user in CLI that they're back

## Example Conversation

```
[CLI] User: "텔레그램으로 대화하자"

[Telegram] Claude: "Telegram 대화 모드 시작! 'exit' 또는 '종료'로 CLI로 돌아갈 수 있습니다."

[Telegram] User: "오늘 날씨 어때?"
[Telegram] Claude: "죄송합니다, 실시간 날씨 정보에는 접근할 수 없습니다. 다른 질문이 있으시면 말씀해주세요!"

[Telegram] User: "exit"
[Telegram] Claude: "Telegram 대화 모드 종료. CLI로 돌아갑니다!"

[CLI] Claude: "Telegram 대화 모드를 종료했습니다. 터미널에서 계속 대화하실 수 있습니다."
```

## Tools Used

- `check_status`: Verify Telegram configuration
- `send_telegram`: Send messages to user
- `receive_telegram`: Wait for user messages (timeout: 300 seconds)
