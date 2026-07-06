/**
 * In-browser demo database. Seeded with a deterministic PRNG so data is
 * stable within a session. Mutations (create/update/delete) persist in
 * memory until the page reloads.
 */

/* ── Seeded PRNG ──────────────────────────────────────────────── */
let seed = 42;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const money = (min, max) => Math.round((rand() * (max - min) + min) / 50) * 50;
const chance = (p) => rand() < p;

const NOW = Date.now();
const DAY = 86_400_000;
const daysAgo = (n) => new Date(NOW - n * DAY).toISOString();
const daysAhead = (n) => new Date(NOW + n * DAY).toISOString();

/* ── Name pools ───────────────────────────────────────────────── */
const FIRST = ["Aarav","Priya","Rahul","Sneha","Vikram","Ananya","James","Emma","Liam","Olivia","Noah","Sophia","Ethan","Mia","Lucas","Isabella","Arjun","Kavya","Rohan","Diya","Daniel","Grace","Henry","Chloe","Ryan","Zara","Omar","Layla","Chen","Yuki"];
const LAST = ["Shah","Patel","Sharma","Iyer","Mehta","Reddy","Smith","Johnson","Brown","Wilson","Taylor","Lee","Garcia","Martinez","Khan","Ali","Gupta","Verma","Nair","Chopra","Anderson","Thomas","Moore","Clark","Lewis","Walker","Hall","Young","Wang","Tanaka"];
const COMPANIES = ["Acme Corp","Globex Inc","Initech","Umbrella Ltd","Stark Industries","Wayne Enterprises","Wonka Co","Cyberdyne Systems","Soylent Corp","Hooli","Pied Piper","Vandelay Industries","Bluth Company","Dunder Mifflin","Prestige Worldwide","Massive Dynamic","Oscorp","Tyrell Corp","Aperture Labs","Nakatomi Trading","Zenith Media","Vertex Solutions","Quantum Retail","Nimbus Cloudworks","Atlas Logistics","Orbit Fintech","Pulse Health","Terra Agro","Nova Energy","Helix Bio"];
const CITIES = ["Mumbai","Bengaluru","Delhi","Pune","Hyderabad","New York","London","Singapore","Dubai","Toronto","Sydney","Berlin","Chennai","Ahmedabad"];
const INDUSTRIES = ["Technology","Manufacturing","Healthcare","Finance","Retail","Education","Real Estate","Logistics","Media","Energy"];
const PRODUCT_NAMES = ["CRM Pro License","Sales Suite","Analytics Add-on","Onboarding Package","Priority Support Plan","API Access Tier","Data Migration Service","Custom Reports Module","Email Automation Pack","Mobile App License","Training Workshop","Dedicated Success Manager","Storage Expansion 100GB","SSO Integration","Audit & Compliance Pack","Marketing Hub","Chat Widget","Territory Planner","Forecasting Engine","Quote Builder Pro","E-sign Integration","Call Tracker","WhatsApp Connector","SMS Bundle 10k","Lead Scoring AI","Duplicate Cleaner","Multi-currency Pack","Sandbox Environment","White-label Option","Partner Portal"];
const CATEGORIES = ["Licenses","Add-ons","Services","Support Plans","Integrations","Bundles"];

const person = () => `${pick(FIRST)} ${pick(LAST)}`;
const emailFor = (name, domain = "example.com") =>
  `${name.toLowerCase().replaceAll(/[^a-z ]/g, "").replaceAll(" ", ".")}@${domain}`;
const phone = () => `+91 9${int(100000000, 999999999)}`;
const avatarFor = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

/* ── Users ────────────────────────────────────────────────────── */
const ROLES_POOL = ["admin", "manager", "sales", "sales", "sales", "support", "user"];
const users = Array.from({ length: 12 }, (_, i) => {
  const name = i === 0 ? "Tahir Bilal" : person();
  return {
    id: `u-${i + 1}`,
    name,
    email: i === 0 ? "admin@agnibits.com" : emailFor(name, "agnibits.com"),
    role: i === 0 ? "admin" : ROLES_POOL[i % ROLES_POOL.length],
    avatar: avatarFor(name),
    phone: phone(),
    department: pick(["Sales", "Marketing", "Support", "Operations"]),
    status: chance(0.9) ? "active" : "inactive",
    emailVerified: true,
    lastLoginAt: daysAgo(int(0, 14)),
    createdAt: daysAgo(int(100, 700)),
  };
});
const owner = () => pick(users.filter((u) => ["sales", "manager"].includes(u.role)));

