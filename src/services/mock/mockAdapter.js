/**
 * Axios adapter that serves every request from the in-browser demo DB.
 * Enabled when NEXT_PUBLIC_USE_MOCK=true. Supports the same contract as
 * the real API: `{ success, message, data }` envelope, list pagination,
 * auth flows and sub-resources.
 */
import { db, nextId } from "./db";

let currentUser = null;

const LATENCY = () => 150 + Math.random() * 350;

function respond(config, data, { status = 200, message = "OK" } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const payload = { success: status < 400, message, data };
      const response = { data: payload, status, statusText: message, headers: {}, config };
      if (status < 400) return resolve(response);
      const error = new Error(message);
      error.response = response;
      error.config = config;
      error.isAxiosError = true;
      reject(error);
    }, LATENCY());
  });
}

function parseBody(config) {
  if (!config.data) return {};
  if (typeof config.data === "string") {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    return Object.fromEntries(config.data.entries());
  }
  return config.data;
}

/* ── Generic list engine: search / filter / sort / paginate ───── */
function applyList(items, params = {}) {
  let result = [...items];
  const { page = 1, limit = 10, search, sortBy, sortOrder = "desc", ...filters } = params;

  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter((item) =>
      Object.values(item).some((v) => typeof v === "string" && v.toLowerCase().includes(q))
    );
  }

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    result = result.filter((item) => {
      const field = item[key];
      if (Array.isArray(value)) return value.includes(field);
      return String(field) === String(value);
    });
  }

  if (sortBy) {
    result.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  } else {
    result.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }

  const total = result.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;
  return {
    items: result.slice(start, start + limitNum),
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
  };
}

/* ── Related sub-resources ────────────────────────────────────── */
function subResource(collection, id, sub) {
  switch (sub) {
    case "timeline":
    case "activities":
      return db.activities.filter((a) => a.relatedTo?.id === id);
    case "contacts":
      return db.contacts.filter((c) => c.customerId === id);
    case "deals":
      return db.deals.filter((d) => d.customerId === id);
    case "invoices":
      return db.invoices.filter((i) => i.customerId === id);
    case "quotes":
      return db.quotes.filter((q) => q.customerId === id);
    case "orders":
      return db.orders.filter((o) => o.customerId === id);
    case "payments":
      return db.payments.filter((p) => p.invoiceId === id || p.customerId === id);
    case "files":
      return db.files.filter((f) => f.relatedTo?.id === id);
    case "tasks":
      return db.tasks.filter((t) => t.relatedTo?.id === id);
    case "notes":
      return db.activities.filter((a) => a.type === "note" && a.relatedTo?.id === id);
    case "history":
      return db.activities.filter((a) => a.relatedTo?.id === id).slice(0, 10);
    default:
      return [];
  }
}

/* ── Dashboard aggregations ───────────────────────────────────── */
function dashboardStats() {
  const wonDeals = db.deals.filter((d) => d.stage === "closed_won");
  const lostDeals = db.deals.filter((d) => d.stage === "closed_lost");
  const revenue = db.payments.reduce((acc, p) => acc + p.amount, 0);
  const convertedLeads = db.leads.filter((l) => l.stage === "won").length;
  return {
    totalCustomers: db.customers.length,
    totalLeads: db.leads.length,
    totalDeals: db.deals.length,
    revenue,
    customersGrowth: 12.4,
    leadsGrowth: 8.1,
    dealsGrowth: -2.3,
    revenueGrowth: 18.9,
    conversionRate: Math.round((convertedLeads / db.leads.length) * 1000) / 10,
    winRate: Math.round((wonDeals.length / Math.max(1, wonDeals.length + lostDeals.length)) * 1000) / 10,
    openTickets: db.tickets.filter((t) => ["open", "in_progress"].includes(t.status)).length,
    pendingTasks: db.tasks.filter((t) => t.status !== "done").length,
  };
}

function salesChart() {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  let base = 42_000;
  return months.map((month) => {
    base = Math.max(20_000, base + (Math.random() - 0.42) * 18_000);
    return {
      month,
      revenue: Math.round(base),
      target: 55_000,
      deals: Math.round(base / 9_000),
    };
  });
}

