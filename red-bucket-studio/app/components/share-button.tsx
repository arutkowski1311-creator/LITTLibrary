"use client";

import { useState } from "react";

export function ShareButton({ title, text, path }: { title: string; text: string; path?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path ?? window.location.pathname}`;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // A dismissed native share sheet is not an error the visitor needs to see.
    }
  }

  return <button className="share-button" type="button" onClick={share}>{copied ? "Link copied ✓" : "Share ↗"}</button>;
}