/* ── Customers & Contacts ─────────────────────────────────────── */
const customers = Array.from({ length: 60 }, (_, i) => {
  const company = COMPANIES[i % COMPANIES.length] + (i >= COMPANIES.length ? ` ${Math.floor(i / COMPANIES.length) + 1}` : "");
  const contactName = person();
  return {
    id: `c-${i + 1}`,
    name: company,
    contactName,
    email: emailFor(contactName, company.toLowerCase().replaceAll(/[^a-z]/g, "") + ".com"),
    phone: phone(),
    website: `https://www.${company.toLowerCase().replaceAll(/[^a-z]/g, "")}.com`,
    industry: pick(INDUSTRIES),
    status: pick(["active", "active", "active", "prospect", "inactive", "churned"]),
    city: pick(CITIES),
    country: pick(["India", "USA", "UK", "UAE", "Singapore", "Canada"]),
    address: `${int(1, 999)} ${pick(["Market St", "MG Road", "Main Ave", "Tech Park", "Bay Blvd"])}`,
    annualRevenue: money(50_000, 5_000_000),
    employees: int(5, 5000),
    ownerId: owner().id,
    tags: [pick(["enterprise", "smb", "startup"]), pick(["priority", "standard"])],
    notes: "",
    createdAt: daysAgo(int(30, 600)),
    updatedAt: daysAgo(int(0, 30)),
  };
});

const contacts = Array.from({ length: 70 }, (_, i) => {
  const name = person();
  const customer = pick(customers);
  return {
    id: `ct-${i + 1}`,
    name,
    email: emailFor(name),
    phone: phone(),
    jobTitle: pick(["CEO","CTO","VP Sales","Procurement Head","Finance Manager","Operations Lead","Founder","IT Manager"]),
    customerId: customer.id,
    customerName: customer.name,
    city: pick(CITIES),
    isPrimary: chance(0.3),
    avatar: avatarFor(name),
    createdAt: daysAgo(int(10, 400)),
  };
});

/* ── Leads / Opportunities / Deals ────────────────────────────── */
const LEAD_STAGES = ["new","contacted","qualified","proposal","negotiation","won","lost"];
const leads = Array.from({ length: 80 }, (_, i) => {
  const name = person();
  const company = pick(COMPANIES);
  return {
    id: `l-${i + 1}`,
    name,
    company,
    email: emailFor(name),
    phone: phone(),
    stage: pick(LEAD_STAGES),
    source: pick(["website","referral","social","email","cold_call","event","other"]),
    value: money(2_000, 250_000),
    score: int(10, 98),
    ownerId: owner().id,
    city: pick(CITIES),
    notes: "",
    createdAt: daysAgo(int(0, 180)),
    updatedAt: daysAgo(int(0, 20)),
  };
});

const DEAL_STAGES = ["qualification","needs_analysis","proposal","negotiation","closed_won","closed_lost"];
const opportunities = Array.from({ length: 45 }, (_, i) => {
  const customer = pick(customers);
  return {
    id: `o-${i + 1}`,
    name: `${customer.name} — ${pick(["Expansion","New Business","Renewal","Upsell","Pilot"])}`,
    customerId: customer.id,
    customerName: customer.name,
    stage: pick(DEAL_STAGES),
    amount: money(10_000, 800_000),
    probability: int(10, 95),
    expectedCloseDate: daysAhead(int(-30, 120)),
    ownerId: owner().id,
    createdAt: daysAgo(int(10, 300)),
  };
});

const deals = Array.from({ length: 40 }, (_, i) => {
  const customer = pick(customers);
  const stage = pick(DEAL_STAGES);
  return {
    id: `d-${i + 1}`,
    name: `${customer.name} — ${pick(["Annual Contract","Platform Deal","Services Deal","License Pack"])}`,
    customerId: customer.id,
    customerName: customer.name,
    stage,
    amount: money(15_000, 900_000),
    probability: stage === "closed_won" ? 100 : stage === "closed_lost" ? 0 : int(20, 90),
    expectedCloseDate: daysAhead(int(-60, 90)),
    closedAt: stage.startsWith("closed") ? daysAgo(int(1, 90)) : null,
    ownerId: owner().id,
    createdAt: daysAgo(int(20, 300)),
  };
});

