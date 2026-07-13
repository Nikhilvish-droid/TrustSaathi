import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, isStreaming, disabled, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm p-3">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask TrustSaathi AI anything..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm leading-relaxed",
            "placeholder:text-muted-foreground",
            "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-[120px]",
          )}
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all",
              value.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
            title="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        TrustSaathi AI may produce inaccurate information. Consult a professional for
        legal/financial advice.
      </p>
    </div>
  );
}
