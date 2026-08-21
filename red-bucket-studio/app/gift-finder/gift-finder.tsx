"use client";

import { useState } from "react";

const people = ["Partner", "Parent", "Friend", "Coworker", "Coach", "Client", "Someone else"];
const interests = ["First responder", "Sports & outdoors", "Medicine", "Education", "College", "Aviation", "Automotive", "Bourbon & cigars", "Firearms", "Guitar & instruments", "Live music", "Reading", "Family history", "Something else"];
const occasions = ["Birthday", "Anniversary", "Wedding", "New home", "Retirement", "Graduation", "Holiday", "Thank you", "Just because", "Something else"];
const budgets = ["$100–$500", "$500–$1,000", "$1,000+"];

export function GiftFinder() {
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState("");
  const [otherPerson, setOtherPerson] = useState("");
  const [chosenInterests, setChosenInterests] = useState<string[]>([]);
  const [otherInterest, setOtherInterest] = useState("");
  const [occasion, setOccasion] = useState("");
  const [otherOccasion, setOtherOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const resolvedPerson = person === "Someone else" ? otherPerson : person;
  const resolvedInterests = chosenInterests.map((item) => item === "Something else" ? otherInterest : item).filter(Boolean);
  const resolvedOccasion = occasion === "Something else" ? otherOccasion : occasion;
  const canContinue = step === 1 ? Boolean(resolvedPerson.trim()) : step === 2 ? Boolean(resolvedInterests.length && (!chosenInterests.includes("Something else") || otherInterest.trim())) : step === 3 ? Boolean(resolvedOccasion.trim()) : step === 4 ? Boolean(budget) : true;

  function toggleInterest(item: string) { setChosenInterests((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); }

  async function submitBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("sending"); const contact = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...contact, person: resolvedPerson, interest: resolvedInterests.join(", "), occasion: resolvedOccasion, budget, story: notes || "Commission meeting requested.", source: "commission" }) });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") return <section className="finder-complete"><div className="page-shell"><span className="complete-mark">RB</span><p className="eyebrow light">Commission request received</p><h1>Now the good part starts.</h1><p>Sam has the context and a meeting request is waiting in his studio dashboard. He&apos;ll reach out to talk through the person, the occasion and what could make this land perfectly.</p><div><a className="button button-cream" href="/work">Explore Custom Builds</a><a className="button button-ghost" href="/second-act">Have an object to transform?</a></div></div></section>;

  return <section className="finder-shell finder-new">
    <div className="finder-image"><img src="/assets/toolbox-bourbon-bar.webp" alt="Vintage toolbox transformed into a custom bourbon bar" width={598} height={785} decoding="async" /><div><span>Commission a Piece</span><p>No algorithms. No canned answers. Give Sam the clues and build the idea together.</p></div></div>
    <div className="finder-panel"><div className="finder-progress"><span role="status" aria-live="polite">{step < 5 ? `Question ${step} of 4` : "Review your commission"}</span><div><i style={{ width: `${Math.min(step, 4) * 25}%` }} /></div></div>
      {step === 1 && <div className="finder-question"><p className="eyebrow">The person</p><h1>Who are you trying to impress?</h1><div className="choice-grid">{people.map((item) => <button type="button" className={person === item ? "chosen" : ""} aria-pressed={person === item} onClick={() => setPerson(item)} key={item}>{item}</button>)}</div>{person === "Someone else" && <input className="studio-input open-answer" value={otherPerson} onChange={(event) => setOtherPerson(event.target.value)} placeholder="Who are they to you?" autoFocus />}</div>}
      {step === 2 && <div className="finder-question"><p className="eyebrow">Their world</p><h1>What are they into?</h1><p className="finder-help">Choose as many as fit. The interesting combinations usually make the best gifts.</p><div className="choice-grid interests">{interests.map((item) => <button type="button" className={chosenInterests.includes(item) ? "chosen" : ""} aria-pressed={chosenInterests.includes(item)} onClick={() => toggleInterest(item)} key={item}>{item}</button>)}</div>{chosenInterests.includes("Something else") && <input className="studio-input open-answer" value={otherInterest} onChange={(event) => setOtherInterest(event.target.value)} placeholder="Anything goes. What are they into?" autoFocus />}</div>}
      {step === 3 && <div className="finder-question"><p className="eyebrow">The moment</p><h1>What is the occasion?</h1><div className="choice-grid">{occasions.map((item) => <button type="button" className={occasion === item ? "chosen" : ""} aria-pressed={occasion === item} onClick={() => setOccasion(item)} key={item}>{item}</button>)}</div>{occasion === "Something else" && <input className="studio-input open-answer" value={otherOccasion} onChange={(event) => setOtherOccasion(event.target.value)} placeholder="Tell us what is happening" autoFocus />}</div>}
      {step === 4 && <div className="finder-question"><p className="eyebrow">The useful boundary</p><h1>What is the budget?</h1><div className="choice-grid budget-grid">{budgets.map((item) => <button type="button" className={budget === item ? "chosen" : ""} aria-pressed={budget === item} onClick={() => setBudget(item)} key={item}>{item}</button>)}</div><p className="finder-help">This is not a commitment. It helps Sam frame the right scale before you talk.</p></div>}
      {step === 5 && <div className="finder-review"><p className="eyebrow">Review before sending</p><h1>The clues are all here.</h1><div className="review-grid"><article><span>Who</span><b>{resolvedPerson}</b><button onClick={() => setStep(1)}>Edit</button></article><article><span>Interests</span><b>{resolvedInterests.join(" · ")}</b><button onClick={() => setStep(2)}>Edit</button></article><article><span>Occasion</span><b>{resolvedOccasion}</b><button onClick={() => setStep(3)}>Edit</button></article><article><span>Budget</span><b>{budget}</b><button onClick={() => setStep(4)}>Edit</button></article></div><form className="review-contact" onSubmit={submitBrief}><label>Your name<input name="name" autoComplete="name" required /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label><label className="review-notes">Anything else Sam should know?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="A story, deadline, inside joke, object they already own, or what would make this feel perfect…" /></label>{state === "error" && <p className="form-error">That did not go through. Try once more.</p>}<button className="add-bag" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Submit & request an idea meeting →"}</button></form></div>}
      {step < 5 && <div className="finder-controls"><button type="button" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>← Back</button><button type="button" className="button button-primary" disabled={!canContinue} onClick={() => canContinue && setStep(step + 1)}>{step === 4 ? "Review the request" : "Continue"} →</button></div>}
    </div>
  </section>;
}
