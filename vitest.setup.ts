import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "fake-indexeddb/auto";

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Reset IndexedDB between tests for isolation. We re-init the DB module's
// internal connection by clearing the cached database between tests.
beforeEach(async () => {
  const { IDBFactory } = await import("fake-indexeddb");
  (globalThis as any).indexedDB = new IDBFactory();
  // Reset the singleton db module so it reopens against the fresh factory
  const dbModule = await import("./lib/db");
  (dbModule.db as any).db = null;
  (dbModule.db as any).initPromise = null;
});
