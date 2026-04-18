import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiRequest } from "@/lib/api";

export interface AIChatTurn {
  sender: "user" | "ai";
  text: string;
  image?: string;
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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

let cachedClient: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!GEMINI_API_KEY) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return cachedClient;
}

function buildSystemInstruction(role: string, userName?: string | null) {
  return [
    "You are Agri-Invest AI, a friendly real-time assistant inside an Indian agriculture platform.",
    "Behave like ChatGPT: natural, warm, conversational, helpful, and easy to talk to.",
    "Greet users naturally, answer clearly, and keep the tone human instead of robotic.",
    "Keep most replies short to medium, but give a fuller answer when the user asks for more depth.",
    "Ask follow-up questions when important details are missing instead of guessing.",
    "For agriculture, keep advice practical, India-aware, and action-oriented.",
    "You may answer general questions too, not only farming questions.",
    "When you are unsure, say so honestly and suggest the next best step.",
    "Prefer clean formatting with short paragraphs or simple bullets when helpful.",
    `Current user role: ${role || "FARMER"}.`,
    userName ? `Current user name: ${userName}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toGeminiHistory(history: AIChatTurn[]) {
  return history
    .filter((turn) => turn.text.trim() && !turn.image)
    .slice(-10)
    .map((turn) => ({
      role: turn.sender === "ai" ? "model" : "user",
      parts: [{ text: turn.text }],
    }));
}

async function askGemini(params: AskAssistantParams) {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemInstruction(params.role, params.userName),
  });

  const chat = model.startChat({
    history: toGeminiHistory(params.history),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 350,
    },
  });

  const result = await chat.sendMessage(params.message);
  return result.response.text().trim();
}

async function streamGemini(params: AskAssistantParams, handlers: AssistantStreamHandlers) {
  const client = getGeminiClient();
  if (!client) {
    return false;
  }

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemInstruction(params.role, params.userName),
  });

  const chat = model.startChat({
    history: toGeminiHistory(params.history),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 350,
    },
  });

  const result = await chat.sendMessageStream(params.message);
  let fullText = "";

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (!text) {
      continue;
    }

    fullText += text;
    handlers.onToken(text);
  }

  handlers.onComplete?.(fullText.trim());
  return true;
}

async function askBackend(params: AskAssistantParams) {
  const data = await apiRequest<any>({
    method: "POST",
    url: "/api/ai/chat",
    data: {
      message: params.message,
      role: params.role,
      userId: params.userId || null,
      image: params.image || null,
    },
  });

  return String(
    data?.reply ||
      data?.response ||
      data?.message ||
      data?.answer ||
      "I am here. Ask me anything and I will help.",
  ).trim();
}

export async function askFriendlyAssistant(params: AskAssistantParams) {
  if (!params.image) {
    try {
      const geminiReply = await askGemini(params);
      if (geminiReply) {
        return geminiReply;
      }
    } catch (error) {
      console.warn("Gemini chat fallback", error);
    }
  }

  return askBackend(params);
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

export async function streamFriendlyAssistant(
  params: AskAssistantParams,
  handlers: AssistantStreamHandlers,
) {
  if (!params.image) {
    try {
      const streamed = await streamGemini(params, handlers);
      if (streamed) {
        return;
      }
    } catch (error) {
      console.warn("Gemini stream fallback", error);
    }
  }

  const reply = await askBackend(params);
  await simulateStream(reply, handlers);
}
