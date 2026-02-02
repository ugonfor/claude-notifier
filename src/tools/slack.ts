export interface SlackConfig {
  webhookUrl: string;
}

export interface SendSlackResult {
  success: boolean;
  error?: string;
}

export async function sendSlack(
  config: SlackConfig,
  message: string,
  title?: string
): Promise<SendSlackResult> {
  const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const headerText = title || "Claude Code Notification";

  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: headerText,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `${timestamp} | Claude Code Notifier`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
