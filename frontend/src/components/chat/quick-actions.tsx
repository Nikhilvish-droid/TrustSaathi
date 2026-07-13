import { QUICK_ACTIONS } from "@/lib/chat/types";

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  visible: boolean;
}

export function QuickActions({ onSelect, visible }: QuickActionsProps) {
  if (!visible) return null;

  return (
    <div className="px-4 pb-2">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Quick actions</p>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
