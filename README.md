# Claude Notifier

Claude Code 플러그인 - Telegram 알림 및 양방향 통신

## 설치

```bash
/plugin install ugonfor/claude-notifier
```

## 환경변수

```bash
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id
```

## 사용

```
> "Telegram으로 알림 보내줘"
> /claude-notifier:notify 빌드 완료!
> /claude-notifier:status
```

## MCP Tools

| Tool | 설명 |
|------|------|
| `send_telegram` | 메시지 전송 |
| `receive_telegram` | 응답 대기 (양방향) |
| `check_status` | 설정 상태 확인 |

## Telegram 설정

1. [@BotFather](https://t.me/BotFather)에서 봇 생성
2. 봇에게 메시지 전송
3. `https://api.telegram.org/bot<TOKEN>/getUpdates`에서 chat_id 확인

## 라이선스

MIT
