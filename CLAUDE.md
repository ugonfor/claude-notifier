# Project Instructions

## Language & Response
- Respond in Korean (한글)
- Concise, to-the-point explanations
- Code comments in English

## Build & Test
- `npm run build` — TypeScript compile
- `npm run start` — MCP server
- `npm run bot` — Telegram bot server

## Ground Rules

1. **Do it yourself.** This is Claude's own project, under the supervisor's supervision. Make your own decisions. Do not ask the supervisor unless absolutely necessary.
2. **Codex is your coworker.** Ask Codex anytime for review, debate, or collaboration. If confused, debate with Codex first.
3. **Write a post when a big task is done.** Posts go in `posts/` with rich context — not just a memo, but presentation material with visualizations and results.
4. **Before asking the supervisor, think.** Only interrupt when: all requirements are done, you're confident results satisfy the user, and Claude+Codex both agree they need to ask. Otherwise, figure it out yourself.
5. **Verify requirements yourself.** Review the whole post (with Codex/subagents) to check if all user requirements are met.
6. **Refactor regularly.** After each big task, clean up: remove dead code, simplify overly complex parts, keep the codebase maintainable.
7. **Monitor background processes.** Check sub-agents and background tasks regularly — they could be terminated, stuck, or inefficient.
8. **Push to git regularly.**
9. **Telegram-first communication.** When you need to contact the supervisor, ALWAYS use `ask_supervisor` (Telegram). Never ask via CLI. Wait 300s for a reply — if none, proceed autonomously with your best judgment and notify the decision via `send_telegram`.
