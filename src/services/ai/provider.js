/**
 * Server-side AI provider layer — provider-agnostic.
 *
 * Supports Google Gemini and Groq (OpenAI-compatible). Pick one by adding its
 * key to .env.local; if both are present, AI_PROVIDER decides (default: groq).
 *
 *   # Option A — Groq (recommended, very reliable free tier)
 *   GROQ_API_KEY=...            # https://console.groq.com/keys
 *   GROQ_MODEL=llama-3.3-70b-versatile   (optional)
 *
 *   # Option B — Google Gemini
 *   GEMINI_API_KEY=...          # https://aistudio.google.com/apikey
 *   GEMINI_MODEL=gemini-2.0-flash        (optional)
 *
 *   AI_PROVIDER=groq|gemini     # optional explicit override
 *
 * Adding another OpenAI-compatible provider (Cerebras, OpenRouter, Together…)
 * is a one-line base-URL change in callOpenAICompatible.
 *
 * With no key configured, calls fall back to a deterministic mock response so
 * the app works end-to-end without credentials.
 */

const AI_PROVIDER = (process.env.AI_PROVIDER || "").toLowerCase();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function activeProvider() {
  if (AI_PROVIDER === "groq") return GROQ_KEY ? "groq" : "mock";
  if (AI_PROVIDER === "gemini") return GEMINI_KEY ? "gemini" : "mock";
  // Auto-detect: prefer Groq (more reliable free tier), then Gemini.
  if (GROQ_KEY) return "groq";
  if (GEMINI_KEY) return "gemini";
  return "mock";
}

export const aiEnabled = activeProvider() !== "mock";

/**
 * generateText({ system, messages, json }) → { text, source, error? }
 *   messages — [{ role: "user"|"assistant", content }]
 *   json     — when true, request strict JSON output
 */
export async function generateText({ system, messages, json = false }) {
  const provider = activeProvider();

  if (provider === "mock") {
    return { text: mockResponse({ messages, json, reason: "no-key" }), source: "mock" };
  }

  try {
    const text =
      provider === "gemini"
        ? await callGemini({ system, messages, json })
        : await callGroq({ system, messages, json });
    return { text, source: provider };
  } catch (error) {
    return {
      text: mockResponse({ messages, json, reason: "error", error: error.message }),
      source: "mock",
      error: error.message,
    };
  }
}

/* ── Google Gemini ────────────────────────────────────────────── */
async function callGemini({ system, messages, json }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await friendlyHttpError(res, "Gemini"));
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

/* ── Groq (OpenAI-compatible) ─────────────────────────────────── */
async function callGroq({ system, messages, json }) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.7,
      max_tokens: 1024,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(await friendlyHttpError(res, "Groq"));
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

async function friendlyHttpError(res, name) {
  const raw = await res.text().catch(() => "");
  if (res.status === 429) return `${name} quota/rate limit hit (429). Try again shortly or switch provider.`;
  if (res.status === 401 || res.status === 403) return `${name} rejected the API key (${res.status}).`;
  return `${name} error ${res.status}: ${raw.slice(0, 160)}`;
}

/* ── Deterministic mock (no key / on error) ───────────────────── */
function mockResponse({ messages, json, reason, error }) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";

  if (json) {
    return JSON.stringify({
      subject: "Following up on our conversation",
      body:
        "Hi there,\n\nThank you for taking the time to connect. I wanted to follow up and see how we can help your team hit its goals this quarter.\n\nWould you be open to a quick 15-minute call this week? I'd love to walk you through how our platform can streamline your sales process.\n\nBest regards,\nYour Sales Team",
    });
  }

  if (reason === "error") {
    return [
      "**(Showing a demo answer — the AI provider returned an error.)**",
      "",
      `> ${error}`,
      "",
      "Fix options:",
      "- If it's a Gemini quota (429 / limit 0): create a new key via **AI Studio → Create API key in a new project**.",
      "- Or add a **Groq** key (very reliable free tier): `GROQ_API_KEY=...` in `.env.local`, then restart.",
    ].join("\n");
  }

  return [
    "**(Demo AI — no API key set)**",
    "",
    `I understood: "${lastUser.slice(0, 160)}"`,
    "",
    "Add a free key to `.env.local` and restart to get real answers over your CRM data:",
    "",
    "```",
    "GROQ_API_KEY=your_key_from_console.groq.com/keys",
    "```",
  ].join("\n");
}
