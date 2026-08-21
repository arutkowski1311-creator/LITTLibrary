"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { projectStages as stages } from "../lib/ops-data";
import type { StudioProject } from "../lib/ops-data";

const legacyStages: Record<string, string> = { Inquiry: "Ordered", Proof: "Design", Queued: "Confirm materials", Build: "Fabricate", Finish: "Package", Delivery: "Ship" };
const priorityRank: Record<string, number> = { Rush: 0, Expedited: 1, Standard: 2 };

function normalizedStage(project: StudioProject) {
  if (stages.includes(project.status)) return project.status;
  return legacyStages[project.status] ?? legacyStages[project.stage] ?? "Ordered";
}

function businessDaysRemaining(due: string, now: Date) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(`${due}T17:00:00`);
  if (end.getTime() < now.getTime()) return -1;
  let days = 0;
  while (cursor <= end) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(0, days);
}

function urgencyFor(project: StudioProject, now: Date) {
  const workdays = businessDaysRemaining(project.due, now);
  const capacity = Math.max(1, workdays * 6);
  if (workdays < 0 || project.remaining > capacity || workdays <= 1) return "red";
  if (workdays <= 3 || project.remaining > capacity * .68 || project.blocker) return "yellow";
  return "green";
}

function shortDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function Shopboard({ projects: initialProjects }: { projects: StudioProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [now, setNow] = useState(new Date());
  const [offset, setOffset] = useState(0);
  const [manage, setManage] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);

  const queue = useMemo(() => [...projects]
    .filter((item) => !item.boardHidden && normalizedStage(item) !== "Complete")
    .sort((a, b) => (priorityRank[a.priority ?? "Standard"] - priorityRank[b.priority ?? "Standard"]) || new Date(a.due).getTime() - new Date(b.due).getTime()), [projects]);
  const hidden = projects.filter((item) => item.boardHidden);
  const safeOffset = queue.length ? offset % queue.length : 0;
  const slots = Array.from({ length: 6 }, (_, index) => queue.length >= 6 ? queue[(safeOffset + index) % queue.length] : queue[index] ?? null);
  const alerts = queue.filter((project) => urgencyFor(project, now) === "red").length;
  const totalHours = queue.reduce((sum, project) => sum + project.remaining, 0);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (manage || queue.length <= 6) return;
    const rotation = setInterval(() => setOffset((current) => (current + 1) % queue.length), 7500);
    return () => clearInterval(rotation);
  }, [manage, queue.length]);

  async function patchProject(project: StudioProject, updates: Partial<StudioProject>) {
    setSyncing(project.id);
    const response = await fetch("/api/projects", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: project.id, ...updates }) });
    if (response.ok) setProjects((items) => items.map((item) => item.id === project.id ? { ...item, ...updates } : item));
    setSyncing(null);
  }

  function changeStage(project: StudioProject, stage: string) {
    const index = stages.indexOf(stage);
    const next = stages[Math.min(stages.length - 1, index + 1)];
    patchProject(project, { status: stage, stage, progress: Math.round(index / (stages.length - 1) * 100), next: stage === "Complete" ? "Archived" : `Advance to ${next}` });
  }

  async function deleteProject(project: StudioProject) {
    if (!window.confirm(`Permanently delete ${project.code} · ${project.name}?`)) return;
    setSyncing(project.id);
    const response = await fetch(`/api/projects?id=${project.id}`, { method: "DELETE" });
    if (response.ok) setProjects((items) => items.filter((item) => item.id !== project.id));
    setSyncing(null);
  }

  return <main className="shopboard-shell cockpit-board">
    <header className="shopboard-header cockpit-header">
      <Link href="/ops" className="cockpit-brand"><img src="/assets/red-bucket-brand.png" alt="" /><span><b>RED BUCKET</b><small>SHOP CONTROL · SAM&apos;S LIVE BOARD</small></span></Link>
      <div className="cockpit-instruments" aria-label="Shop status instruments">
        <div className="mini-gauge"><strong>{queue.length}</strong><span>ACTIVE</span></div>
        <div className={`mini-gauge ${alerts ? "alarm" : "nominal"}`}><strong>{alerts}</strong><span>ALERTS</span></div>
        <div className="mini-gauge"><strong>{Math.round(totalHours)}</strong><span>SHOP HRS</span></div>
      </div>
      <div className="cockpit-clock"><b>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</b><span>{now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</span><button onClick={() => setManage((value) => !value)}>{manage ? "EXIT MANAGE" : "MANAGE BOARD"}</button></div>
    </header>

    {manage && <section className="board-manager"><div><b>BOARD MANAGEMENT</b><span>Auto-scroll paused. Change a stage, hide a row or permanently delete it.</span></div>{hidden.length > 0 && <div className="hidden-projects"><small>HIDDEN</small>{hidden.map((project) => <button onClick={() => patchProject(project, { boardHidden: false })} key={project.id}>RESTORE {project.code}</button>)}</div>}</section>}

    <section className={`cockpit-table ${manage ? "manage-mode" : ""}`}>
      <div className="cockpit-row cockpit-table-head">
        <span>PROJECT / STATUS</span><span>ORDER NUMBER</span><span>CUSTOMER</span><span>DATE ORDERED</span><span>DELIVERY BY</span><span>TIME REMAINING</span>{manage && <span>ACTIONS</span>}
      </div>
      <div className="cockpit-table-body" key={`${safeOffset}-${manage}`}>
        {slots.map((project, index) => project ? <ProjectRow project={project} now={now} manage={manage} syncing={syncing === project.id} onStage={changeStage} onHide={(item) => patchProject(item, { boardHidden: true })} onDelete={deleteProject} key={`${project.id}-${index}`} /> : <div className="cockpit-row empty-bay" key={`empty-${index}`}><span>OPEN BENCH SLOT</span><span>—</span><span>—</span><span>—</span><span>—</span><span>AVAILABLE</span>{manage && <span>—</span>}</div>)}
      </div>
    </section>

    <footer className="shopboard-footer cockpit-footer"><span><i className="signal green" /> ON SCHEDULE</span><span><i className="signal yellow" /> WATCH CAPACITY</span><span><i className="signal red" /> ACTION REQUIRED</span><b>{queue.length > 6 && !manage ? `AUTO-SCROLL ACTIVE · NEXT ROW IN 7.5 SEC` : "DISPLAYING 6 SHOP POSITIONS"}</b></footer>
  </main>;
}

