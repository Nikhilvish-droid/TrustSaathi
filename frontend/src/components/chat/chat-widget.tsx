import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Minus, Bot, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { ChatMessageBubble } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { QuickActions } from "@/components/chat/quick-actions";
import { useTranslation } from "react-i18next";

export function ChatWidget() {
  const {
    messages,
    isOpen,
    isStreaming,
    error,
    sendMessage,
    regenerateMessage,
    toggleChat,
    closeChat,
    clearChat,
    likeMessage,
    dislikeMessage,
  } = useChat();

  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);

  const autoScroll = useRef(true);

  useEffect(() => {
    if (autoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    autoScroll.current = atBottom;
  };

  useEffect(() => {
    if (isOpen) {
      setTooltipVisible(false);
      setMinimized(false);
    }
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const showQuickActions = messages.length === 0 && !isStreaming;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          {tooltipVisible && (
            <div className="animate-in fade-in slide-in-from-bottom-2 rounded-xl bg-background border border-border px-3 py-2 shadow-lg text-xs font-medium text-foreground">
              Ask TrustSaathi AI ✨
            </div>
          )}
          <button
            onClick={toggleChat}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 sm:h-14 sm:w-14"
            aria-label="Open AI Chat"
          >
            <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
            <MessageCircle className="h-6 w-6 relative z-10" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-3xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl transition-all duration-300 sm:bottom-6 sm:right-6",
            minimized ? "h-[60px]" : "h-[min(520px,calc(100vh-120px))]",
          )}
          style={{ width: "min(380px, calc(100vw - 32px))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-none">TrustSaathi AI</h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Powered by Groq
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={clearChat}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={minimized ? "Expand" : "Minimize"}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={closeChat}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {!minimized && (
            <>
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth"
              >
                {messages.length === 0 && (
                  <div className="px-4 py-4 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold">Namaste 🙏</h3>
                    <p className="mt-1 text-sm font-medium text-foreground">I'm TrustSaathi AI</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">I can help you with</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {[
                        "💰 Donations",
                        "👥 Donors",
                        "📊 Reports",
                        "📋 Compliance",
                        "📷 OCR",
                        "💲 Pricing",
                        "📈 Dashboard",
                        "🏛 Temple Mgmt",
                        "📚 80G / FCRA",
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id}
                    onCopy={handleCopy}
                    onRegenerate={regenerateMessage}
                    onLike={likeMessage}
                    onDislike={dislikeMessage}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <QuickActions onSelect={sendMessage} visible={showQuickActions} />

              {/* Error */}
              {error && (
                <div className="mx-4 mb-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              {/* Input */}
              <ChatInput onSend={sendMessage} isStreaming={isStreaming} onStop={() => {}} />
            </>
          )}
        </div>
      )}
    </>
  );
}