/* ── Products ─────────────────────────────────────────────────── */
const productCategories = CATEGORIES.map((name, i) => ({
  id: `pc-${i + 1}`,
  name,
  description: `${name} offered by AgniBits CRM`,
  productCount: 0,
}));

const products = PRODUCT_NAMES.map((name, i) => {
  const category = pick(productCategories);
  category.productCount += 1;
  return {
    id: `p-${i + 1}`,
    name,
    sku: `SKU-${1000 + i}`,
    categoryId: category.id,
    categoryName: category.name,
    price: money(500, 50_000),
    cost: money(100, 20_000),
    stock: int(0, 500),
    unit: pick(["license", "seat", "pack", "hour", "unit"]),
    taxRate: pick([0, 5, 12, 18]),
    status: chance(0.9) ? "active" : "archived",
    description: `${name} — professional grade offering for growing sales teams.`,
    createdAt: daysAgo(int(50, 500)),
  };
});

/* ── Quotes / Orders / Invoices / Payments ────────────────────── */
function lineItems() {
  return Array.from({ length: int(1, 4) }, () => {
    const product = pick(products);
    const quantity = int(1, 10);
    return {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      taxRate: product.taxRate,
      total: quantity * product.price,
    };
  });
}
const sum = (items) => items.reduce((acc, it) => acc + it.total, 0);

const quotes = Array.from({ length: 30 }, (_, i) => {
  const customer = pick(customers);
  const items = lineItems();
  const subtotal = sum(items);
  const tax = Math.round(subtotal * 0.18);
  return {
    id: `q-${i + 1}`,
    number: `QT-${2001 + i}`,
    customerId: customer.id,
    customerName: customer.name,
    status: pick(["draft","sent","sent","accepted","declined","expired"]),
    items,
    subtotal,
    discount: chance(0.4) ? Math.round(subtotal * 0.05) : 0,
    tax,
    total: subtotal + tax,
    validUntil: daysAhead(int(5, 60)),
    notes: "Thank you for your business.",
    createdAt: daysAgo(int(1, 120)),
  };
});

const orders = Array.from({ length: 28 }, (_, i) => {
  const quote = pick(quotes);
  return {
    id: `so-${i + 1}`,
    number: `SO-${3001 + i}`,
    customerId: quote.customerId,
    customerName: quote.customerName,
    quoteId: quote.id,
    status: pick(["pending","confirmed","confirmed","shipped","delivered","cancelled"]),
    items: quote.items,
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    createdAt: daysAgo(int(1, 100)),
  };
});

const invoices = Array.from({ length: 32 }, (_, i) => {
  const order = pick(orders);
  const status = pick(["draft","sent","sent","partially_paid","paid","paid","overdue"]);
  const paid =
    status === "paid" ? order.total : status === "partially_paid" ? Math.round(order.total / 2) : 0;
  return {
    id: `inv-${i + 1}`,
    number: `INV-${1001 + i}`,
    customerId: order.customerId,
    customerName: order.customerName,
    orderId: order.id,
    status,
    items: order.items,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    amountPaid: paid,
    balance: order.total - paid,
    dueDate: daysAhead(int(-20, 45)),
    createdAt: daysAgo(int(1, 90)),
  };
});

const payments = invoices
  .filter((inv) => inv.amountPaid > 0)
  .map((inv, i) => ({
    id: `pay-${i + 1}`,
    number: `PAY-${5001 + i}`,
    invoiceId: inv.id,
    invoiceNumber: inv.number,
    customerId: inv.customerId,
    customerName: inv.customerName,
    amount: inv.amountPaid,
    method: pick(["card","bank_transfer","upi","cash","cheque"]),
    reference: `TXN${int(100000, 999999)}`,
    status: "completed",
    paidAt: daysAgo(int(0, 60)),
    createdAt: daysAgo(int(0, 60)),
  }));

