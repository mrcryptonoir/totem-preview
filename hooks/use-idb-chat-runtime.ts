"use client";

import { useChat } from "@ai-sdk/react";
import { useRemoteThreadListRuntime } from "@assistant-ui/core/react";
import { useAuiState } from "@assistant-ui/store";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { useEffect, useMemo, useRef } from "react";
import type { ChatTransport, UIMessage } from "ai";
import { IndexedDBThreadListAdapter } from "@/lib/idb-thread-adapter";
import { db } from "@/lib/db";
import type { AssistantRuntime } from "@assistant-ui/core";

/**
 * Shared ref to the current thread's chat helpers.
 * Allows components to directly modify AI SDK messages without going
 * through the complex import/export binding machinery.
 */
export const chatHelpersRef: {
  current: { messages: UIMessage[]; setMessages: (messages: UIMessage[]) => void } | null;
} = { current: null };

/**
 * A custom chat runtime that uses IndexedDB for thread list persistence
 * and message history, replacing useChatRuntime's cloud/in-memory approach.
 */
export function useIndexedDBChatRuntime<UI_MESSAGE extends UIMessage = UIMessage>({
  transport,
}: {
  transport: ChatTransport<UI_MESSAGE>;
}): AssistantRuntime {
  const adapter = useMemo(() => new IndexedDBThreadListAdapter(), []);

  return useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useChatThreadRuntime({ transport });
    },
    adapter,
    allowNesting: true,
  });
}

// Internal: dynamic transport proxy (same pattern as useChatRuntime)
function useDynamicChatTransport<UI_MESSAGE extends UIMessage>(
  transport: ChatTransport<UI_MESSAGE>,
) {
  const transportRef = useRef(transport);
  useEffect(() => {
    transportRef.current = transport;
  });

  return useMemo(
    () =>
      new Proxy(transportRef.current, {
        get(_, prop) {
          const res = (transportRef.current as unknown as Record<string | symbol, unknown>)[prop];
          return typeof res === "function"
            ? (res as Function).bind(transportRef.current)
            : res;
        },
      }),
    [],
  );
}

// Internal: mirrors useChatThreadRuntime from useChatRuntime.js
function useChatThreadRuntime<UI_MESSAGE extends UIMessage>({
  transport: transportOption,
}: {
  transport: ChatTransport<UI_MESSAGE>;
}): AssistantRuntime {
  const transport = useDynamicChatTransport(transportOption);
  const id = useAuiState((s) => s.threadListItem.id);

  const chat = useChat<UI_MESSAGE>({
    id,
    transport,
  });

  // Keep the shared ref in sync so components can access setMessages
  useEffect(() => {
    chatHelpersRef.current = {
      messages: chat.messages as UIMessage[],
      setMessages: chat.setMessages as (messages: UIMessage[]) => void,
    };
    return () => {
      chatHelpersRef.current = null;
    };
  });

  // Load messages from IndexedDB when thread ID changes
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      const thread = await db.getThread(id);
      if (cancelled || !thread || thread.messages.length === 0) return;

      // Convert our DB messages to UIMessage format (text-only)
      const uiMessages: UIMessage[] = thread.messages
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
          createdAt: new Date(m.timestamp),
        }));

      // Only set if current messages are empty (avoid overwriting active conversation)
      if (chat.messages.length === 0) {
        chat.setMessages(uiMessages as UI_MESSAGE[]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const runtime = useAISDKRuntime(chat);
  return runtime;
}
