import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiRequest, buildQuery } from "@/lib/api";

export interface AIChatTurn {
  sender: "user" | "ai";
  text: string;
  image?: string;
}

export interface AssistantHistoryMessage {
  sender: "user" | "ai";
  text: string;
  image?: string;
  timestamp?: string;
  provider?: string;
}

type AssistantStreamHandlers = {
  onToken: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
};

type AskAssistantParams = {
  message: string;
  role: string;
  userId?: string | null;
  userName?: string | null;
  image?: string | null;
  history: AIChatTurn[];
};

type BackendChatTurn = {
  sender: "user" | "ai";
  text: string;
  image?: string | null;
};

type AssistantReply = {
  text: string;
};

const BROWSER_GEMINI_API_KEY =
  import.meta.env.DEV ? String(import.meta.env.VITE_GEMINI_API_KEY || "").trim() : "";
const BROWSER_GEMINI_MODEL =
  String(import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash").trim() || "gemini-1.5-flash";

async function askBackend(params: AskAssistantParams) {
  const data = await apiRequest<any>({
    method: "POST",
    url: "/api/ai/chat",
    timeout: 30000,
    withAuth: true,
    data: {
      message: params.message,
      role: params.role,
      userId: params.userId || null,
      userName: params.userName || null,
      image: params.image || null,
      history: params.history
        .filter((turn) => turn.text.trim() || turn.image)
        .slice(-10)
        .map<BackendChatTurn>((turn) => ({
          sender: turn.sender,
          text: turn.text,
          image: turn.image || null,
        })),
    },
  });

  const reply = String(
    data?.reply ||
      data?.response ||
      data?.message ||
      data?.answer ||
      "I am here. Ask me anything and I will help.",
  ).trim();

  return {
    text: reply,
  } satisfies AssistantReply;
}

export async function fetchAssistantHistory(params: { role: string; userId?: string | null }) {
  const query = buildQuery({
    role: params.role,
    userId: params.userId || undefined,
  });

  const data = await apiRequest<AssistantHistoryMessage[]>({
    method: "GET",
    url: `/api/ai/chat/history${query}`,
    timeout: 15000,
    withAuth: true,
  });

  return (Array.isArray(data) ? data : []).map((item) => ({
    sender: item.sender === "user" ? "user" : "ai",
    text: String(item.text || ""),
    image: item.image ? String(item.image) : undefined,
    timestamp: item.timestamp ? String(item.timestamp) : undefined,
    provider: item.provider ? String(item.provider) : undefined,
  }));
}

export async function clearAssistantHistory(params: { role: string; userId?: string | null }) {
  const query = buildQuery({
    role: params.role,
    userId: params.userId || undefined,
  });

  await apiRequest({
    method: "DELETE",
    url: `/api/ai/chat/history${query}`,
    timeout: 15000,
    withAuth: true,
  });
}

export async function askFriendlyAssistant(params: AskAssistantParams) {
  const reply = await askBackend(params);
  return reply.text;
}

function splitIntoChunks(text: string) {
  const parts = text.match(/\S+\s*/g);
  return parts && parts.length > 0 ? parts : [text];
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function simulateStream(text: string, handlers: AssistantStreamHandlers) {
  const chunks = splitIntoChunks(text);
  let fullText = "";

  for (const chunk of chunks) {
    fullText += chunk;
    handlers.onToken(chunk);
    await sleep(chunk.length > 18 ? 28 : 18);
  }

  handlers.onComplete?.(fullText.trim());
}

function canUseBrowserGemini() {
  return Boolean(BROWSER_GEMINI_API_KEY);
}

function buildGeminiSystemInstruction(params: AskAssistantParams) {
  const lines = [
    "You are Agri-Invest AI, a warm real-time assistant inside an Indian agriculture platform.",
    "Answer naturally like a capable Gemini-style assistant, not like a rigid FAQ bot.",
    "Handle general questions as well as agriculture, projects, ROI, disease, and workflow questions.",
    "Be practical, concise, and helpful. Use short paragraphs or bullets when useful.",
    "If the user shares an image, describe visible details carefully and say when you are uncertain.",
  ];

  if (params.role) {
    lines.push(`Current user role: ${params.role}.`);
  }
  if (params.userName) {
    lines.push(`Current user name: ${params.userName}.`);
  }

  return lines.join("\n");
}

function parseImageDataUrl(image?: string | null) {
  const raw = String(image || "").trim();
  if (!raw || !raw.includes(",")) {
    return null;
  }

  const [metadata, base64] = raw.split(",", 2);
  const mimeMatch = metadata.match(/^data:(.*?);base64$/i);
  return {
    mimeType: mimeMatch?.[1] || "image/jpeg",
    data: base64.trim(),
  };
}

function buildGeminiContents(params: AskAssistantParams) {
  const contents = params.history
    .filter((turn) => turn.text.trim())
    .slice(-10)
    .map((turn) => ({
      role: turn.sender === "ai" ? "model" : "user",
      parts: [{ text: turn.text }],
    }));

  const prompt =
    params.message.trim() ||
    (params.image ? "Analyze this image and answer the user's request clearly." : "Help the user.");
  const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (prompt) {
    currentParts.push({ text: prompt });
  }

  const imagePart = parseImageDataUrl(params.image);
  if (imagePart) {
    currentParts.push({
      inlineData: {
        mimeType: imagePart.mimeType,
        data: imagePart.data,
      },
    });
  }

  if (currentParts.length > 0) {
    contents.push({
      role: "user",
      parts: currentParts,
    });
  }

  return contents;
}

async function streamBrowserGemini(
  params: AskAssistantParams,
  handlers: AssistantStreamHandlers,
) {
  const genAI = new GoogleGenerativeAI(BROWSER_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: BROWSER_GEMINI_MODEL,
    systemInstruction: buildGeminiSystemInstruction(params),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 900,
    },
  });

  const result = await model.generateContentStream({
    contents: buildGeminiContents(params),
  });

  let fullText = "";

  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (!chunkText) {
      continue;
    }

    const nextChunk = chunkText.startsWith(fullText)
      ? chunkText.slice(fullText.length)
      : chunkText;
    if (!nextChunk) {
      continue;
    }

    fullText += nextChunk;
    handlers.onToken(nextChunk);
  }

  if (!fullText.trim()) {
    const finalResponse = await result.response;
    fullText = finalResponse.text().trim();
  }

  handlers.onComplete?.(fullText.trim());
}

async function streamBackendReply(
  params: AskAssistantParams,
  handlers: AssistantStreamHandlers,
) {
  const reply = await askBackend(params);
  await simulateStream(reply.text, handlers);
}

export async function streamFriendlyAssistant(
  params: AskAssistantParams,
  handlers: AssistantStreamHandlers,
) {
  try {
    await streamBackendReply(params, handlers);
    return;
  } catch (error) {
    if (!canUseBrowserGemini()) {
      throw error;
    }
  }

  await streamBrowserGemini(params, handlers);
}