/* ── Tasks / Activities / Events ──────────────────────────────── */
const TASK_TITLES = ["Follow up with","Send proposal to","Schedule demo for","Prepare contract for","Review requirements of","Call decision maker at","Send pricing to","Check renewal for"];
const tasks = Array.from({ length: 40 }, (_, i) => {
  const customer = pick(customers);
  return {
    id: `t-${i + 1}`,
    title: `${pick(TASK_TITLES)} ${customer.name}`,
    description: "Auto-generated demo task.",
    status: pick(["todo","todo","in_progress","review","done"]),
    priority: pick(["low","medium","medium","high","urgent"]),
    dueDate: daysAhead(int(-10, 30)),
    assigneeId: owner().id,
    relatedTo: { type: "customer", id: customer.id, name: customer.name },
    reminder: chance(0.5),
    createdAt: daysAgo(int(0, 60)),
  };
});

const activities = Array.from({ length: 60 }, (_, i) => {
  const customer = pick(customers);
  const type = pick(["call","meeting","email","note","whatsapp","sms"]);
  const user = pick(users);
  return {
    id: `a-${i + 1}`,
    type,
    subject: {
      call: `Call with ${customer.contactName}`,
      meeting: `Meeting with ${customer.name}`,
      email: `Email sent to ${customer.contactName}`,
      note: `Note about ${customer.name}`,
      whatsapp: `WhatsApp to ${customer.contactName}`,
      sms: `SMS reminder to ${customer.contactName}`,
    }[type],
    description: "Discussed requirements, pricing and next steps.",
    userId: user.id,
    userName: user.name,
    relatedTo: { type: "customer", id: customer.id, name: customer.name },
    duration: type === "call" || type === "meeting" ? int(10, 90) : null,
    createdAt: daysAgo(int(0, 45)),
  };
});

const events = Array.from({ length: 25 }, (_, i) => {
  const start = new Date(NOW + int(-10, 30) * DAY);
  start.setHours(int(9, 16), pick([0, 30]), 0, 0);
  const end = new Date(start.getTime() + int(1, 3) * 30 * 60_000);
  const customer = pick(customers);
  const type = pick(["meeting", "event", "follow_up", "task", "reminder"]);
  return {
    id: `ev-${i + 1}`,
    title: `${{meeting:"Meeting",event:"Event",follow_up:"Follow-up",task:"Task",reminder:"Reminder"}[type]}: ${customer.name}`,
    type,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: false,
    location: chance(0.5) ? "Google Meet" : pick(CITIES),
    relatedTo: { type: "customer", id: customer.id, name: customer.name },
    createdAt: daysAgo(int(0, 30)),
  };
});

/* ── Campaigns / Tickets / Notifications / Files ──────────────── */
const campaigns = Array.from({ length: 12 }, (_, i) => {
  const type = pick(["email", "email", "sms"]);
  const sent = int(500, 20_000);
  const opened = Math.round(sent * rand() * 0.6);
  return {
    id: `cam-${i + 1}`,
    name: pick(["Spring Promo","Product Launch","Re-engagement","Webinar Invite","Feature Update","Year-End Offer","Trial Nurture","Upsell Push"]) + ` ${i + 1}`,
    type,
    status: pick(["draft","scheduled","running","completed","completed","paused"]),
    subject: "Don't miss this — limited time offer inside",
    audience: pick(["All Customers","Active Leads","Churned Customers","Newsletter Subscribers"]),
    sent,
    opened,
    clicked: Math.round(opened * rand() * 0.5),
    scheduledAt: daysAhead(int(-30, 30)),
    createdAt: daysAgo(int(5, 120)),
  };
});

const tickets = Array.from({ length: 30 }, (_, i) => {
  const customer = pick(customers);
  return {
    id: `tk-${i + 1}`,
    number: `TKT-${7001 + i}`,
    subject: pick(["Cannot log in to portal","Invoice discrepancy","Feature request: exports","Integration failing","Slow dashboard performance","Billing question","Data import stuck","API rate limit issue"]),
    customerId: customer.id,
    customerName: customer.name,
    status: pick(["open","open","in_progress","resolved","closed"]),
    priority: pick(["low","medium","medium","high","urgent"]),
    assigneeId: pick(users.filter((u) => u.role === "support" || u.role === "admin")).id,
    messages: [
      { id: `m-${i}-1`, from: "customer", author: customer.contactName, body: "Hi, we're facing this issue — can you help?", createdAt: daysAgo(int(2, 20)) },
      { id: `m-${i}-2`, from: "agent", author: "Support Team", body: "Thanks for reaching out! We're looking into it.", createdAt: daysAgo(int(0, 2)) },
    ],
    createdAt: daysAgo(int(0, 40)),
    updatedAt: daysAgo(int(0, 5)),
  };
});

