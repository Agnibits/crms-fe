"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * In-page full-size image preview. Click the backdrop, the X, or press
 * Escape to close — no jarring new-tab jumps.
 *   <ImageLightbox src={url} alt={name} open={open} onOpenChange={setOpen} />
 */
export default function ImageLightbox({ src, alt = "", open, onOpenChange }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open || !src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Image preview"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={() => onOpenChange(false)}
    >
      <button
        type="button"
        aria-label="Close preview"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={() => onOpenChange(false)}
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}
