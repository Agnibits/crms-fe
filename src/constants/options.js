/** Shared enumerations for statuses, stages, priorities and badge colors. */

// Lead lifecycle = qualification only (mirrors the backend LeadStatus enum).
// Proposal/negotiation/won live on the deal pipeline — a qualified lead is
// converted into a deal via the Convert flow instead of being "won" here.
export const LEAD_STAGES = [
  { value: "new", label: "New", color: "blue" },
  { value: "contacted", label: "Contacted", color: "cyan" },
  { value: "qualified", label: "Qualified", color: "violet" },
  { value: "unqualified", label: "Unqualified", color: "gray" },
  { value: "converted", label: "Converted", color: "green" },
  { value: "lost", label: "Lost", color: "red" },
];

// Stages a user may set by hand — "converted" only happens via the Convert flow.
export const LEAD_STAGES_PICKABLE = LEAD_STAGES.filter((s) => s.value !== "converted");

// Gut-feel lead temperature (backend LeadRating). Replaces the old manual
// 0–100 score input — real scoring should be computed, not typed.
export const LEAD_RATINGS = [
  { value: "hot", label: "Hot", color: "red" },
  { value: "warm", label: "Warm", color: "amber" },
  { value: "cold", label: "Cold", color: "cyan" },
];

// Ordered roughly by how often each channel shows up in this market —
// paid (advertisement) and inbound (incoming_call, walk_in) channels are kept
// separate from their organic/outbound cousins so channel ROI stays visible.
export const LEAD_SOURCES = [
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "social", label: "Social Media" },
  { value: "advertisement", label: "Advertisement" },
  { value: "email", label: "Email Campaign" },
  { value: "cold_call", label: "Cold Call" },
  { value: "incoming_call", label: "Incoming Call" },
  { value: "walk_in", label: "Walk-in" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

export const DEAL_STAGES = [
  { value: "New", label: "New", color: "blue" },
  { value: "Qualified", label: "Qualification", color: "cyan" },
  { value: "Proposal", label: "Proposal", color: "violet" },
  { value: "Negotiation", label: "Negotiation", color: "amber" },
  { value: "Closed Won", label: "Closed Won", color: "green" },
  { value: "Closed Lost", label: "Closed Lost", color: "red" },
];

export const TASK_STATUSES = [
  { value: "todo", label: "To Do", color: "gray" },
  { value: "in_progress", label: "In Progress", color: "blue" },
  { value: "in_review", label: "In Review", color: "amber" },
  { value: "done", label: "Done", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

// Kanban columns — cancelled is a terminal state shown via badge/filter, not a
// board column you drag into.
export const TASK_BOARD_STATUSES = TASK_STATUSES.filter((s) => s.value !== "cancelled");

export const PRIORITIES = [
  { value: "low", label: "Low", color: "gray" },
  { value: "medium", label: "Medium", color: "blue" },
  { value: "high", label: "High", color: "amber" },
  { value: "urgent", label: "Urgent", color: "red" },
];

// Backend CustomerStatus: ACTIVE, INACTIVE, CHURNED (PROSPECT is a Lead concept).
export const CUSTOMER_STATUSES = [
  { value: "active", label: "Active", color: "green" },
  { value: "inactive", label: "Inactive", color: "gray" },
  { value: "churned", label: "Churned", color: "red" },
];

export const QUOTE_STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "sent", label: "Sent", color: "blue" },
  { value: "accepted", label: "Accepted", color: "green" },
  { value: "declined", label: "Declined", color: "red" },
  { value: "expired", label: "Expired", color: "amber" },
];

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "amber" },
  { value: "confirmed", label: "Confirmed", color: "blue" },
  { value: "shipped", label: "Shipped", color: "violet" },
  { value: "delivered", label: "Delivered", color: "green" },
  { value: "cancelled", label: "Cancelled", color: "red" },
];

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "sent", label: "Sent", color: "blue" },
  { value: "partially_paid", label: "Partially Paid", color: "amber" },
  { value: "paid", label: "Paid", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "void", label: "Void", color: "gray" },
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const TICKET_STATUSES = [
  { value: "open", label: "Open", color: "blue" },
  { value: "in_progress", label: "In Progress", color: "amber" },
  { value: "resolved", label: "Resolved", color: "green" },
  { value: "closed", label: "Closed", color: "gray" },
];

export const ACTIVITY_TYPES = [
  { value: "call", label: "Call", color: "blue" },
  { value: "meeting", label: "Meeting", color: "violet" },
  { value: "email", label: "Email", color: "cyan" },
  { value: "note", label: "Note", color: "gray" },
  { value: "whatsapp", label: "WhatsApp", color: "green" },
  { value: "sms", label: "SMS", color: "amber" },
];

export const CAMPAIGN_STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "scheduled", label: "Scheduled", color: "blue" },
  { value: "running", label: "Running", color: "amber" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "paused", label: "Paused", color: "orange" },
];

/** Tailwind classes per badge color token used above. */
export const BADGE_COLORS = {
  gray: "bg-muted text-muted-foreground border-transparent",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export function findOption(options, value) {
  return options.find((o) => o.value === value);
}