function ProjectRow({ project, now, manage, syncing, onStage, onHide, onDelete }: { project: StudioProject; now: Date; manage: boolean; syncing: boolean; onStage: (project: StudioProject, stage: string) => void; onHide: (project: StudioProject) => void; onDelete: (project: StudioProject) => void }) {
  const urgency = urgencyFor(project, now);
  const workdays = businessDaysRemaining(project.due, now);
  const stage = normalizedStage(project);
  const stageIndex = Math.max(0, stages.indexOf(stage));
  const load = Math.min(1, project.remaining / Math.max(1, workdays * 6));
  const gaugeStyle = { "--gauge-fill": `${Math.max(18, load * 310)}deg` } as React.CSSProperties;
  return <div className={`cockpit-row project-flight-row urgency-${urgency}`}>
    <div className="flight-project"><div><i className={`signal ${urgency}`} /><strong>{project.name}</strong></div><span>{stage}</span><div className="stage-dots" aria-label={`${stage} stage`}>{stages.slice(0, 6).map((item, index) => <i className={index <= stageIndex ? "complete" : ""} title={item} key={item} />)}</div></div>
    <div className="flight-code"><span>{project.priority === "Rush" ? "RUSH" : project.priority === "Expedited" ? "PRIORITY" : "STANDARD"}</span><b>{project.code}</b></div>
    <div className="flight-customer"><b>{project.customer}</b><span>{project.kind ?? "Custom build"}</span></div>
    <time dateTime={project.createdAt}>{shortDate(project.createdAt)}</time>
    <time className="delivery-date" dateTime={project.due}><b>{shortDate(project.due)}</b><span>{workdays < 0 ? "PAST DUE" : workdays === 0 ? "DUE TODAY" : `${workdays} WORKDAY${workdays === 1 ? "" : "S"}`}</span></time>
    <div className="time-gauge-cell"><div className={`steam-gauge ${urgency}`} style={gaugeStyle}><div><strong>{project.remaining}</strong><small>HRS</small></div></div><span>{urgency === "red" ? "TIGHT" : urgency === "yellow" ? "WATCH" : "CLEAR"}</span></div>
    {manage && <div className="board-actions"><select value={stage} disabled={syncing} onChange={(event) => onStage(project, event.target.value)}>{stages.map((item) => <option key={item}>{item}</option>)}</select><button disabled={syncing} onClick={() => onHide(project)}>HIDE</button><button className="delete" disabled={syncing} onClick={() => onDelete(project)}>DELETE</button></div>}
  </div>;
}
