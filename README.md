# Claude Notifier

> **Telegram-first supervisor communication for Claude Code**

[![npm](https://img.shields.io/npm/v/claude-notifier-mcp)](https://www.npmjs.com/package/claude-notifier-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

When Claude Code needs to ask the supervisor a question, it sends a Telegram message and waits 300s for a reply. No reply? It proceeds autonomously.

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `ask_supervisor` | Send message via Telegram + wait for reply. On timeout, proceed autonomously. Set `wait_for_reply=false` to notify without waiting. |
| `check_status` | Check if Telegram is configured |

---

## Install

### 1. Create a Telegram Bot

1. Send `/newbot` to [@BotFather](https://t.me/BotFather)
2. Copy the `TELEGRAM_BOT_TOKEN`
3. Send any message to your new bot
4. Get your `chat_id` from `https://api.telegram.org/bot<TOKEN>/getUpdates`

### 2. Add MCP Server

```bash
claude mcp add supervisor \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e TELEGRAM_CHAT_ID=your_chat_id \
  -s user \
  -- npx -y claude-notifier-mcp
```

### 3. Allow Permissions

Add to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__supervisor__ask_supervisor",
      "mcp__supervisor__check_status"
    ]
  }
}
```

---

## Ground Rule #9

Add this to your project's `CLAUDE.md` to enforce Telegram-first behavior:

> **Telegram-first communication.** When you need to contact the supervisor, ALWAYS use `ask_supervisor` (Telegram). Never ask via CLI. Wait 300s for a reply — if none, proceed autonomously and notify your decision via `ask_supervisor(wait_for_reply=false)`.

---

## Environment Variables

| Variable | Required | Description | Default |
|----------|:--------:|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram Bot API token | - |
| `TELEGRAM_CHAT_ID` | Yes | Target Chat ID | - |
| `CLAUDE_NOTIFIER_TIMEOUT` | No | Reply timeout in seconds | 300 |

---

## License

MIT
