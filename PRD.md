# Product Requirements Document
## Browser-Native AI Agent

**Version:** 0.1 (Prototype)
**Date:** May 1, 2026
**Status:** Draft

---

## 1. Problem Statement

Running a personal AI agent today requires significant friction: a powerful GPU, complex Python environments, model downloads managed via CLI tools, and ongoing maintenance. For the majority of everyday tasks — managing a to-do list, searching notes, answering questions, calling external APIs — none of that infrastructure is necessary.

**The problem:** The barrier to entry for a personal, private, locally-running AI agent is far too high for non-technical users.

**The opportunity:** Modern browsers with WebGPU support can run capable quantized language models entirely in-browser, with no install, no server, and no API key required.

---

## 2. Vision

A personal AI agent that runs entirely inside the browser. The user visits a URL, downloads the model once, and has a capable task-aware assistant available from any device with a supported browser — private, offline-capable, and free to run.

> "Your own AI agent. No installs. No API keys. Just open and go."

---

## 3. Target Audience

**Primary:** General, non-technical users who want a personal productivity assistant and are unwilling or unable to set up a local AI stack.

**Secondary:** Technically curious users who want to understand or extend what the agent can do.

**Explicitly out of scope:** Developers building their own agents (this is not a developer tool or SDK).

---

## 4. Core Principles

| Principle | Implication |
|-----------|-------------|
| **Browser-first** | No server required for core functionality. The app must be deployable as a static site (CDN, GitHub Pages, Vercel static export). |
| **Private by default** | All inference and data stay in the browser. Nothing leaves the device unless the user explicitly enables a cloud model. |
| **Zero install** | No npm, no Python, no CLI. Open a URL and go. |
| **Non-technical UX** | No model picker dropdowns on the home screen. No JSON schema editors. No raw tool output by default. |
| **Progressively capable** | Works fully offline with the local model. Cloud model and external MCP tools are opt-in enhancements, not requirements. |

---

## 5. User Stories

### 5.1 Core Agent Loop
- As a user, I can open the app and start chatting with an AI agent after a one-time model download.
- As a user, I can ask the agent to help me with everyday tasks in plain English, without needing to know what "tools" or "function calling" are.
- As a user, I can see when the agent is using a tool and what it returned, collapsed by default but expandable.

### 5.2 Task Management
- As a user, I can ask the agent to remember a task for me ("remind me to send the report Friday").
- As a user, I can ask the agent to list my open tasks.
- As a user, I can ask the agent to mark a task complete.
- As a user, my tasks persist between browser sessions (IndexedDB).

### 5.3 Knowledge Base
- As a user, I can ask the agent questions that are answered from a curated knowledge base shipped with the app (e.g., "how does the model work?").
- As a user, I can add my own notes or documents to a personal knowledge base that the agent can search.
- As a user, my personal knowledge base entries persist between sessions (IndexedDB).

### 5.4 Cloud Model Fallback
- As a user whose device doesn't support WebGPU, I can log in with OpenRouter OAuth and use a cloud model instead.
- As a user who wants higher-quality responses, I can switch to a cloud model at any time.
- As a user, it is clear when I am using the local model vs. a cloud model (privacy indicator).

### 5.5 MCP Integration (Future)
- As a user, I can connect the agent to an external MCP server by providing its URL.
- As a user, tools from a connected MCP server appear automatically alongside the built-in tools.
- As an app developer, I can register additional built-in tools without modifying the agent loop.

