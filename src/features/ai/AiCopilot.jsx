"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { useAiChat } from "./useAiChat";
import MiniMarkdown from "./MiniMarkdown";

const SUGGESTIONS = [
  "Which deals are closing this month?",
  "What's my open pipeline value?",
  "Show my hottest leads",
  "Draft a follow-up email to Acme Corp",
];

export default function AiCopilot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, send, reset } = useAiChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 cursor-pointer"
            aria-label="Open AI copilot"
          >
            <Sparkles className="h-6 w-6" />
            <span className="absolute right-0 top-0 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-background" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed bottom-5 right-5 z-50 flex h-[min(600px,80vh)] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Agni AI</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Sales copilot</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-sm" onClick={reset} aria-label="New chat">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2",
                      msg.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-muted"
                    )}
                  >
                    {msg.pending ? (
                      <div className="flex items-center gap-1 py-1">
                        {[0, 0.15, 0.3].map((delay) => (
                          <motion.span
                            key={delay}
                            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay }}
                          />
                        ))}
                      </div>
                    ) : msg.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    ) : (
                      <MiniMarkdown content={msg.content} />
                    )}
                  </div>
                </div>
              ))}

              {/* Suggestion chips (only on the fresh greeting) */}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border bg-background px-2.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your pipeline…"
                disabled={loading}
                aria-label="Message"
              />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
