import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/lib/auth';
import { isBackendSessionToken } from '@/lib/api';
import {
  clearAssistantHistory,
  fetchAssistantHistory,
  streamFriendlyAssistant,
  type AIChatTurn,
} from '@/lib/liveChat';
import {
  ArrowLeft,
  Image as ImageIcon,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
  Leaf,
  TrendingUp,
  Wallet,
  Shield,
  Bug,
  Droplets,
  Briefcase,
  CheckCircle2,
  Bot,
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  image?: string;
}

interface QuickPrompt {
  label: string;
  prompt: string;
}

const QUICK_PROMPTS: Record<string, QuickPrompt[]> = {
  FARMER: [
    { label: 'Suggest crop', prompt: 'Suggest a crop for black soil in Kharif season.' },
    { label: 'Tomato profit', prompt: 'Is tomato farming profitable per acre?' },
    { label: 'Disease help', prompt: 'My crop leaves are turning yellow. What should I do?' },
    { label: 'Smart tips', prompt: 'Give me 3 smart farming tips for better yield.' },
  ],
  INVESTOR: [
    { label: 'Project ROI', prompt: 'Explain project ROI in simple words.' },
    { label: 'Risk analysis', prompt: 'How should I judge risk before investing in a farm project?' },
    { label: 'Crop outlook', prompt: 'Which crop categories usually give better returns with moderate risk?' },
    { label: 'Diversify', prompt: 'How should I diversify across farm projects?' },
  ],
  AGRI_PARTNER: [
    { label: 'Field support', prompt: 'How can I support a farmer better from sowing to harvest?' },
    { label: 'Pest scouting', prompt: 'Give me a simple pest scouting checklist for field visits.' },
    { label: 'Work logs', prompt: 'How should I update my work logs clearly?' },
    { label: 'Monthly payout', prompt: 'How does agri-partner monthly payout work?' },
  ],
  ADMIN: [
    { label: 'Approve project', prompt: 'Give me a quick checklist to approve a farmer project.' },
    { label: 'Reject reason', prompt: 'Give proper rejection reasons for a farmer project.' },
    { label: 'Funding risk', prompt: 'What funding risks should admin watch before approval?' },
    { label: 'Profit split', prompt: 'Explain project profit split after platform fee deduction.' },
  ],
};

const ROLE_SUBTITLE: Record<string, string> = {
  FARMER: 'Friendly AI Assistant',
  INVESTOR: 'Friendly AI Advisor',
  AGRI_PARTNER: 'Friendly AI Assistant',
  ADMIN: 'Friendly AI Copilot',
};

const ROLE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  FARMER: Leaf,
  INVESTOR: TrendingUp,
  AGRI_PARTNER: Briefcase,
  ADMIN: Shield,
};

