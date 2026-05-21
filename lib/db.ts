/**
 * IndexedDB persistence layer — conversation threads only.
 */

export type Thread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

const DB_NAME = "webllm-faq";
const DB_VERSION = 1;

class DBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;

        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
          this.initPromise = null;
        };

        this.db.onclose = () => {
          this.db = null;
          this.initPromise = null;
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("threads")) {
          db.createObjectStore("threads", { keyPath: "id" });
        }
      };
    });

    return this.initPromise;
  }

  private async withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
    try {
      const idb = await this.init();
      return await fn(idb);
    } catch (e) {
      if (e instanceof DOMException && e.name === "InvalidStateError") {
        this.db = null;
        this.initPromise = null;
        const idb = await this.init();
        return fn(idb);
      }
      throw e;
    }
  }

  async saveThread(thread: Thread): Promise<void> {
    return this.withDb(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction("threads", "readwrite");
          const store = tx.objectStore("threads");
          const request = store.put(thread);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        }),
    );
  }

  async getThread(id: string): Promise<Thread | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("threads", "readonly");
      const store = tx.objectStore("threads");
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllThreads(): Promise<Thread[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("threads", "readonly");
      const store = tx.objectStore("threads");
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteThread(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("threads", "readwrite");
      const store = tx.objectStore("threads");
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.init();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("threads", "readwrite");
      const store = tx.objectStore("threads");
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const db = new DBManager();
