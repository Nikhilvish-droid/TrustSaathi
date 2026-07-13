import { useState, useRef, useEffect } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
  onCopy: (text: string) => void;
  onRegenerate: (id: string) => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
}

export function ChatMessageBubble({
  message,
  isStreaming,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const showActions = isAssistant && message.content && !isStreaming;

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("group flex gap-3 px-4", isUser ? "justify-end" : "justify-start")}>
      {isAssistant && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-1">
          TS
        </div>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[82%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted border border-border rounded-bl-md",
          )}
        >
          {isAssistant ? (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="my-1">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em>{children}</em>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="rounded bg-muted-foreground/10 px-1 py-0.5 text-xs font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={cn("block text-xs font-mono", className)}>{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                      {children}
                    </pre>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border-b border-border px-2 py-1 text-left font-semibold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-border px-2 py-1">{children}</td>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <h1 className="text-base font-bold">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
                  hr: () => <hr className="my-2 border-border" />,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}

          {isAssistant && isStreaming && !message.content && (
            <div className="flex items-center gap-1.5 py-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={() => onRegenerate(message.id)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Regenerate"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onLike(message.id)}
              className={cn(
                "rounded-md p-1 transition-colors",
                message.liked
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
              title="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDislike(message.id)}
              className={cn(
                "rounded-md p-1 transition-colors",
                message.disliked
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
              title="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
