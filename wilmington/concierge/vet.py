#!/usr/bin/env python3
"""
Concierge vetting — the monthly cycle that keeps every recommendation current.

  python3 vet.py due                 list entries due or overdue for review (and stale/hidden state)
  python3 vet.py worksheet           write reviews/<YYYY-MM>-worksheet.md with a checklist per due entry
  python3 vet.py apply results.json  record review results and roll nextReview forward
  python3 vet.py report              one-screen health summary (counts by status, freshness)
  python3 vet.py lint                schema sanity: ids unique, required fields, dates parse
  python3 vet.py commentary-sheet    write reviews/commentary-worksheet.md: every entry teed up for the owner's colour commentary
  python3 vet.py commentary FILE.md  read a filled-in worksheet and store each note in that entry's `commentary` field

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

CATEGORY_ORDER = ["Dining", "Bars & nightlife", "Breweries, cider & spirits", "Hiking", "Biking", "Skiing", "Water & boating", "Fishing",
                  "Olympic sites", "Sightseeing & foliage", "Family fun", "Rainy day", "Arts & culture", "Events & festivals", "Shops & outfitters",
                  "Antiques & vintage", "Farms & local life", "Golf", "Guides & outfitters", "Essentials", "Emergency"]

def cmd_commentary_sheet(d):
    """One block per entry. The owner writes under 'Commentary:'; everything else is context and is ignored on apply."""
    os.makedirs(REVIEWS, exist_ok=True); path = os.path.join(REVIEWS, "commentary-worksheet.md")
    order = {c: i for i, c in enumerate(CATEGORY_ORDER)}
    places = [p for p in d["places"] if p["status"] not in ("removed",)]
    places.sort(key=lambda p: (order.get(p["category"], 99), p.get("area") or "", p["name"].lower()))
    out = ["# Concierge library — colour commentary worksheet", "",
           f"Generated {TODAY.isoformat()} · {len(places)} entries · {sum(1 for p in places if p.get('commentary'))} already have commentary.", "",
           "How to use: write your note on the line(s) after **Commentary:** in any block. One to three sentences in your own voice is perfect",
           "(what you order, when to go, who it suits, what to skip). Leave a block blank to skip it. Type `REMOVE` to drop an entry,",
           "`RENAME: New name` to fix a name, or `FIX: ...` for any fact that is wrong. Then run:", "",
           "    python3 vet.py commentary reviews/commentary-worksheet.md", "",
           "Entries marked ⚠ unverified have never been checked; your note is also a signal that the place is real and worth vetting first.", ""]
    cat = None; area = None
    for p in places:
        if p["category"] != cat:
            cat = p["category"]; area = None; out += ["", f"## {cat}", ""]
        if (p.get("area") or "") != area:
            area = p.get("area") or ""; out += [f"### {area or 'Region-wide'}", ""]
        flag = "" if p["verification"].get("lastVerified") else " ⚠ unverified"
        extra = " · ".join(x for x in [p.get("subcategory") if p.get("subcategory") != p["category"] else "", p.get("drive", ""), p.get("cost", "")] if x and x != "Verify")
        out += [f"**{p['name']}**  `{p['id']}`{flag}", f"_{extra}_" if extra else "", (p.get("review") or "")[:220], "",
                "Commentary:", p.get("commentary") or "", "", "---", ""]
    open(path, "w", encoding="utf-8").write("\n".join(out)); print("wrote", os.path.relpath(path, HERE), f"({len(places)} entries)")

def cmd_commentary(d, path):
    import re
    text = open(path, encoding="utf-8").read()
    blocks = re.split(r"\n---\n", text)
    by_id = {p["id"]: p for p in d["places"]}; n = 0; log = []
    for b in blocks:
        m = re.search(r"`([a-z0-9][a-z0-9\-]*)`", b)
        if not m or m.group(1) not in by_id: continue
        cm = re.search(r"Commentary:\s*\n(.*)$", b, re.S)
        if not cm: continue
        note = cm.group(1).strip()
        p = by_id[m.group(1)]
        if not note or note == (p.get("commentary") or ""): continue
        if note.upper().startswith("REMOVE"):
            p["status"] = "removed"; log.append({"id": p["id"], "action": "removed", "date": TODAY.isoformat(), "by": "owner worksheet"}); n += 1; continue
        rn = re.match(r"RENAME:\s*(.+)", note)
        if rn:
            log.append({"id": p["id"], "action": "renamed", "from": p["name"], "to": rn.group(1).strip(), "date": TODAY.isoformat()}); p["name"] = rn.group(1).strip(); n += 1; continue
        if note.upper().startswith("FIX:"):
            p.setdefault("flags", []); p["flags"] = sorted(set(p["flags"] + ["owner-fix-pending"])); p["ownerFix"] = note[4:].strip()
            log.append({"id": p["id"], "action": "fix-requested", "note": note[4:].strip(), "date": TODAY.isoformat()}); n += 1; continue
        p["commentary"] = note; p.setdefault("flags", [])
        if "owner-recommended" not in p["flags"]: p["flags"].append("owner-recommended")
        log.append({"id": p["id"], "action": "commentary", "date": TODAY.isoformat(), "by": "owner worksheet"}); n += 1
    if n:
        save(d)
        with open(os.path.join(REVIEWS, "log.jsonl"), "a", encoding="utf-8") as f:
            for e in log: f.write(json.dumps(e, ensure_ascii=False) + "\n")
    print(f"applied {n} change(s)")

if __name__ == "__main__":
    d = load(); cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    {"due": lambda: cmd_due(d), "worksheet": lambda: cmd_worksheet(d), "apply": lambda: cmd_apply(d, sys.argv[2]),
     "report": lambda: cmd_report(d), "lint": lambda: sys.exit(0 if cmd_lint(d) else 1),
     "commentary-sheet": lambda: cmd_commentary_sheet(d), "commentary": lambda: cmd_commentary(d, sys.argv[2])}.get(cmd, lambda: print(__doc__))()
