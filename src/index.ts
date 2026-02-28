#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { loadConfig, validateTelegramConfig } from "./config.js";
import { askSupervisor } from "./tools/telegram.js";

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
        name: "ask_supervisor",
        description:
          "PRIMARY tool for supervisor communication. Sends a message via Telegram and waits for a reply. " +
          "On timeout, returns a timeout indicator — you should then proceed autonomously. " +
          "Set wait_for_reply=false to send a notification without waiting (e.g. to report an autonomous decision). " +
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
            wait_for_reply: {
              type: "boolean",
              description: "Set false to send without waiting for reply (default: true)",
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

      const { message, timeout: t, wait_for_reply: w } =
        args as { message: string; timeout?: number; wait_for_reply?: boolean };
      const timeout = t || config.interactive.timeout;
      const waitForReply = w !== false;

      const result = await askSupervisor(telegramConfig, message, timeout, waitForReply);

      if (!waitForReply) {
        return {
          content: [
            {
              type: "text" as const,
              text: result.error
                ? `Error: ${result.error}`
                : "Message sent to supervisor.",
            },
          ],
        };
      }

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
