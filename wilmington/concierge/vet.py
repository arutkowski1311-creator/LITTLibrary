#!/usr/bin/env python3
"""
Concierge vetting — the monthly cycle that keeps every recommendation current.

  python3 vet.py due                 list entries due or overdue for review (and stale/hidden state)
  python3 vet.py worksheet           write reviews/<YYYY-MM>-worksheet.md with a checklist per due entry
  python3 vet.py apply results.json  record review results and roll nextReview forward
  python3 vet.py report              one-screen health summary (counts by status, freshness)
  python3 vet.py lint                schema sanity: ids unique, required fields, dates parse

results.json is a list of objects:
  {"id": "salt-of-the-earth-bistro",
   "outcome": "unchanged" | "updated" | "closed" | "could-not-verify" | "remove",
   "by": "Adam", "method": "official site + Google", "date": "2026-10-03",
   "changes": {"hours": "...", "season": "...", "phone": "...", "website": "...", "cost": "...",
               "knowBefore": "...", "signals": {"googleRating": 4.7, "reviewCount": "380+", "asOf": "2026-10-03"}},
   "note": "free text kept in the review log"}

Rules the script enforces (see PROCESS.md):
- "unchanged"/"updated" set verification.lastVerified=date, status=verified, nextReview=date+30d.
- "could-not-verify" leaves lastVerified alone, sets status=unverified; the site marks it and hides it
  once hideAfterDays has passed since the last verification.
- "closed" sets status=closed and the place stops rendering immediately (kept for history).
- "remove" sets status=removed (soft delete). Nothing is ever hard-deleted by the script.
- Every apply appends to reviews/log.jsonl. Nothing is invented: a field changes only when results say so.
"""
import json, os, sys, datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "places.json")
REVIEWS = os.path.join(HERE, "reviews")
TODAY = dt.date.today()

