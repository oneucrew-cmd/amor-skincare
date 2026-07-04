import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";
export type TextContent = { type: "text"; text: string; };
export type ImageContent = { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high"; }; };
export type FileContent = { type: "file_url"; file_url: { url: string; mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4"; }; };
export type MessageContent = string | TextContent | ImageContent | FileContent;
export type Message = { role: Role; content: MessageContent | MessageContent[]; name?: string; tool_call_id?: string; };
export type Tool = { type: "function"; function: { name: string; description?: string; parameters?: Record<string, unknown>; }; };
export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = { type: "function"; function: { name: string; }; };
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;
export type InvokeParams = { messages: Message[]; tools?: Tool[]; toolChoice?: ToolChoice; tool_choice?: ToolChoice; maxTokens?: number; max_tokens?: number; };
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string; }; };
export type InvokeResult = {
  id: string; created: number; model: string;
  choices: Array<{ index: number; message: { role: Role; content: string; tool_calls?: ToolCall[]; }; finish_reason: string | null; }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number; };
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;
  const content = Array.isArray(message.content)
    ? message.content.map(p => typeof p === "string" ? p : (p.type === "text" ? p.text : JSON.stringify(p))).join("\n")
    : typeof message.content === "string" ? message.content : JSON.stringify(message.content);
  return { role, name, tool_call_id, content };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = process.env.GEMINI_API_KEY || ENV.forgeApiKey;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  // Используем OpenAI-совместимый эндпоинт Google Gemini
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;

  const payload: Record<string, unknown> = {
    model: "gemini-2.0-flash",
    messages: params.messages.map(normalizeMessage),
    max_tokens: 1024,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return (await response.json()) as InvokeResult;
}
