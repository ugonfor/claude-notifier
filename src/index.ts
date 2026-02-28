#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadConfig, validateTelegramConfig } from "./config.js";
import { sendTelegram, askSupervisor } from "./tools/telegram.js";

const config = loadConfig();

const server = new Server(
  {
    name: "claude-notifier",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_telegram",
        description:
          "Send a one-way notification via Telegram. For questions that need a reply, use ask_supervisor instead.",
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
      },
      {
        name: "ask_supervisor",
        description:
          "PRIMARY tool for supervisor communication. Sends a message via Telegram and waits for a reply. " +
          "On timeout, returns a timeout indicator — you should then proceed autonomously. " +
          "Use this instead of asking questions through the CLI.",
        inputSchema: {
          type: "object" as const,
          properties: {
            message: {
              type: "string",
              description: "The message to send to the supervisor",
            },
            timeout: {
              type: "number",
              description: "Timeout in seconds to wait for reply (default: 300)",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "check_status",
        description: "Check if Telegram is properly configured",
        inputSchema: {
          type: "object" as const,
          properties: {},
          required: [],
        },
      },
    ],
  };
});

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
              text: "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.",
            },
          ],
        };
      }

      const message = (args as { message: string; chat_id?: string }).message;
      const chatId = (args as { message: string; chat_id?: string }).chat_id;

      const result = await sendTelegram(telegramConfig, message, chatId);

      return {
        content: [
          {
            type: "text" as const,
            text: result.success
              ? `Telegram message sent. ID: ${result.messageId}`
              : `Failed: ${result.error}`,
          },
        ],
      };
    }

    case "ask_supervisor": {
      const telegramConfig = validateTelegramConfig(config);
      if (!telegramConfig) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.",
            },
          ],
        };
      }

      const message = (args as { message: string; timeout?: number }).message;
      const timeout =
        (args as { message: string; timeout?: number }).timeout ||
        config.interactive.timeout;

      const result = await askSupervisor(telegramConfig, message, timeout);

      if (result.replied) {
        return {
          content: [
            { type: "text" as const, text: `Supervisor replied: ${result.message}` },
          ],
        };
      } else if (result.timedOut) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No reply from supervisor within ${timeout}s. Proceed autonomously.`,
            },
          ],
        };
      } else {
        return {
          content: [
            { type: "text" as const, text: `Error: ${result.error}` },
          ],
        };
      }
    }

    case "check_status": {
      const telegramConfig = validateTelegramConfig(config);
      return {
        content: [
          {
            type: "text" as const,
            text: telegramConfig
              ? "Telegram: configured"
              : "Telegram: not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)",
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
