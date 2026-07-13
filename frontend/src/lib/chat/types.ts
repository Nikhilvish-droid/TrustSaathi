export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  liked?: boolean;
  disliked?: boolean;
}

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatRequest {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  language: string;
  stream: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  error: string | null;
  conversationId: string;
}

export type QuickAction = {
  icon: string;
  label: string;
  prompt: string;
};

export type ChatModel =
  "llama-3.3-70b-versatile" | "deepseek-r1-distill-llama-70b" | "llama-3.1-8b-instant";

export interface ChatConfig {
  primaryModel: ChatModel;
  fallbackModel: ChatModel;
  maxContextMessages: number;
  maxTokens: number;
  temperature: number;
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  primaryModel: "llama-3.3-70b-versatile",
  fallbackModel: "llama-3.1-8b-instant",
  maxContextMessages: 20,
  maxTokens: 4096,
  temperature: 0.7,
};

export const QUICK_ACTIONS: QuickAction[] = [
  { icon: "📊", label: "Generate today's report", prompt: "Generate today's donation report" },
  { icon: "💰", label: "Total donations", prompt: "Show me total donations summary" },
  { icon: "👥", label: "Show donors", prompt: "Show me the list of top donors" },
  { icon: "📄", label: "Export report", prompt: "Export my donation report as CSV" },
  { icon: "📷", label: "Scan register", prompt: "Help me scan a donation register" },
  { icon: "📈", label: "Dashboard summary", prompt: "Give me a summary of my dashboard" },
  { icon: "📅", label: "Monthly income", prompt: "Show me this month's income breakdown" },
  { icon: "📚", label: "Explain 80G", prompt: "What is 80G tax exemption and how does it work?" },
  { icon: "🏛", label: "FCRA Help", prompt: "Explain FCRA compliance for NGOs" },
  { icon: "📋", label: "Audit Checklist", prompt: "Show me the audit compliance checklist" },
];
