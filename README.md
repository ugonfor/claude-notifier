# Claude Notifier

Claude Code 플러그인 - Telegram 알림 및 양방향 통신

## 설치

```bash
# 1. 마켓플레이스 추가 (최초 1회)
claude plugin marketplace add ugonfor/claude-notifier

# 2. 플러그인 설치
claude plugin install claude-notifier
```

## 환경변수

```bash
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id
```

## 사용

### 알림 보내기
```
> "Telegram으로 알림 보내줘"
> /claude-notifier:notify 빌드 완료!
> /claude-notifier:status
```

### Telegram 대화 모드
Telegram을 통해 Claude와 대화할 수 있습니다.

```
> "텔레그램으로 대화하자"
> /claude-notifier:chat
```

**진입**: CLI에서 위 명령어 입력
**종료**: Telegram에서 `exit`, `quit`, `종료`, `CLI로 돌아가` 입력

## 권한 설정 (선택)

매번 permission 승인 없이 사용하려면 `~/.claude/settings.json`에 추가:

```json
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