def load(): return json.load(open(DATA, encoding="utf-8"))
def save(d):
    d["meta"]["updated"] = TODAY.isoformat()
    json.dump(d, open(DATA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
def pdate(s): return dt.date.fromisoformat(s) if s else None
def freshness(p, cad):
    v = p["verification"]; lv = pdate(v.get("lastVerified"))
    if p["status"] in ("closed", "removed"): return p["status"]
    if p["status"] == "placeholder": return "placeholder"
    if not lv: return "unverified"
    age = (TODAY - lv).days
    if age > cad["hideAfterDays"]: return "hidden"
    if age > cad["staleAfterDays"]: return "stale"
    return "fresh"
def due_list(d):
    cad = d["meta"]["cadence"]; out = []
    for p in d["places"]:
        if p["status"] in ("closed", "removed"): continue
        nr = pdate(p["verification"].get("nextReview"))
        if nr is None or nr <= TODAY: out.append((p, freshness(p, cad), nr))
    return out

def cmd_due(d):
    rows = due_list(d)
    print(f"{len(rows)} of {len(d['places'])} entries due for review as of {TODAY}\n")
    for p, f, nr in sorted(rows, key=lambda r: (r[0]["category"], r[0]["name"])):
        print(f"  {p['category']:18s} {p['name']:42s} {f:11s} next {nr or '—'}")

def checklist(p):
    lines = [
      f"### {p['name']}  ·  {p['category']}  ·  {p['area']}",
      f"- id: `{p['id']}`  ·  status: {p['status']}  ·  last verified: {p['verification'].get('lastVerified') or 'never'} by {p['verification'].get('verifiedBy') or '—'}",
      f"- source of record: {p['source']['name']}" + (f"  ·  {p['source']['url']}" if p['source'].get('url') else ""),
      "- [ ] Still open and operating under this name?",
      f"- [ ] Season / hours still as stated? (`{p.get('season','')}`)",
    ]
    if p.get("phone"): lines.append(f"- [ ] Phone still {p['phone']}?")
    if p.get("website"): lines.append(f"- [ ] Website still live and current? {p['website']}")
    if p.get("signals", {}).get("googleRating") is not None:
        s = p["signals"]; lines.append(f"- [ ] Google rating / volume drift? (was {s['googleRating']} ★, {s['reviewCount']} reviews, {s['asOf']})")
        lines.append("- [ ] Recent review themes: consistency, service, closures, ownership change?")
    if p["category"] == "Dining":
        lines.append("- [ ] Menu items in *What to order* still offered? Price band still right?")
        lines.append("- [ ] Reservation / cash-only / kids-menu / dog notes still accurate?")
    else:
        lines.append("- [ ] Access facts, cost, booking requirement, trail/road status still accurate?")
    lines.append("- [ ] Any event, closure or hazard notice guests must know about in the next 60 days?")
    lines.append("- Outcome: unchanged / updated / closed / could-not-verify / remove  —  Notes:")
    return "\n".join(lines)

def cmd_worksheet(d):
    os.makedirs(REVIEWS, exist_ok=True)
    rows = due_list(d)
    path = os.path.join(REVIEWS, f"{TODAY:%Y-%m}-worksheet.md")
    body = [f"# Concierge vetting worksheet — {TODAY:%B %Y}", "",
            f"Generated {TODAY}. {len(rows)} entries due. Work top to bottom; record outcomes in a results.json and run `vet.py apply`.", "",
            "Source hierarchy: official site or phone call → regional tourism board (ROOST / whitefaceregion.com / saranaclake.com) → Google listing → recent reviews. Never publish a specific hour, price or menu item from memory.", ""]
    cats = {}
    for p, f, nr in rows: cats.setdefault(p["category"], []).append(p)
    for cat in d["meta"]["categories"]:
        if cat not in cats: continue
        body.append(f"## {cat}  ({len(cats[cat])})"); body.append("")
        for p in sorted(cats[cat], key=lambda x: (x.get("rank") or 999, x["name"])):
            body.append(checklist(p)); body.append("")
    open(path, "w", encoding="utf-8").write("\n".join(body))
    print("wrote", path, f"({len(rows)} entries)")

def cmd_apply(d, path):
    results = json.load(open(path, encoding="utf-8"))
    cad = d["meta"]["cadence"]; byid = {p["id"]: p for p in d["places"]}
    os.makedirs(REVIEWS, exist_ok=True)
    log = open(os.path.join(REVIEWS, "log.jsonl"), "a", encoding="utf-8")
    n = 0
    for r in results:
        p = byid.get(r["id"])
        if not p: print("  ! unknown id", r["id"]); continue
        date = r.get("date") or TODAY.isoformat(); out = r["outcome"]
        v = p["verification"]
        if out in ("unchanged", "updated"):
            for k, val in (r.get("changes") or {}).items():
                if k == "signals": p.setdefault("signals", {}).update(val)
                elif k in p: p[k] = val
                else: print(f"  ! {r['id']}: ignoring unknown field {k}")
            v.update({"lastVerified": date, "verifiedBy": r.get("by", "—"), "method": r.get("method", "—"), "status": "verified",
                      "nextReview": (pdate(date) + dt.timedelta(days=cad["reviewEveryDays"])).isoformat()})
            if p["status"] == "placeholder" and out == "updated": p["status"] = "active"
        elif out == "could-not-verify":
            v.update({"status": "unverified", "nextReview": (TODAY + dt.timedelta(days=7)).isoformat()})
        elif out == "closed":
            p["status"] = "closed"; v.update({"status": "closed", "lastVerified": date, "verifiedBy": r.get("by", "—")})
        elif out == "remove":
            p["status"] = "removed"; v.update({"status": "removed"})
        else:
            print("  ! unknown outcome", out, "for", r["id"]); continue
        log.write(json.dumps({"date": date, "id": r["id"], "outcome": out, "by": r.get("by"), "method": r.get("method"), "changes": r.get("changes"), "note": r.get("note")}, ensure_ascii=False) + "\n")
        n += 1
    save(d); print(f"applied {n} results; places.json updated {TODAY}")

def cmd_report(d):
    cad = d["meta"]["cadence"]; counts = {}
    for p in d["places"]: f = freshness(p, cad); counts[f] = counts.get(f, 0) + 1
    print(f"Concierge health — {TODAY}  ({len(d['places'])} entries, cadence {cad['reviewEveryDays']}d, stale >{cad['staleAfterDays']}d, hidden >{cad['hideAfterDays']}d)")
    for k in ("fresh", "stale", "hidden", "unverified", "placeholder", "closed", "removed"):
        if counts.get(k): print(f"  {k:12s} {counts[k]}")
    due = due_list(d); print(f"  due now     {len(due)}")

def cmd_lint(d):
    ids = [p["id"] for p in d["places"]]; ok = True
    if len(ids) != len(set(ids)): print("! duplicate ids:", {i for i in ids if ids.count(i) > 1}); ok = False
    for p in d["places"]:
        for k in ("id", "name", "category", "area", "review", "season", "cost", "suits", "source", "verification", "status"):
            if k not in p: print(f"! {p.get('id')}: missing {k}"); ok = False
        if p["category"] not in d["meta"]["categories"]: print(f"! {p['id']}: unknown category {p['category']}"); ok = False
        for k in ("lastVerified", "nextReview"):
            try: pdate(p["verification"].get(k))
            except ValueError: print(f"! {p['id']}: bad date in {k}"); ok = False
    print("lint ok" if ok else "lint FAILED"); return ok

if __name__ == "__main__":
    d = load(); cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    {"due": lambda: cmd_due(d), "worksheet": lambda: cmd_worksheet(d), "apply": lambda: cmd_apply(d, sys.argv[2]),
     "report": lambda: cmd_report(d), "lint": lambda: sys.exit(0 if cmd_lint(d) else 1)}.get(cmd, lambda: print(__doc__))()
