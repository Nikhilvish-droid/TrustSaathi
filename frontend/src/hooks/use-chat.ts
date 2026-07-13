import { useCallback, useRef, useState, useEffect } from "react";
import type { ChatMessage, ChatState } from "@/lib/chat/types";
import { buildMessages, buildSystemPrompt, detectIntent } from "@/lib/chat/knowledge";
import { checkRateLimit, getRateLimitResetMs, sanitizeHistory, generateId } from "@/lib/chat/utils";
import { trySmartCommand } from "@/lib/chat/smart-commands";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const CONVERSATION_STORAGE_KEY = "trustsaathi-chat-history";
const MAX_CONTEXT_MESSAGES = 10;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadConversation(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-50);
  } catch {
    return [];
  }
}

function saveConversation(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  } catch {
    // ignore
  }
}

function loadLanguage(): string {
  try {
    return localStorage.getItem("trustsaathi-lang") || "en";
  } catch {
    return "en";
  }
}

async function callGroq(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  model: string,
  signal?: AbortSignal,
): Promise<Response> {
  return fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
      temperature: 0.6,
      stream: true,
    }),
    signal,
  });
}

function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (content: string) => void,
  onDone: () => void,
) {
  const decoder = new TextDecoder();
  let buffer = "";

  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onChunk(delta);
        } catch {
          // skip malformed
        }
      }
    }
    onDone();
  })();
}

interface UseChatReturn {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
  likeMessage: (messageId: string) => void;
  dislikeMessage: (messageId: string) => void;
}

export function useChat(): UseChatReturn {
  const [state, setState] = useState<ChatState>(() => ({
    messages: loadConversation(),
    isOpen: false,
    isStreaming: false,
    error: null,
    conversationId: `conv_${Date.now()}`,
  }));

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  useEffect(() => {
    saveConversation(state.messages);
  }, [state.messages]);

  const updateMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setState((prev) => ({ ...prev, messages: updater(prev.messages) }));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || state.isStreaming) return;

      if (!GROQ_API_KEY) {
        setState((prev) => ({
          ...prev,
          error: "AI is not configured. Please set VITE_GROQ_API_KEY.",
        }));
        return;
      }

      if (!checkRateLimit()) {
        const resetSec = Math.ceil(getRateLimitResetMs() / 1000);
        setState((prev) => ({ ...prev, error: `Rate limit reached. Wait ${resetSec}s.` }));
        return;
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      updateMessages((prev) => [...prev, userMessage, assistantMessage]);
      setState((prev) => ({ ...prev, isStreaming: true, error: null }));

      const language = loadLanguage();

      // Try smart commands first — fetch real data
      const smartResult = await trySmartCommand(content, language);
      if (smartResult.handled) {
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: smartResult.response, timestamp: Date.now() }
              : m,
          ),
        );
        setState((prev) => ({ ...prev, isStreaming: false }));
        return;
      }

      // Fall through to AI for general questions
      const systemPrompt = buildSystemPrompt(language);
      const contextMessages = sanitizeHistory(
        messagesRef.current.filter((m) => m.id !== assistantId),
      );
      const apiMessages = buildMessages(contextMessages, systemPrompt, MAX_CONTEXT_MESSAGES);

      const intent = detectIntent(content);
      if (intent) {
        apiMessages.push({
          role: "system",
          content: `[User intent detected: ${intent}. Provide detailed, helpful information about this topic.]`,
        });
      }

      try {
        abortRef.current = new AbortController();
        const signal = abortRef.current.signal;

        let response = await callGroq(apiMessages, PRIMARY_MODEL, signal);

        if (!response.ok) {
          if (response.status === 429) {
            await delay(2000);
            response = await callGroq(apiMessages, FALLBACK_MODEL, signal);
          }
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        parseSSEStream(
          reader,
          (delta) => {
            updateMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + delta, timestamp: Date.now() }
                  : m,
              ),
            );
          },
          () => {},
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setState((prev) => ({ ...prev, error: msg }));
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I encountered an error. Please try again." }
              : m,
          ),
        );
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false }));
        abortRef.current = null;
      }
    },
    [state.isStreaming, updateMessages],
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      const msgs = messagesRef.current;
      const idx = msgs.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      const prevUser = [...msgs]
        .slice(0, idx)
        .reverse()
        .find((m) => m.role === "user");
      if (!prevUser) return;
      updateMessages((prev) => prev.filter((m) => m.id !== messageId));
      await sendMessage(prevUser.content);
    },
    [sendMessage, updateMessages],
  );

  const toggleChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen, error: null }));
  }, []);

  const openChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true, error: null }));
  }, []);

  const closeChat = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, error: null }));
  }, []);

  const clearChat = useCallback(() => {
    setState((prev) => ({
      ...prev,
      messages: [],
      error: null,
      conversationId: `conv_${Date.now()}`,
    }));
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
  }, []);

  const likeMessage = useCallback(
    (messageId: string) => {
      updateMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, liked: true, disliked: false } : m)),
      );
    },
    [updateMessages],
  );

  const dislikeMessage = useCallback(
    (messageId: string) => {
      updateMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, disliked: true, liked: false } : m)),
      );
    },
    [updateMessages],
  );

  return {
    messages: state.messages,
    isOpen: state.isOpen,
    isStreaming: state.isStreaming,
    error: state.error,
    sendMessage,
    regenerateMessage,
    toggleChat,
    openChat,
    closeChat,
    clearChat,
    likeMessage,
    dislikeMessage,
  };
}
