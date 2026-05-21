# Totem

**Transform your computer into your private AI.**

Totem is a browser-native AI assistant powered by [WebLLM](https://webllm.mlc.ai/) and WebGPU. The model runs entirely inside the user's browser — no server, no API key, no account required, and no data ever leaves the device.

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Browser requirement:** Chrome 113+ or any Chromium-based browser (Edge, Brave, Arc) with WebGPU enabled. The device needs a GPU with at least 4 GB of memory.

---

## How it works

1. User visits the landing page and clicks **"Evaluate my hardware & get started"**
2. The app checks WebGPU capabilities and assesses whether the device can run the model
3. On first load, model weights are downloaded once (~500 MB–2 GB) and cached in the browser
4. All inference runs locally in a Web Worker via WebGPU — nothing is sent to any server
5. Conversations are persisted in IndexedDB and survive page refreshes

---

## Features

### Perpetual Prompt
A persistent system prompt prepended to every conversation. Users can give the AI standing context — their name, job, preferred tone, or any custom instructions. Editable at any time via the **Perpetual Prompt** button in the top bar.

### Totem Builder
A built-in knowledge base editor. Users add custom question-and-answer entries; the app matches them against incoming questions via keyword scoring and injects relevant entries into the model's context. Open with the **Totem Builder** button.

### Thread persistence
All conversation threads are saved in IndexedDB and accessible from the sidebar. Switching threads or refreshing the page never loses history.

### Offline support
After the initial model download, Totem works fully offline as a PWA. The service worker caches app assets; the model is cached by the browser.

---

## Configuration

All config is via environment variables. Copy `.env.local` and adjust as needed.

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_WEBLLM_MODEL` | `Qwen3.5-2B-q4f16_1-MLC` | WebLLM model ID from the WebLLM catalog |
| `NEXT_PUBLIC_DEMO_MODE` | unset | Set to `true` to skip the loading screen and render the chat UI immediately (for UI development only) |
| `BASE_PATH` | unset | Set to `/repo-name` when deploying to a GitHub Pages project page |

---

## Deployment

### GitHub Pages (beta / staging)

Push to `main`. The workflow at `.github/workflows/deploy-gh-pages.yml` builds and deploys automatically.

In your repository settings → **Pages** → Source, select **"GitHub Actions"**.

Your site will be live at `https://<username>.github.io/<repo-name>`.

If you add a custom domain, remove the `BASE_PATH` line from the workflow — it's only needed for project-page subdirectory hosting.

---

## Project structure

```
app/
  page.tsx              # Landing page (/)
  chat/page.tsx         # Chat route (/chat)
  assistant.tsx         # Main chat shell (sidebar, thread, toolbar)
  layout.tsx            # Root layout, dark mode, service worker registration
components/
  webllm-loader.tsx     # Loading screen, GPU detection, hardware assessment
  perpetual-prompt.tsx  # System prompt editor dialog
  faq-builder.tsx       # Totem Builder knowledge base editor
  assistant-ui/         # Chat UI primitives (thread, composer, sidebar)
lib/
  webllm-engine.ts      # WebLLM singleton — worker lifecycle, progress callbacks
  faq-matcher.ts        # Keyword scoring against knowledge base entries
  system-prompt.ts      # localStorage-backed default system prompt
  transport/
    webllm-transport.ts # Chat transport — FAQ matching → model inference pipeline
public/
  faq-data.json         # Default knowledge base (editable via Totem Builder)
  faq.config.json       # App config (model, faqSource, branding)
  sw.js                 # Service worker
  embed.js              # Embeddable widget script
```

