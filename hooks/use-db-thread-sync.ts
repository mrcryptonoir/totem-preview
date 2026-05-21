"use client";

import { useEffect, useRef } from "react";
import { useAuiState } from "@assistant-ui/react";
import type { ThreadMessage } from "@assistant-ui/react";
import { db, type Message, type Thread } from "@/lib/db";

function serializeMessages(messages: readonly ThreadMessage[]): Message[] {
  return messages.flatMap((msg) => {
    if (msg.role !== "user" && msg.role !== "assistant") return [];

    const textContent = msg.content
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");

    // Skip messages with no text (e.g. tool-only assistant turns)
    if (!textContent.trim()) return [];

    return [
      {
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: textContent,
        timestamp: (msg.createdAt ?? new Date()).toISOString(),
      },
    ];
  });
}

export function useDbThreadSync(): void {
  const createdAtRef = useRef<string>(new Date().toISOString());

  const threadId = useAuiState((s) => s.threadListItem.remoteId);
  const messages = useAuiState((s) => s.thread.messages);
  const isRunning = useAuiState((s) => s.thread.isRunning);

  useEffect(() => {
    if (isRunning) return;
    if (messages.length === 0) return;
    if (!threadId) return;

    const dbMessages = serializeMessages(messages);

    const persist = async () => {
      const existing = await db.getThread(threadId);

      // Only auto-generate a title if the thread hasn't been manually renamed
      let title: string;
      if (existing?.title && existing.title !== "New conversation") {
        // Keep the existing (possibly user-renamed) title
        title = existing.title;
      } else {
        const firstUserMsg = dbMessages.find((m) => m.role === "user");
        const rawTitle = firstUserMsg?.content ?? "New conversation";
        title =
          rawTitle.length > 60 ? `${rawTitle.slice(0, 60)}…` : rawTitle;
      }

      const thread: Thread = {
        id: threadId,
        title,
        createdAt: existing?.createdAt ?? createdAtRef.current,
        updatedAt: new Date().toISOString(),
        messages: dbMessages,
      };

      await db.saveThread(thread);
    };

    persist().catch(() => {});
  }, [messages, isRunning, threadId]);
}
