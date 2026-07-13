import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
] as const;

type LanguageSwitcherProps = {
  variant?: "default" | "compact";
  className?: string;
};

export function LanguageSwitcher({ variant = "default", className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang =
    LANGUAGES.find((l) => l.code === (i18n.language?.slice(0, 2) ?? "en")) ?? LANGUAGES[0];

  const changeLang = (code: string) => {
    void i18n.changeLanguage(code);
    localStorage.setItem("trustsaathi-lang", code);
    document.documentElement.lang = code;
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:shadow-soft",
          open && "bg-accent shadow-soft",
          variant === "compact" && "px-2 py-1 text-xs",
        )}
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe
          className={cn("h-4 w-4 text-muted-foreground", variant === "compact" && "h-3.5 w-3.5")}
        />
        <span className="hidden sm:inline">{currentLang.nativeLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose language"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-card animate-in fade-in zoom-in-95 duration-150"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                role="option"
                aria-selected={isActive}
                onClick={() => changeLang(lang.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-accent",
                )}
              >
                <span className="flex-1">
                  <span className="block leading-tight">{lang.nativeLabel}</span>
                  {lang.label !== lang.nativeLabel && (
                    <span className="block text-xs text-muted-foreground">{lang.label}</span>
                  )}
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
