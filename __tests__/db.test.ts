import { describe, it, expect, beforeEach } from "vitest";
import { db, type Thread } from "../lib/db";

describe("Database (IndexedDB abstraction)", () => {
  beforeEach(async () => {
    await db.clearAllData();
  });

  it("should save and retrieve a thread", async () => {
    const thread: Thread = {
      id: "thread-1",
      title: "Test Thread",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    await db.saveThread(thread);
    const retrieved = await db.getThread("thread-1");
    expect(retrieved).toEqual(thread);
  });

  it("should get all threads", async () => {
    await db.saveThread({
      id: "thread-1",
      title: "Thread 1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });
    await db.saveThread({
      id: "thread-2",
      title: "Thread 2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    const retrieved = await db.getAllThreads();
    expect(retrieved).toHaveLength(2);
  });

  it("should delete a thread", async () => {
    await db.saveThread({
      id: "thread-1",
      title: "Test",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    await db.deleteThread("thread-1");
    const retrieved = await db.getThread("thread-1");
    expect(retrieved).toBeUndefined();
  });

  it("should clear all data", async () => {
    await db.saveThread({
      id: "thread-1",
      title: "Thread 1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    await db.clearAllData();
    const threads = await db.getAllThreads();
    expect(threads).toHaveLength(0);
  });
});
