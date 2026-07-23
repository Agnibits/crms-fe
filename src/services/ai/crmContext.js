/**
 * Builds a compact, text snapshot of the CRM for the AI copilot's context.
 *
 * Demo note: this reads the in-memory mock database so the copilot can answer
 * real questions without a backend. In production (USE_MOCK=false) you would
 * replace `db` here with authenticated calls to your REST API (aggregations
 * for pipeline, upcoming tasks, revenue, etc.).
 */
import { db } from "@/services/mock/db";
import { DEAL_STAGES, LEAD_STAGES } from "@/constants/options";

const money = (n) => `$${Math.round(n).toLocaleString("en-US")}`;
const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value;

export function buildCrmContext() {
  const now = Date.now();
  const MONTH_AHEAD = now + 30 * 86_400_000;

  const revenue = db.payments.reduce((a, p) => a + p.amount, 0);
  const openDeals = db.deals.filter((d) => !d.stage.startsWith("closed_"));
  const pipelineValue = openDeals.reduce((a, d) => a + d.amount, 0);

  const dealsByStage = DEAL_STAGES.map((s) => {
    const items = db.deals.filter((d) => d.stage === s.value);
    return `${s.label}: ${items.length} (${money(items.reduce((a, d) => a + d.amount, 0))})`;
  }).join(", ");

  const leadsByStage = LEAD_STAGES.map((s) => {
    const count = db.leads.filter((l) => l.stage === s.value).length;
    return `${s.label}: ${count}`;
  }).join(", ");

  const closingSoon = openDeals
    .filter((d) => {
      const t = new Date(d.expectedCloseDate).getTime();
      return t >= now && t <= MONTH_AHEAD;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((d) => `${d.name} — ${money(d.amount)}, ${labelOf(DEAL_STAGES, d.stage)}, ${d.probability}% , closes ${d.expectedCloseDate.slice(0, 10)}`);

  const topOpenDeals = [...openDeals]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)
    .map((d) => `${d.name} (${d.customerName}) — ${money(d.amount)}, ${labelOf(DEAL_STAGES, d.stage)}`);

  const upcomingTasks = db.tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6)
    .map((t) => `${t.title} — ${t.priority}, due ${t.dueDate.slice(0, 10)}`);

  const ratingRank = { hot: 0, warm: 1, cold: 2 };
  const hotLeads = [...db.leads]
    .sort((a, b) => (ratingRank[a.rating] ?? 3) - (ratingRank[b.rating] ?? 3) || (b.value || 0) - (a.value || 0))
    .slice(0, 6)
    .map((l) => `${l.name} (${l.company}) — ${l.rating || "unrated"}, ${labelOf(LEAD_STAGES, l.stage)}, ${money(l.value)}`);

  const overdueInvoices = db.invoices.filter(
    (i) => i.balance > 0 && new Date(i.dueDate).getTime() < now
  ).length;

  return `
CURRENT CRM SNAPSHOT (live demo data)
=====================================
Totals:
- Customers: ${db.customers.length}
- Leads: ${db.leads.length}
- Deals: ${db.deals.length} (open: ${openDeals.length})
- Collected revenue: ${money(revenue)}
- Open pipeline value: ${money(pipelineValue)}
- Open support tickets: ${db.tickets.filter((t) => ["open", "in_progress"].includes(t.status)).length}
- Overdue invoices: ${overdueInvoices}

Deals by stage: ${dealsByStage}
Leads by stage: ${leadsByStage}

Deals closing in the next 30 days:
${closingSoon.length ? closingSoon.map((s) => "- " + s).join("\n") : "- none"}

Top open deals by value:
${topOpenDeals.map((s) => "- " + s).join("\n")}

Hottest leads (by rating):
${hotLeads.map((s) => "- " + s).join("\n")}

Upcoming tasks:
${upcomingTasks.map((s) => "- " + s).join("\n")}
`.trim();
}