function funnel() {
  const stages = ["new", "contacted", "qualified", "proposal", "negotiation", "won"];
  const labels = { new: "New", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", won: "Won" };
  let cumulative = db.leads.length;
  return stages.map((stage, i) => {
    const count = i === 0 ? db.leads.length : Math.max(2, Math.round(cumulative * 0.68));
    cumulative = count;
    return { stage: labels[stage], count };
  });
}

function pipeline() {
  const stages = [
    { value: "qualification", label: "Qualification" },
    { value: "needs_analysis", label: "Needs Analysis" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed_won", label: "Closed Won" },
  ];
  return stages.map((s) => {
    const stageDeals = db.deals.filter((d) => d.stage === s.value);
    return {
      stage: s.label,
      count: stageDeals.length,
      value: stageDeals.reduce((acc, d) => acc + d.amount, 0),
    };
  });
}

/* ── Reports ──────────────────────────────────────────────────── */
function report(type) {
  switch (type) {
    case "revenue":
      return { series: salesChart(), total: db.payments.reduce((a, p) => a + p.amount, 0) };
    case "customers":
      return {
        byStatus: ["active", "prospect", "inactive", "churned"].map((status) => ({
          status,
          count: db.customers.filter((c) => c.status === status).length,
        })),
        byIndustry: [...new Set(db.customers.map((c) => c.industry))].map((industry) => ({
          industry,
          count: db.customers.filter((c) => c.industry === industry).length,
        })),
      };
    case "leads":
      return {
        bySource: [...new Set(db.leads.map((l) => l.source))].map((source) => ({
          source,
          count: db.leads.filter((l) => l.source === source).length,
        })),
        byStage: [...new Set(db.leads.map((l) => l.stage))].map((stage) => ({
          stage,
          count: db.leads.filter((l) => l.stage === stage).length,
        })),
      };
    case "sales":
      return { pipeline: pipeline(), funnel: funnel(), monthly: salesChart() };
    case "products":
      return {
        top: db.products.slice(0, 10).map((p) => ({ name: p.name, revenue: p.price * (10 + Math.round(Math.random() * 40)), stock: p.stock })),
      };
    case "employees":
      return {
        performance: db.users
          .filter((u) => ["sales", "manager"].includes(u.role))
          .map((u) => ({
            name: u.name,
            deals: db.deals.filter((d) => d.ownerId === u.id).length,
            revenue: db.deals
              .filter((d) => d.ownerId === u.id && d.stage === "closed_won")
              .reduce((a, d) => a + d.amount, 0),
          })),
      };
    default:
      return {};
  }
}

/* ── Auth ─────────────────────────────────────────────────────── */
function handleAuth(path, body, config) {
  if (path === "/auth/login") {
    const user = db.users.find((u) => u.email.toLowerCase() === body.email?.toLowerCase()) || db.users[0];
    currentUser = user;
    return respond(config, {
      user,
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
    }, { message: "Login successful" });
  }
  if (path === "/auth/register") {
    const user = {
      id: nextId("u"),
      name: body.name,
      email: body.email,
      role: "user",
      avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(body.name || "User")}`,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(user);
    currentUser = user;
    return respond(config, {
      user,
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
    }, { message: "Account created. Please verify your email." });
  }
  if (path === "/auth/refresh-token") {
    return respond(config, {
      accessToken: `mock-access-${Date.now()}`,
      refreshToken: `mock-refresh-${Date.now()}`,
    });
  }
  if (path === "/auth/me") return respond(config, currentUser || db.users[0]);
  if (path === "/auth/profile") {
    currentUser = { ...(currentUser || db.users[0]), ...body };
    return respond(config, currentUser, { message: "Profile updated" });
  }
  if (path === "/auth/avatar") {
    return respond(config, { avatar: (currentUser || db.users[0]).avatar }, { message: "Avatar updated" });
  }
  if (path === "/auth/forgot-password")
    return respond(config, null, { message: "Password reset link sent to your email" });
  if (path === "/auth/reset-password")
    return respond(config, null, { message: "Password reset successfully" });
  if (path === "/auth/verify-email")
    return respond(config, null, { message: "Email verified successfully" });
  if (path === "/auth/change-password")
    return respond(config, null, { message: "Password changed successfully" });
  if (path === "/auth/logout") return respond(config, null, { message: "Logged out" });
  return respond(config, null, { status: 404, message: "Not found" });
}

/* ── Main adapter ─────────────────────────────────────────────── */
export function mockAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const url = new URL(config.url, "http://mock.local");
  let path = url.pathname.replace(/\/$/, "");
  // Strip any baseURL prefix (e.g. /api/v1).
  const apiIdx = path.indexOf("/api/");
  if (apiIdx !== -1) path = path.replace(/^.*\/api\/v\d+/, "");
  const params = { ...Object.fromEntries(url.searchParams.entries()), ...(config.params || {}) };
  const body = parseBody(config);
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "auth") return handleAuth(path, body, config);

  /* Dashboard */
  if (segments[0] === "dashboard") {
    const sub = segments[1];
    if (sub === "stats") return respond(config, dashboardStats());
    if (sub === "sales-chart") return respond(config, salesChart());
    if (sub === "funnel") return respond(config, funnel());
    if (sub === "pipeline") return respond(config, pipeline());
    if (sub === "recent-activities") return respond(config, db.activities.slice(0, 8));
    if (sub === "upcoming-tasks")
      return respond(config, db.tasks.filter((t) => t.status !== "done").slice(0, 6));
  }

  /* Global search */
  if (segments[0] === "search") {
    const q = String(params.q || params.search || "").toLowerCase();
    const match = (items, fields, type, href) =>
      items
        .filter((it) => fields.some((f) => String(it[f] ?? "").toLowerCase().includes(q)))
        .slice(0, 5)
        .map((it) => ({ id: it.id, type, title: it.name || it.subject || it.title || it.number, subtitle: it.email || it.customerName || it.company || "", href: `${href}/${it.id}` }));
    return respond(config, q.length < 2 ? [] : [
      ...match(db.customers, ["name", "email"], "customer", "/customers"),
      ...match(db.leads, ["name", "company", "email"], "lead", "/leads"),
      ...match(db.deals, ["name", "customerName"], "deal", "/deals"),
      ...match(db.contacts, ["name", "email"], "contact", "/contacts"),
      ...match(db.products, ["name", "sku"], "product", "/products"),
    ]);
  }

  /* Reports */
  if (segments[0] === "reports") {
    return respond(config, report(segments[1] || params.type));
  }

  /* Settings */
  if (segments[0] === "settings") {
    const key = segments[1];
    if (!key) return respond(config, db.settings);
    if (method === "get") return respond(config, db.settings[key]);
    if (Array.isArray(db.settings[key])) {
      if (method === "post") {
        const item = { id: nextId(key), ...body };
        db.settings[key].push(item);
        return respond(config, item, { message: "Created" });
      }
      if (segments[2] && (method === "put" || method === "patch")) {
        const idx = db.settings[key].findIndex((i) => i.id === segments[2]);
        if (idx !== -1) db.settings[key][idx] = { ...db.settings[key][idx], ...body };
        return respond(config, db.settings[key][idx], { message: "Updated" });
      }
      if (segments[2] && method === "delete") {
        db.settings[key] = db.settings[key].filter((i) => i.id !== segments[2]);
        return respond(config, null, { message: "Deleted" });
      }
    }
    db.settings[key] = { ...db.settings[key], ...body };
    return respond(config, db.settings[key], { message: "Settings saved" });
  }

  /* Notifications special routes */
  if (segments[0] === "notifications") {
    if (segments[1] === "read-all") {
      db.notifications.forEach((n) => (n.read = true));
      return respond(config, null, { message: "All marked as read" });
    }
    if (segments[2] === "read") {
      const n = db.notifications.find((x) => x.id === segments[1]);
      if (n) n.read = true;
      return respond(config, n);
    }
  }

  /* Generic collection CRUD */
  const collection = db[segments[0]];
  if (Array.isArray(collection)) {
    const [, id, sub] = segments;

    if (method === "get" && !id) return respond(config, applyList(collection, params));
    if (method === "get" && id && sub) return respond(config, subResource(segments[0], id, sub));
    if (method === "get" && id) {
      const item = collection.find((i) => i.id === id);
      return item
        ? respond(config, item)
        : respond(config, null, { status: 404, message: "Not found" });
    }
    if (method === "post" && id === "bulk-delete") {
      const ids = body.ids || [];
      db[segments[0]] = collection.filter((i) => !ids.includes(i.id));
      return respond(config, null, { message: `${ids.length} items deleted` });
    }
    if (method === "post" && id && sub) {
      // Generic action, e.g. /leads/:id/convert
      const item = collection.find((i) => i.id === id);
      if (sub === "convert" && segments[0] === "leads" && item) {
        item.stage = "won";
        const customer = {
          id: nextId("c"),
          name: item.company || item.name,
          contactName: item.name,
          email: item.email,
          phone: item.phone,
          status: "active",
          industry: "Technology",
          city: item.city || "",
          country: "",
          ownerId: item.ownerId,
          tags: ["converted"],
          createdAt: new Date().toISOString(),
        };
        db.customers.unshift(customer);
        return respond(config, customer, { message: "Lead converted to customer" });
      }
      return respond(config, item, { message: "Action completed" });
    }
    if (method === "post") {
      const item = {
        id: nextId(segments[0].slice(0, 2)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...body,
      };
      collection.unshift(item);
      return respond(config, item, { message: "Created successfully" });
    }
    if ((method === "put" || method === "patch") && id) {
      const idx = collection.findIndex((i) => i.id === id);
      if (idx === -1) return respond(config, null, { status: 404, message: "Not found" });
      collection[idx] = { ...collection[idx], ...body, updatedAt: new Date().toISOString() };
      return respond(config, collection[idx], { message: "Updated successfully" });
    }
    if (method === "delete" && id) {
      const idx = collection.findIndex((i) => i.id === id);
      if (idx !== -1) collection.splice(idx, 1);
      return respond(config, null, { message: "Deleted successfully" });
    }
  }

  return respond(config, null, { status: 404, message: `Mock route not found: ${method.toUpperCase()} ${path}` });
}
