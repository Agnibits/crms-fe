"use client";

import { Fragment } from "react";

/**
 * Minimal, XSS-safe markdown renderer for AI chat output.
 * Supports: **bold**, `code`, bullet lists (- / *), and line breaks.
 * It builds React elements from plain text — no dangerouslySetInnerHTML.
 */
function renderInline(text, keyPrefix) {
  // Split on **bold** and `code`, keeping delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export default function MiniMarkdown({ content = "" }) {
  const lines = content.split("\n");
  const blocks = [];
  let list = null;

  const flush = () => {
    if (list) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-1 ml-4 list-disc space-y-0.5">
          {list.map((item, i) => (
            <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      );
      list = null;
    }
  };

  lines.forEach((line, i) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      (list ||= []).push(bullet[1]);
      return;
    }
    flush();
    if (line.trim() === "") {
      blocks.push(<div key={`sp-${i}`} className="h-2" />);
    } else {
      blocks.push(
        <p key={`p-${i}`} className="leading-relaxed">
          {renderInline(line, `p-${i}`)}
        </p>
      );
    }
  });
  flush();

  return <div className="space-y-0.5 text-sm">{blocks}</div>;
}
