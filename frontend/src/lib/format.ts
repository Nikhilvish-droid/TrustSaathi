import i18n from "i18next";

function currentLocale(): string {
  const lang = i18n.language?.slice(0, 2) ?? "en";
  if (lang === "en") return "en-IN";
  return lang;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(currentLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat(currentLocale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(currentLocale()).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
