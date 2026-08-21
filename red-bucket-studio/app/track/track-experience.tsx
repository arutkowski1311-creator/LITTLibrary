"use client";

import { useState } from "react";
import { projectStages as stages } from "../lib/ops-data";

type TrackedProject = { code: string; name: string; status: string; stage: string; dueLabel: string; progress: number };

export function TrackExperience() {
  const [project, setProject] = useState<TrackedProject | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function track(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading"); setMessage(""); setProject(null);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({})) as { project?: TrackedProject; error?: string };
      if (response.ok && result.project) { setProject(result.project); setState("idle"); }
      else { setState("error"); setMessage(result.error ?? "We could not find that build."); }
    } catch {
      setState("error");
      setMessage("We could not reach the shop just now. Try again in a moment.");
    }
  }

  async function shareProgress() {
    if (!project) return;
    const text = `${project.name} is ${project.progress}% complete at Red Bucket Design Co.`;
    if (navigator.share) await navigator.share({ title: `${project.code} build update`, text, url: window.location.href });
    else { await navigator.clipboard.writeText(text); setCopied(true); }
  }

  return <section className="track-page">
    <div className="page-shell track-shell">
      <div className="track-intro"><p className="eyebrow">Your build, without the guesswork</p><h1>See what&apos;s happening in the shop.</h1><p>Use the project code from your confirmation and the email attached to the build.</p></div>
      <div className="track-card">
        {!project ? <form onSubmit={track}><label>Project code<input name="code" placeholder="RB-000" autoCapitalize="characters" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><button className="add-bag" type="submit" disabled={state === "loading"}>{state === "loading" ? "Finding your build…" : "Track my build →"}</button>{state === "error" && <p className="track-error" role="status">{message}</p>}<small>Need help? <a href="mailto:redbucketdesignco@gmail.com">Email the studio.</a></small></form> : <div className="track-result"><div className="track-result-head"><div><p>{project.code}</p><h2>{project.name}</h2></div><strong>{project.progress}%</strong></div><div className="track-meter"><i style={{ width: `${project.progress}%` }} /></div><p className="current-stage">In the shop now <b>{project.stage}</b></p><div className="customer-timeline">{stages.map((stage) => { const current = Math.max(0, stages.indexOf(project.status)); const index = stages.indexOf(stage); return <div className={index < current ? "done" : index === current ? "current" : ""} key={stage}><i>{index < current ? "✓" : index + 1}</i><span>{stage}</span></div>; })}</div><div className="track-result-foot"><span>Expected completion <b>{project.dueLabel}</b></span><button onClick={shareProgress}>{copied ? "Update copied ✓" : "Share this update ↗"}</button></div><button className="track-another" onClick={() => setProject(null)}>Track another project</button></div>}
      </div>
    </div>
  </section>;
}
