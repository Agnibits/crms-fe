import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { DEFAULT_CURRENCY } from "@/constants/app";

function toDate(value) {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

export function formatDate(value, pattern = "MMM d, yyyy") {
  const date = toDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatDateTime(value) {
  return formatDate(value, "MMM d, yyyy · h:mm a");
}

/**
 * Recurring-birthday status: compares the month/day against today (ignores the
 * stored year). Returns { isToday, inDays } where inDays counts to the next
 * occurrence (0 = today), or null when there's no valid date.
 */
export function birthdayStatus(value) {
  const date = toDate(value);
  if (!date) return null;
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (next < t0) next = new Date(now.getFullYear() + 1, date.getMonth(), date.getDate());
  const inDays = Math.round((next - t0) / 86400000);
  return { isToday: inDays === 0, inDays };
}

export function formatRelative(value) {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

// narrowSymbol keeps NPR readable as "Rs 1,234.50" — the default "symbol"
// display renders it as the bare code ("NPR 1,234.50"). Other currencies are
// unaffected ($, ₹, €, £).
export function formatCurrency(amount, currency = DEFAULT_CURRENCY, locale = "en-US") {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || DEFAULT_CURRENCY,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatCompactCurrency(amount, currency = DEFAULT_CURRENCY) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || DEFAULT_CURRENCY,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount));
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(Number(value));
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `${Number(value).toFixed(digits)}%`;
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function truncate(text = "", length = 60) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export function titleCase(text = "") {
  return text
    .replaceAll(/[_-]/g, " ")
    .replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}
