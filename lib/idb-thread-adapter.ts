"use client";

import { db, type Thread } from "@/lib/db";
import type {
  RemoteThreadListAdapter,
  RemoteThreadListResponse,
  RemoteThreadMetadata,
  RemoteThreadInitializeResponse,
} from "@assistant-ui/core";
import type { AssistantStream } from "assistant-stream";

/**
 * A RemoteThreadListAdapter backed by IndexedDB.
 * Supports list, initialize, rename, delete, archive (no-op), and fetch.
 */
export class IndexedDBThreadListAdapter implements RemoteThreadListAdapter {
  async list(): Promise<RemoteThreadListResponse> {
    const threads = await db.getAllThreads();
    // Sort by most recently updated first
    threads.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return {
      threads: threads.map((t) => ({
        status: "regular" as const,
        remoteId: t.id,
        title: t.title,
        externalId: undefined,
      })),
    };
  }

  async initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
    // Create an empty thread in IndexedDB
    const now = new Date().toISOString();
    const thread: Thread = {
      id: threadId,
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    await db.saveThread(thread);
    return { remoteId: threadId, externalId: undefined };
  }

  async rename(remoteId: string, newTitle: string): Promise<void> {
    const thread = await db.getThread(remoteId);
    if (thread) {
      thread.title = newTitle;
      thread.updatedAt = new Date().toISOString();
      await db.saveThread(thread);
    }
  }

  async archive(_remoteId: string): Promise<void> {
    // Treat archive as delete for simplicity
    await this.delete(_remoteId);
  }

  async unarchive(_remoteId: string): Promise<void> {
    // No-op
  }

  async delete(remoteId: string): Promise<void> {
    await db.deleteThread(remoteId);
  }

  async generateTitle(
    _remoteId: string,
    _messages: readonly unknown[],
  ): Promise<AssistantStream> {
    // Return a no-op stream — we generate titles locally in the sync hook
    return Promise.resolve(
      new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
    ) as unknown as Promise<AssistantStream>;
  }

  async fetch(threadId: string): Promise<RemoteThreadMetadata> {
    const thread = await db.getThread(threadId);
    if (!thread) throw new Error("Thread not found");
    return {
      status: "regular",
      remoteId: thread.id,
      title: thread.title,
      externalId: undefined,
    };
  }
}
