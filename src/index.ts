#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  loadConfig,
  validateTelegramConfig,
  validateSlackConfig,
  validateDiscordConfig,
} from "./config.js";
import { sendTelegram, receiveTelegram } from "./tools/telegram.js";
import { sendSlack } from "./tools/slack.js";
import { sendDiscord } from "./tools/discord.js";

const config = loadConfig();

const server = new Server(
  {
    name: "claude-notifier-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [];

  // Telegram tools (always available, config checked at runtime)
  tools.push({
    name: "send_telegram",
    description:
      "Send a notification message via Telegram. Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "The message to send",
        },
        chat_id: {
          type: "string",
          description: "Optional: Override the default chat ID",
        },
      },
      required: ["message"],
    },
  });

  tools.push({
    name: "receive_telegram",
    description:
      "Wait for a response from the user via Telegram. Returns the user's message. Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables.",
    inputSchema: {
      type: "object" as const,
      properties: {
        timeout: {
          type: "number",
          description: "Timeout in seconds (default: 300)",
        },
      },
      required: [],
    },
  });

  // Slack tool
  tools.push({
    name: "send_slack",
    description:
      "Send a notification message via Slack webhook. Requires SLACK_WEBHOOK_URL environment variable.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "The message to send",
        },
        title: {
          type: "string",
          description: "Optional: Message title/header",
        },
      },
      required: ["message"],
    },
  });

  // Discord tool
  tools.push({
    name: "send_discord",
    description:
      "Send a notification message via Discord webhook. Requires DISCORD_WEBHOOK_URL environment variable.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "The message to send",
        },
        title: {
          type: "string",
          description: "Optional: Message title",
        },
      },
      required: ["message"],
    },
  });

  // Status check tool
  tools.push({
    name: "check_status",
    description:
      "Check the configuration status of all notification channels (Telegram, Slack, Discord)",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  });

  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "send_telegram": {
      const telegramConfig = validateTelegramConfig(config);
      if (!telegramConfig) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Please set these environment variables.",
            },
          ],
        };
      }

      const message = (args as { message: string; chat_id?: string }).message;
      const chatId = (args as { message: string; chat_id?: string }).chat_id;

      const result = await sendTelegram(telegramConfig, message, chatId);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Telegram message sent successfully. Message ID: ${result.messageId}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to send Telegram message: ${result.error}`,
            },
          ],
        };
      }
    }

    case "receive_telegram": {
      const telegramConfig = validateTelegramConfig(config);
      if (!telegramConfig) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured. Please set these environment variables.",
            },
          ],
        };
      }

      const timeout =
        (args as { timeout?: number }).timeout || config.interactive.timeout;

      const result = await receiveTelegram(telegramConfig, timeout);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: `User response: ${result.message}`,
            },
          ],
        };
      } else if (result.timedOut) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Timeout: No response received within ${timeout} seconds.`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to receive Telegram message: ${result.error}`,
            },
          ],
        };
      }
    }

    case "send_slack": {
      const slackConfig = validateSlackConfig(config);
      if (!slackConfig) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: SLACK_WEBHOOK_URL is not configured. Please set this environment variable.",
            },
          ],
        };
      }

      const message = (args as { message: string; title?: string }).message;
      const title = (args as { message: string; title?: string }).title;

      const result = await sendSlack(slackConfig, message, title);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Slack message sent successfully.",
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to send Slack message: ${result.error}`,
            },
          ],
        };
      }
    }

    case "send_discord": {
      const discordConfig = validateDiscordConfig(config);
      if (!discordConfig) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: DISCORD_WEBHOOK_URL is not configured. Please set this environment variable.",
            },
          ],
        };
      }

      const message = (args as { message: string; title?: string }).message;
      const title = (args as { message: string; title?: string }).title;

      const result = await sendDiscord(discordConfig, message, title);

      if (result.success) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Discord message sent successfully.",
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to send Discord message: ${result.error}`,
            },
          ],
        };
      }
    }

    case "check_status": {
      const telegramConfig = validateTelegramConfig(config);
      const slackConfig = validateSlackConfig(config);
      const discordConfig = validateDiscordConfig(config);

      const status = {
        telegram: telegramConfig
          ? "configured"
          : "not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)",
        slack: slackConfig
          ? "configured"
          : "not configured (missing SLACK_WEBHOOK_URL)",
        discord: discordConfig
          ? "configured"
          : "not configured (missing DISCORD_WEBHOOK_URL)",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: `Notification Channel Status:\n- Telegram: ${status.telegram}\n- Slack: ${status.slack}\n- Discord: ${status.discord}`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${name}`,
          },
        ],
      };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