function createWelcomeMessage(text: string): Message {
  return {
    id: 'welcome',
    text,
    sender: 'ai',
    timestamp: new Date(),
  };
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createWelcomeState(text: string) {
  return [createWelcomeMessage(text)];
}

export function AIChat() {
  const user = authService.getCurrentUser();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'FARMER';
  const hasBackendSession = isBackendSessionToken(authService.getToken());
  const quickPrompts = QUICK_PROMPTS[role] || QUICK_PROMPTS.FARMER;
  const RoleIcon = ROLE_ICONS[role] || Bot;

  const welcomeMessage = useMemo(() => {
    const name = user?.name || 'there';

    const roleText: Record<string, string> = {
      FARMER:
        `Hi ${name}. I am your Agri-Invest AI assistant. Ask me about crops, diseases, profits, project flow, or anything else you need help with.`,
      INVESTOR:
        `Hi ${name}. I am your Agri-Invest AI advisor. I can explain ROI, risk, projects, crop outlook, or any general question in a simple way.`,
      AGRI_PARTNER:
        `Hi ${name}. I am your Agri-Invest AI assistant. I can help with field work, crop issues, work logs, payouts, and everyday questions.`,
      ADMIN:
        `Hi ${name}. I am your Agri-Invest AI copilot. I can help with approvals, risk checks, payouts, operations, and general guidance.`,
    };

    return roleText[role] || roleText.FARMER;
  }, [role, user?.name]);

  const storageKey = useMemo(() => {
    if (!user) {
      return null;
    }

    return `agriinvest_ai_chat_${user.id}_${role}`;
  }, [role, user]);

  useEffect(() => {
    if (!storageKey) {
      setMessages([]);
      return;
    }

    const restoreLocalMessages = () => {
      const savedMessages = localStorage.getItem(storageKey);
      if (!savedMessages) {
        setMessages(createWelcomeState(welcomeMessage));
        return;
      }

      try {
        const parsed = JSON.parse(savedMessages) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
        const restored = parsed
          .filter((item) => item && typeof item.text === 'string')
          .map((item) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));

        setMessages(restored.length > 0 ? restored : createWelcomeState(welcomeMessage));
      } catch {
        setMessages(createWelcomeState(welcomeMessage));
      }
    };

    if (!hasBackendSession || !user?.id) {
      restoreLocalMessages();
      return;
    }

    let active = true;
    setMessages(createWelcomeState(welcomeMessage));

    void fetchAssistantHistory({ role, userId: user.id })
      .then((history) => {
        if (!active) {
          return;
        }

        if (!history.length) {
          setMessages(createWelcomeState(welcomeMessage));
          return;
        }

        setMessages(
          history.map((item, index) => ({
            id: `history-${index}`,
            text: item.text,
            sender: item.sender,
            image: item.image,
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          })),
        );
      })
      .catch(() => {
        if (active) {
          restoreLocalMessages();
        }
      });

    return () => {
      active = false;
    };
  }, [hasBackendSession, role, storageKey, user?.id, welcomeMessage]);

  useEffect(() => {
    if (!storageKey || hasBackendSession) {
      return;
    }

    const persistableMessages = messages.filter(
      (message) => message.text.trim() || message.sender === 'user' || message.image,
    );
    localStorage.setItem(storageKey, JSON.stringify(persistableMessages));
  }, [hasBackendSession, messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getFallbackReply = (question: string): string => {
    const q = question.toLowerCase();

    if (role === 'FARMER') {
      if (q.includes('soil')) return 'Sure. Tell me your soil type and crop, and I will keep the advice practical.';
      if (q.includes('disease') || q.includes('yellow') || q.includes('spots')) return 'Tell me the crop name and the main symptom. I will help step by step.';
      if (q.includes('profit') || q.includes('roi')) return 'Tell me the crop and acres, and I will estimate cost, profit, and ROI.';
      return 'Ask me anything. I can help with crops, profit, disease guidance, and general questions.';
    }

    if (role === 'INVESTOR') {
      if (q.includes('roi') || q.includes('return')) return 'Sure. I can break ROI into simple numbers if you share the crop or project.';
      if (q.includes('risk')) return 'I can help with risk. Tell me the crop, location, or project you want to evaluate.';
      return 'Ask me anything about projects, ROI, risk, farming, or general guidance.';
    }

    if (role === 'AGRI_PARTNER') {
      if (q.includes('payout')) return 'I can help with payout flow. Tell me what part is unclear.';
      if (q.includes('work')) return 'I can help you write clean work logs or plan field tasks.';
      return 'I can help with field support, crop problems, work logs, and general questions.';
    }

    if (role === 'ADMIN') {
      if (q.includes('approve')) return 'I can give you a short approval checklist. Tell me the project details if you want a sharper answer.';
      if (q.includes('reject')) return 'I can help write a clear rejection reason. Tell me what is missing in the project.';
      if (q.includes('disbursal')) return 'I can explain the disbursal flow in simple steps.';
      return 'Ask me anything about approvals, risk, operations, crop logic, or general questions.';
    }

    return 'Ask me anything. If I need more details, I will ask.';
  };

  const getFailureReply = (question: string, image: string | null, error?: unknown) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message.trim();
    }

    if (image) {
      return 'I could not analyze that image just now. If the Flask disease AI is running, try the image again, or tell me the crop and visible symptoms here and I will help.';
    }

    return getFallbackReply(question);
  };

  const resetChat = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    if (hasBackendSession && user?.id) {
      void clearAssistantHistory({ role, userId: user.id }).catch(() => undefined);
    }

    setMessages(createWelcomeState(welcomeMessage));
    setInput('');
    setSelectedImage(null);
    setStreamingMessageId(null);
    setIsTyping(false);
  };

  const handleSend = async (forcedPrompt?: string) => {
    const text = (forcedPrompt ?? input).trim();

    if ((!text && !selectedImage) || isTyping) {
      return;
    }

    const currentImage = selectedImage;
    const historySnapshot = messages;
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: text || 'Uploaded an image for analysis',
      sender: 'user',
      timestamp: new Date(),
      image: currentImage || undefined,
    };
    const aiMessageId = `${Date.now()}-ai`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
    setInput('');
    setSelectedImage(null);
    setIsTyping(true);
    setStreamingMessageId(aiMessageId);

    try {
      let streamedReply = '';

      await streamFriendlyAssistant(
        {
          message: text || 'Analyze this image.',
          role,
          userId: user?.id || null,
          userName: user?.name || null,
          image: currentImage || null,
          history: historySnapshot.map<AIChatTurn>((item) => ({
            sender: item.sender,
            text: item.text,
            image: item.image,
          })),
        },
        {
          onToken: (chunk) => {
            streamedReply += chunk;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === aiMessageId ? { ...message, text: `${message.text}${chunk}` } : message,
              ),
            );
          },
          onComplete: (fullText) => {
            if (!fullText) {
              return;
            }

            streamedReply = fullText;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === aiMessageId ? { ...message, text: fullText } : message,
              ),
            );
          },
        },
      );

      if (!streamedReply.trim()) {
        const fallbackText = getFailureReply(text, currentImage);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiMessageId ? { ...message, text: fallbackText } : message,
          ),
        );
      }
    } catch (error) {
      console.error('AI chat error:', error);

      const fallbackText = getFailureReply(text, currentImage, error);

      setMessages((prev) =>
        prev.map((message) =>
          message.id === aiMessageId ? { ...message, text: fallbackText } : message,
        ),
      );
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isTyping) {
      return;
    }
    await handleSend(prompt);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setSelectedImage(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          title="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-pink-500" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 backdrop-blur-[2px] sm:p-4">
          <div className="flex h-[100dvh] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl sm:h-[88vh] sm:max-h-[860px] sm:w-[460px] sm:rounded-3xl">
            <div className="relative overflow-hidden border-b bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-4 py-4 text-white">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 right-0 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
                <div className="absolute bottom-0 left-8 h-20 w-20 rounded-full bg-white/10 blur-xl" />
              </div>

              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                    title="Back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <RoleIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold">Agri-Invest AI Live</h2>
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-white/85">{ROLE_SUBTITLE[role] || 'AI Assistant'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={resetChat}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                    title="Start new chat"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b bg-white px-4 py-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                <Sparkles className="h-3.5 w-3.5" />
                Suggested prompts
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((item, index) => (
                  <button
                    key={`${item.label}-${index}`}
                    onClick={() => void handleQuickPrompt(item.prompt)}
                    disabled={isTyping}
                    className="whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'ai' && (
                      <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${
                        message.sender === 'user'
                          ? 'rounded-br-md bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                          : 'rounded-bl-md border border-gray-200 bg-white text-gray-900'
                      }`}
                    >
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Uploaded"
                          className="mb-2 max-h-56 w-full rounded-2xl object-cover"
                        />
                      )}

                      {message.id === streamingMessageId && !message.text.trim() ? (
                        <div className="flex items-center gap-1 py-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '0.12s' }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                            style={{ animationDelay: '0.24s' }}
                          />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                      )}

                      <div
                        className={`mt-2 text-[11px] ${
                          message.sender === 'user' ? 'text-emerald-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {selectedImage && (
              <div className="border-t bg-gray-50 px-4 py-3">
                <div className="relative inline-block">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="h-24 rounded-2xl border object-cover"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="border-t bg-white px-4 py-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-2 shadow-sm">
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-gray-600 transition hover:bg-white hover:text-green-700"
                    title="Upload image"
                    disabled={isTyping}
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>

                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="Ask anything..."
                      disabled={isTyping}
                      className="h-11 rounded-2xl border-0 bg-white pr-3 shadow-none focus-visible:ring-1 focus-visible:ring-green-500"
                    />
                  </div>

                  <Button
                    onClick={() => void handleSend()}
                    disabled={isTyping || (!input.trim() && !selectedImage)}
                    className="h-11 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 hover:from-emerald-600 hover:to-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <Leaf className="h-3 w-3" />
                  Smart farming
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <TrendingUp className="h-3 w-3" />
                  Investment insights
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <Wallet className="h-3 w-3" />
                  Payout guidance
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <Bug className="h-3 w-3" />
                  Crop support
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <Droplets className="h-3 w-3" />
                  Irrigation help
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Project workflow
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
