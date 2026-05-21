export type FaqEntry = {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
};

export type FaqMatch = {
  entry: FaqEntry;
  score: number;
};

export type FaqData = {
  faq: FaqEntry[];
  followUpTopics: string[];
};

export type FaqConfig = {
  name: string;
  description: string;
  faqSource: string;
  branding: {
    title: string;
    subtitle: string;
    accentColor: string;
  };
  model: string;
  noMatchMessage: string;
};

const STORAGE_KEY = "asklocal-faq-data";

/**
 * Allow only same-origin absolute URLs and root-relative paths (/path).
 * Rejects protocol-relative URLs (//evil.com), external origins, and anything
 * that could be used to redirect the fetch to an attacker-controlled endpoint.
 */
function isSafeSource(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
}

// Runtime state — loaded once, reused for all queries
let loadedData: FaqData | null = null;
let loadedConfig: FaqConfig | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Return the currently loaded FAQ data (may be null before loadFaqData resolves).
 */
export function getFaqData(): FaqData | null {
  return loadedData;
}

/**
 * Overwrite the in-memory FAQ data and persist it to localStorage so it
 * survives page refreshes. Calling code (the FAQ Builder UI) is responsible
 * for keeping the value well-formed.
 */
export function setFaqData(data: FaqData): void {
  loadedData = data;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota exceeded or private-browsing restriction — silently ignore.
    }
  }
}

/**
 * Clear any locally-saved overrides and re-fetch the original FAQ source.
 * Returns the freshly-loaded data so callers can sync UI state.
 */
export async function resetFaqData(): Promise<FaqData | null> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  loadedData = null;
  loadedConfig = null;
  loadPromise = null;
  await loadFaqData();
  return loadedData;
}

/**
 * Load FAQ config and data from the public directory.
 * Checks localStorage for user-saved overrides first.
 * Safe to call multiple times — only fetches once.
 */
export async function loadFaqData(): Promise<void> {
  if (loadedData) return;
  if (loadPromise) return loadPromise;

  // On the client, prefer any user-saved overrides stored in localStorage.
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: FaqData = JSON.parse(stored);
        if (Array.isArray(parsed?.faq)) {
          loadedData = parsed;
          return;
        }
      }
    } catch {
      // Corrupted storage — fall through to fetch.
    }
  }

  loadPromise = (async () => {
    // Next.js inlines NEXT_PUBLIC_* vars at build time. When the app is served
    // from a sub-path (e.g. GitHub Pages: /repo-name/), raw fetch() calls need
    // the base path prepended — Next.js basePath only affects its own router.
    const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    try {
      // Load config
      const configRes = await fetch(`${BASE_PATH}/faq.config.json`);
      if (configRes.ok) {
        loadedConfig = await configRes.json();
      }

      // Only allow same-origin or relative paths for faqSource to prevent
      // the config from being redirected to an attacker-controlled endpoint.
      const rawSource = loadedConfig?.faqSource ?? "/faq-data.json";
      const safeSource = isSafeSource(rawSource) ? rawSource : "/faq-data.json";
      // Prepend the base path for root-relative paths so the fetch resolves
      // correctly when the app is deployed under a sub-path.
      const source = safeSource.startsWith("/") ? `${BASE_PATH}${safeSource}` : safeSource;

      const dataRes = await fetch(source);
      if (!dataRes.ok) {
        throw new Error(`Failed to load FAQ data from ${source}: ${dataRes.status}`);
      }
      loadedData = await dataRes.json();
    } catch (e) {
      console.error("[Totem] Failed to load FAQ data:", e);
      // Provide empty fallback so the app doesn't crash
      loadedData = { faq: [], followUpTopics: [] };
    }
  })();

  return loadPromise;
}

/**
 * Get the loaded config (must call loadFaqData first).
 */
export function getConfig(): FaqConfig | null {
  return loadedConfig;
}

/**
 * Whether FAQ data has been loaded.
 */
export function isFaqLoaded(): boolean {
  return loadedData !== null;
}

/**
 * Tokenize a string into lowercase words, stripping punctuation.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Simple keyword scoring: counts how many query tokens appear in the
 * entry's keywords + question. Returns a score between 0 and 1.
 */
function scoreEntry(queryTokens: string[], entry: FaqEntry): number {
  const entryTokens = new Set([
    ...entry.keywords.map((k) => k.toLowerCase()),
    ...tokenize(entry.question),
  ]);

  let hits = 0;
  for (const qt of queryTokens) {
    for (const et of entryTokens) {
      if (et.includes(qt) || qt.includes(et)) {
        hits++;
        break;
      }
    }
  }

  return queryTokens.length > 0 ? hits / queryTokens.length : 0;
}

const MATCH_THRESHOLD = 0.3;

/**
 * Match a user query against the FAQ entries.
 * Returns matched entries sorted by relevance, or empty if none meet the threshold.
 */
export function matchFaq(query: string): FaqMatch[] {
  if (!loadedData) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = loadedData.faq
    .map((entry) => ({ entry, score: scoreEntry(queryTokens, entry) }))
    .filter((m) => m.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Get the list of suggested follow-up topics (shown when no match is found).
 */
export function getFollowUpTopics(): string[] {
  return loadedData?.followUpTopics ?? [];
}

/**
 * Get all FAQ entries.
 */
export function getAllFaqEntries(): FaqEntry[] {
  return loadedData?.faq ?? [];
}
