// WebLLM web worker entrypoint. Runs the MLC engine off the main thread so
// model inference does not block UI rendering or input.
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg: MessageEvent) => {
  handler.onmessage(msg);
};