const notifications = Array.from({ length: 14 }, (_, i) => ({
  id: `n-${i + 1}`,
  type: pick(["lead", "deal", "invoice", "task", "ticket", "system"]),
  title: pick(["New lead assigned","Deal moved to Negotiation","Invoice paid","Task due today","Ticket escalated","Weekly report ready"]),
  message: pick(["Check the details in your pipeline.","A customer just completed payment.","Reminder: follow-up scheduled for today.","A high-priority item needs your attention."]),
  read: i > 4,
  createdAt: daysAgo(int(0, 10)),
}));

const files = Array.from({ length: 20 }, (_, i) => {
  const name = pick(["Proposal","Contract","NDA","Pricing Sheet","Requirements Doc","Onboarding Plan","Invoice Copy","Case Study"]);
  const ext = pick(["pdf", "docx", "xlsx", "png"]);
  return {
    id: `f-${i + 1}`,
    name: `${name}-${1000 + i}.${ext}`,
    type: ext,
    size: int(20_000, 8_000_000),
    url: "#",
    uploadedBy: pick(users).name,
    relatedTo: chance(0.7) ? { type: "customer", id: pick(customers).id } : null,
    createdAt: daysAgo(int(0, 90)),
  };
});

/* ── Company settings ─────────────────────────────────────────── */
const settings = {
  company: {
    name: "AgniBits Technologies",
    email: "hello@agnibits.com",
    phone: "+91 9876543210",
    website: "https://agnibits.com",
    address: "4th Floor, Tech Park One, Pune, India",
    logo: "",
    gstin: "27ABCDE1234F1Z5",
  },
  branches: [
    { id: "br-1", name: "Pune HQ", city: "Pune", country: "India", isPrimary: true },
    { id: "br-2", name: "Bengaluru Office", city: "Bengaluru", country: "India", isPrimary: false },
    { id: "br-3", name: "Dubai Office", city: "Dubai", country: "UAE", isPrimary: false },
  ],
  departments: [
    { id: "dp-1", name: "Sales", head: users[1]?.name, members: 8 },
    { id: "dp-2", name: "Marketing", head: users[2]?.name, members: 5 },
    { id: "dp-3", name: "Support", head: users[3]?.name, members: 6 },
    { id: "dp-4", name: "Operations", head: users[4]?.name, members: 4 },
  ],
  teams: [
    { id: "tm-1", name: "Enterprise Sales", lead: users[1]?.name, members: 4 },
    { id: "tm-2", name: "SMB Sales", lead: users[5]?.name, members: 5 },
    { id: "tm-3", name: "Customer Success", lead: users[3]?.name, members: 4 },
  ],
  email: { provider: "smtp", host: "smtp.agnibits.com", port: 587, fromName: "AgniBits CRM", fromEmail: "no-reply@agnibits.com", encryption: "tls" },
  sms: { provider: "twilio", senderId: "AGNIBT", enabled: true },
  tax: { defaultRate: 18, taxes: [{ id: "tx-1", name: "GST", rate: 18 }, { id: "tx-2", name: "VAT", rate: 5 }] },
  currency: { code: "USD", symbol: "$", position: "before", decimals: 2 },
  preferences: { theme: "system", language: "en", timezone: "Asia/Kolkata", dateFormat: "MMM d, yyyy" },
};

export const db = {
  users,
  customers,
  contacts,
  leads,
  opportunities,
  deals,
  "product-categories": productCategories,
  products,
  quotes,
  orders,
  invoices,
  payments,
  tasks,
  activities,
  events,
  campaigns,
  tickets,
  notifications,
  files,
  settings,
};

let idCounter = 10_000;
export const nextId = (prefix = "id") => `${prefix}-${idCounter++}`;