### 5.6 Heartbeat (Scheduled Prompts)
- As a user, I can create a scheduled prompt that runs automatically on a fixed interval, at a specific time of day, or on a cron-style schedule.
- As a user, I can write any free-text prompt as the heartbeat — the agent runs it exactly as if I had typed it.
- As a user, the heartbeat result (both the triggered prompt and the agent's response) appears in a designated conversation thread so I can see the history.
- As a user, I can create, edit, pause, and delete heartbeats from a settings panel.
- As a user, my heartbeat schedules persist between sessions so they resume automatically when I reopen the tab.
- As a user, I understand that heartbeats only fire while the tab is open (no background execution when the browser is closed).

### 5.7 Persistence
- As a user, my conversation threads are saved and I can return to a previous conversation.
- As a user, I can delete a conversation thread.
- As a user, I can clear all my data from the browser in one action.

---

## 6. Functional Requirements

### 6.1 Inference Engine
- **FR-INF-1:** The app MUST run model inference entirely in the browser via WebLLM + WebGPU.
- **FR-INF-2:** The default model MUST support function/tool calling (Hermes-2-Pro-Llama-3-8B or equivalent).
- **FR-INF-3:** The model MUST run in a Web Worker, not the main thread, to keep the UI responsive during generation.
- **FR-INF-4:** Model weights MUST be cached in the browser's Cache Storage after the first download.
- **FR-INF-5:** The app MUST display download progress and estimated size on first load.
- **FR-INF-6:** If WebGPU is not available, the app MUST offer the cloud model fallback before showing an error.

### 6.2 Cloud Model Fallback
- **FR-CLD-1:** Cloud model access MUST use OpenRouter OAuth (no API key copy-paste).
- **FR-CLD-2:** When the user is authenticated via OpenRouter OAuth, they MUST be able to select any model available on their account from a dropdown. The default selection MUST be the OpenRouter free endpoint. The dropdown MUST display model name and context window size at minimum.
- **FR-CLD-3:** A visible indicator MUST distinguish local inference from cloud inference in the UI, including the name of the active cloud model.
- **FR-CLD-6:** The model dropdown MUST be accessible from the main chat header or settings — no more than one click away.
- **FR-CLD-4:** Switching between local and cloud MUST not require a page reload.
- **FR-CLD-5:** The app MUST NOT send conversation history to any cloud service when in local mode.

### 6.3 Tool System
- **FR-TOOL-1:** All built-in tools MUST execute entirely in the browser (no server required).
- **FR-TOOL-2:** Tool definitions MUST be registered in a single registry (`browser-tools.ts`) that the agent loop reads automatically.
- **FR-TOOL-3:** The agent MUST NOT call a tool for greetings, casual conversation, or questions it can answer from its weights.
- **FR-TOOL-4:** The agent MUST handle tool errors gracefully and inform the user in plain language.
- **FR-TOOL-5:** Tool results MUST be displayed in collapsible UI cards (collapsed by default after completion).

### 6.4 Built-in Tools (v1)
| Tool | Description |
|------|-------------|
| `get_current_time` | Returns current local time and date |
| `calculate` | Safe arithmetic evaluator (no `eval`) |
| `list_tasks` | Lists tasks from IndexedDB (filter: open / done / all) |
| `create_task` | Creates a new task and persists to IndexedDB |
| `complete_task` | Marks a task done in IndexedDB |
| `search_knowledge_base` | Fuzzy full-text search over static + personal KB entries (v1). Embedding-based semantic search is a planned v2 upgrade. |
| `add_knowledge_entry` | Adds a user-supplied note to the personal KB in IndexedDB |

### 6.5 Heartbeat (Scheduled Prompts)
- **FR-HB-1:** The user MUST be able to create a heartbeat with a free-text prompt and one of three schedule types: fixed interval (e.g. every 30 minutes), specific time of day (e.g. 09:00 daily), or cron expression.
- **FR-HB-2:** Heartbeat schedules MUST be evaluated using `setInterval` / `setTimeout` in the main thread. Background execution (Periodic Background Sync API) is explicitly out of scope for v1.
- **FR-HB-3:** When a heartbeat fires, it MUST inject the scheduled prompt into a designated heartbeat thread and run the full agent loop (including tool calls) as if the user had typed it.
- **FR-HB-4:** The heartbeat thread MUST be clearly labelled in the thread list (e.g. a clock icon + heartbeat name) so it is visually distinct from manual conversations.
- **FR-HB-5:** Each heartbeat MUST have an enabled/paused toggle. Paused heartbeats persist but do not fire.
- **FR-HB-6:** Heartbeat definitions (prompt, schedule, enabled state) MUST persist in IndexedDB and reload automatically when the tab is reopened.
- **FR-HB-7:** The UI MUST display the next scheduled fire time for each heartbeat so users know when to expect output.
- **FR-HB-8:** If the model is still loading when a heartbeat fires, the heartbeat MUST queue and execute immediately once the model is ready rather than silently dropping the run.

### 6.6 MCP Integration (Future, not v1)
- **FR-MCP-1:** The user MUST be able to configure an MCP server URL in settings.
- **FR-MCP-2:** When an MCP server is configured, its tools MUST be fetched and added to the tool registry automatically.
- **FR-MCP-3:** MCP tool execution MUST go through a minimal server-side proxy ONLY when the MCP server cannot serve CORS headers. Direct browser-to-MCP is preferred.

### 6.7 Persistence
- **FR-PER-1:** Conversation threads MUST persist in IndexedDB.
- **FR-PER-2:** Tasks MUST persist in IndexedDB.
- **FR-PER-3:** User knowledge base entries MUST persist in IndexedDB.
- **FR-PER-4:** A "Clear all data" action MUST wipe all IndexedDB stores and cached model weights.
- **FR-PER-5:** Data MUST NOT be stored in `localStorage` (size limits, synchronous I/O). Use IndexedDB for all structured data.
- **FR-PER-6:** Heartbeat definitions MUST persist in IndexedDB and be restored on page load.

### 6.8 Static Deployment
- **FR-DEP-1:** The app MUST build as a fully static export (`next export` or equivalent).
- **FR-DEP-2:** No server runtime (Node.js, edge functions, etc.) MUST be required for the core agent loop.
- **FR-DEP-3:** The canonical deployment target is **Cloudflare Pages**. A `_headers` file in the build output MUST configure COEP/COOP for all routes.
- **FR-DEP-4:** The app MUST serve `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers on every response. On Cloudflare Pages this is done via the `_headers` file — no runtime server needed.

---

## 7. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | First meaningful paint (model load screen) < 2 seconds on a modern connection. |
| NFR-2 | UI must remain interactive (scrollable, cancellable) during token generation. |
| NFR-3 | No telemetry, analytics, or data collection of any kind without explicit user consent. |
| NFR-4 | The app must function with no internet connection after the initial model download. |
| NFR-5 | The app must work on Chrome/Edge 120+ (WebGPU GA). Firefox and Safari are best-effort. |
| NFR-6 | Accessibility: WCAG 2.1 AA for all interactive elements (keyboard navigation, ARIA labels, color contrast). |

---

## 8. Out of Scope (v1)

- Voice input / output
- Image or file attachment processing
- Multi-user / shared sessions
- Mobile browser support (WebGPU on mobile is not yet viable for 4B+ models)
- Plugin marketplace or user-installable tools
- Fine-tuning or model customization
- Any server-side inference
- Heartbeat execution when the browser tab is closed (Web Periodic Background Sync API) — planned v2
- Push notifications for heartbeat results — planned v2

---

## 9. Architecture Constraints

These are hard constraints that must be reflected in all technical decisions:

1. **No server runtime dependency for core functionality.** If you need a server for a feature, that feature is opt-in and the app works without it.
2. **All tool `execute()` functions must run in the browser.** No tool may make a server-side request as its primary execution path in v1.
3. **The agent loop runs in a Web Worker.** The main thread owns the UI only.
4. **IndexedDB is the persistence layer.** Not `localStorage`, not cookies, not a backend database.
5. **OpenRouter OAuth is the only cloud credential flow.** No API key fields in the UI.

---

## 10. Open Questions

| # | Question | Owner | Priority |
|---|----------|-------|----------|
| OQ-1 | ~~Which OpenRouter models appear in the curated cloud model list?~~ **Resolved:** User chooses from their own OpenRouter account model list (fetched via OpenRouter API after OAuth). Default is the free endpoint. | Product | ~~High~~ Closed |
| OQ-2 | ~~What is the static hosting target for v1?~~ **Resolved:** Cloudflare Pages. `_headers` file handles COEP/COOP. | Engineering | ~~High~~ Closed |
| OQ-3 | ~~Embeddings or keyword search?~~ **Resolved:** Fuzzy full-text search in v1. Embedding-based semantic search (e.g. `transformers.js`) is a planned v2 upgrade. | Product | ~~Medium~~ Closed |
| OQ-4 | Is there a specific MCP server to target for the first MCP integration? | Product | Low |
| OQ-5 | Should conversation threads sync across devices? (Requires a cloud store — out of scope for v1?) | Product | Low |

---

## 11. Success Metrics (Prototype Phase)

- A non-technical user can complete the first-time setup (model download → first message) without reading documentation.
- All built-in tools execute correctly with no server running.
- The UI remains responsive (no jank) during a 200-token generation.
- The app passes a static export build with no server-side runtime dependencies.
- A heartbeat that fires reliably and its output appears in the correct thread without duplicates or missed runs.
