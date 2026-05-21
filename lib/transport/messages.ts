// Message normalization between assistant-ui's UIMessage shape and the
// OpenAI/Hermes-2-Pro chat completion schema.

import type { UIMessage } from "ai";
import type { WebLLMRequestMessage } from "./types";

export function plainTextFromMessage(message: UIMessage): string {
  const parts = (message as { parts?: unknown }).parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part) => {
        if (typeof part !== "object" || part === null) return "";
        const withType = part as { type?: unknown; text?: unknown };
        if (withType.type === "text" && typeof withType.text === "string") {
          return withType.text;
        }
        return "";
      })
      .join("");
  }
  const withContent = message as UIMessage & { content?: string };
  return typeof withContent.content === "string" ? withContent.content : "";
}

/**
 * Convert assistant-ui UIMessages into the chat-completion schema.
 * System messages are dropped. The `userPreamble` is prepended to the
 * first user message.
 */
export function buildWebLLMMessages(
  messages: UIMessage[],
  userPreamble?: string,
): WebLLMRequestMessage[] {
  const mapped: WebLLMRequestMessage[] = [];
  let preambleAttached = false;

  for (const message of messages) {
    if (message.role === "system") continue;

    if (message.role === "user") {
      let content = plainTextFromMessage(message).trim();
      if (!preambleAttached && userPreamble && content.length > 0) {
        content = userPreamble + content;
        preambleAttached = true;
      }
      if (content) mapped.push({ role: "user", content });
      continue;
    }

    if (message.role === "assistant") {
      const text = plainTextFromMessage(message).trim();
      if (text) mapped.push({ role: "assistant", content: text });
    }
  }

  return mapped;
}
