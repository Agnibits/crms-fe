"use client";

import { useCallback, useRef, useState } from "react";

const GREETING = {
  role: "assistant",
  content:
    "Hi, I'm **Agni** — your AI sales copilot. 👋\n\nAsk me things like:\n- Which deals are closing this month?\n- What's my open pipeline value?\n- Show my hottest leads\n- Draft a follow-up email to Acme Corp",
};

/** Manages the copilot conversation and talks to /api/ai/chat. */
export function useAiChat() {
  const [messages, setMessages] = useState([GREETING]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const send = useCallback(
    async (text) => {
      const content = text.trim();
      if (!content || loading) return;

      const next = [...messages, { role: "user", content }];
      setMessages([...next, { role: "assistant", content: "", pending: true }]);
      setLoading(true);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
          signal: abortRef.current.signal,
        });
        const data = await res.json();
        setMessages([...next, { role: "assistant", content: data.text || "…", source: data.source }]);
      } catch (error) {
        if (error.name === "AbortError") return;
        setMessages([
          ...next,
          { role: "assistant", content: "Sorry, I couldn't reach the AI service. Please try again." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  const reset = useCallback(() => setMessages([GREETING]), []);

  return { messages, loading, send, reset };
}
