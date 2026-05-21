import { describe, it, expect } from "vitest";
import type { UIMessage } from "ai";
import { buildWebLLMMessages, plainTextFromMessage } from "../lib/transport/messages";

const userMsg = (text: string): UIMessage =>
  ({
    id: `m-${Math.random()}`,
    role: "user",
    parts: [{ type: "text", text }],
  }) as unknown as UIMessage;

const assistantTextMsg = (text: string): UIMessage =>
  ({
    id: `a-${Math.random()}`,
    role: "assistant",
    parts: [{ type: "text", text }],
  }) as unknown as UIMessage;

describe("transport/messages", () => {
  describe("plainTextFromMessage", () => {
    it("extracts text from parts array", () => {
      expect(plainTextFromMessage(userMsg("hi"))).toBe("hi");
    });

    it("falls back to .content when parts missing", () => {
      const msg = { id: "m1", role: "user", content: "plain" } as unknown as UIMessage;
      expect(plainTextFromMessage(msg)).toBe("plain");
    });
  });

  describe("buildWebLLMMessages", () => {
    it("converts user and assistant messages", () => {
      const msgs = [userMsg("hello"), assistantTextMsg("hi there")];
      const result = buildWebLLMMessages(msgs);
      expect(result).toEqual([
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi there" },
      ]);
    });

    it("prepends preamble to first user message", () => {
      const msgs = [userMsg("question")];
      const result = buildWebLLMMessages(msgs, "[PREAMBLE] ");
      expect(result[0].content).toBe("[PREAMBLE] question");
    });

    it("skips system messages", () => {
      const msgs = [
        { id: "s1", role: "system", parts: [{ type: "text", text: "sys" }] } as unknown as UIMessage,
        userMsg("hello"),
      ];
      const result = buildWebLLMMessages(msgs);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe("user");
    });
  });
});
