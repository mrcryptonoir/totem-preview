// Shared transport types — simplified for FAQ-only usage.

export type WebLLMRequestMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};
