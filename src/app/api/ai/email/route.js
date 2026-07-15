import { NextResponse } from "next/server";
import { generateText } from "@/services/ai/provider";
import { isAuthenticated } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SYSTEM = `You are an expert B2B sales copywriter for the AgniBits CRM.
Write a single email (or SMS if channel is "sms") based on the user's brief.

Return STRICT JSON only, matching this shape:
{"subject": "string (omit or empty for SMS)", "body": "string"}

Guidelines:
- Match the requested tone and length.
- Personalize with any recipient/company details provided.
- For SMS: keep the body under 300 characters, no subject.
- No placeholders like [Name] unless the brief lacks that detail.
- Do not wrap the JSON in markdown fences.`;

export async function POST(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { channel = "email", tone = "professional", length = "medium", brief = "", recipient = "", company = "" } =
      await request.json();

    const userPrompt = [
      `Channel: ${channel}`,
      `Tone: ${tone}`,
      `Length: ${length}`,
      recipient && `Recipient: ${recipient}`,
      company && `Company: ${company}`,
      `Brief: ${brief || "Write a friendly follow-up."}`,
    ]
      .filter(Boolean)
      .join("\n");

    const { text, source } = await generateText({
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
      json: true,
    });

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Model returned prose — best-effort wrap.
      parsed = { subject: "", body: text };
    }

    return NextResponse.json({
      subject: parsed.subject || "",
      body: parsed.body || "",
      source,
    });
  } catch (error) {
    return NextResponse.json(
      { subject: "", body: "Sorry, I couldn't draft that. Please try again.", source: "error", error: error.message },
      { status: 200 }
    );
  }
}
