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

type BackendChatTurn = {
  sender: "user" | "ai";
  text: string;
  image?: string | null;
};

async function askBackend(params: AskAssistantParams) {
  const data = await apiRequest<any>({
    method: "POST",
    url: "/api/ai/chat",
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

  return String(
    data?.reply ||
      data?.response ||
      data?.message ||
      data?.answer ||
      "I am here. Ask me anything and I will help.",
  ).trim();
}

export async function askFriendlyAssistant(params: AskAssistantParams) {
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
  const reply = await askBackend(params);
  await simulateStream(reply, handlers);
}
