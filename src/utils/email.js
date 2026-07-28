/**
 * Drop the quoted reply history from a plain-text message body so it shows only
 * what was newly written (like Gmail's collapsed "…"). Cuts at the first quote
 * marker or ">" line. Shared by the Inbox thread and the ticket conversation.
 */
export function stripQuotedText(text = "") {
  if (!text) return "";
  const lines = String(text).split("\n");
  const markers = [
    /^\s*On\b.*\bwrote:\s*$/i, // Gmail / Apple Mail attribution line
    /^\s*-{2,}\s*Original Message\s*-{2,}/i, // Outlook
    /^\s*From:\s.+\S+@\S+/i, // Outlook header block
    /^\s*_{5,}\s*$/, // separator rule
    /^\s*>{1,}/, // quoted line
  ];
  const cut = lines.findIndex((l) => markers.some((re) => re.test(l)));
  const kept = cut === -1 ? lines : lines.slice(0, cut);
  const out = kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // If stripping left nothing (a reply that was ALL quote), keep the full text.
  return out || String(text).trim();
}
