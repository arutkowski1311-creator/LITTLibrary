"use client";

import { useEffect, useRef, useState } from "react";

export function SecondActForm() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // Kept in a ref so the unmount cleanup below sees the current URL without
  // re-running (and revoking a live preview) on every render.
  const previewRef = useRef("");

  function chooseImage(file: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const next = file ? URL.createObjectURL(file) : "";
    previewRef.current = next;
    setImage(file); setPreview(next);
  }

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!image) { setError("Add a photo of the object first."); return; }
    setState("sending"); setError(""); const form = new FormData(event.currentTarget); form.set("image", image);
    try {
      const response = await fetch("/api/second-act", { method: "POST", body: form });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (response.ok) setState("sent");
      else { setState("error"); setError(result.error ?? "That did not go through."); }
    } catch {
      setState("error");
      setError("That upload could not reach the studio. Check your connection and try again.");
    }
  }

  if (state === "sent") return <section className="second-act-complete"><div className="page-shell"><p className="eyebrow light">Photo received</p><h1>That object just got a second chance.</h1><p>Sam has the photo, the story and the direction you are considering. A meeting request is now waiting in his studio dashboard.</p><a className="button button-cream" href="/work">See other transformations</a></div></section>;

  return <><section className="second-act-hero"><div className="page-shell"><div><p className="eyebrow light">The Second Act</p><h1>Don&apos;t throw it out.<br /><em>Make it matter again.</em></h1><p>That old toolbox, aircraft part, family case, firehouse relic or strange thing in the garage may be the beginning of something exceptional.</p></div><img src="/assets/toolbox-bourbon-bar.webp" alt="Old toolbox transformed into a fitted bourbon bar" width={598} height={785} decoding="async" /></div></section><section className="page-shell second-act-layout"><aside><p className="eyebrow">A collaboration, not a catalog</p><h2>Show Sam what you have.</h2><p>You do not need a finished idea. Upload a photo, share the rough dimensions and tell us what would make the object useful or meaningful now.</p><ol><li><b>01</b> Upload the object</li><li><b>02</b> Share the story</li><li><b>03</b> Meet with Sam</li><li><b>04</b> Shape the second act together</li></ol></aside><form className="second-act-form" onSubmit={submit}><label className={`object-upload ${preview ? "has-image" : ""}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} /><span>{preview ? "Change photo" : "＋ Add a photo"}</span>{preview ? <img src={preview} alt="Preview of object to transform" /> : <div><b>What is sitting around your house?</b><small>JPG, PNG or WEBP · up to 8 MB</small></div>}</label><div className="second-act-fields"><label>What is it?<textarea name="objectDescription" placeholder="Old military toolbox, grandfather’s workbench, airplane part…" required /></label><label>Rough dimensions<input name="dimensions" placeholder="About 24 × 16 × 12 inches" /></label><label>What could it become?<textarea name="desiredUse" placeholder="A bourbon chest, coffee table, light fixture, bar, display… or tell us you have no idea yet." required /></label><label>Working budget<select name="budget" required><option value="">Choose a range</option><option>$500–$1,000</option><option>$1,000–$2,500</option><option>$2,500–$5,000</option><option>$5,000+</option><option>Not sure yet</option></select></label><label>Your name<input name="name" autoComplete="name" required /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label></div>{error && <p className="form-error">{error}</p>}<button className="add-bag" disabled={state === "sending"}>{state === "sending" ? "Uploading the idea…" : "Send it to The Second Act →"}</button></form></section></>;
}
