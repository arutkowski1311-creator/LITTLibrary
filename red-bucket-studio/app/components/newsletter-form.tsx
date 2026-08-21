"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email")?.toString() ?? "";
    setState("saving");
    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("saved");
      form.reset();
    } catch {
      // A dropped connection has to end the pending state, not hang on it.
      setState("error");
    }
  }

  return <form className="email-form" onSubmit={subscribe}>
    <label className="sr-only" htmlFor="email">Email address</label>
    <input id="email" name="email" type="email" placeholder="Email address" required />
    <button type="submit" disabled={state === "saving"} aria-label="Join the Bucket List">
      {state === "saving" ? "Joining…" : state === "saved" ? "You’re in ✓" : "Join"} <span>→</span>
    </button>
    {state === "error" && <span className="form-error" role="status">Try that again.</span>}
  </form>;
}
