import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

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

export function formatRelative(value) {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

export function formatCurrency(amount, currency = "USD", locale = "en-US") {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatCompactCurrency(amount, currency = "USD") {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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
