#!/usr/bin/env python3
"""Merge research-agent findings into database.json (dedup, update-in-place, run log).

Usage:
  python3 scripts/merge_findings.py --date 2026-09-25 --mode surveillance \
      --window "2026-06-29 to 2026-09-25" --note "..." \
      [--hooks-out path.json] scan-a.json scan-b.json ...

Each scan file is a JSON array of items in the library schema. Items whose dedupKey (or id)
already exists are skipped, unless the scan marks them status "updated", in which case the
stored record is updated in place with the scan's changeNote. Content-only fields
(contentAngle, discussionQuestion) are kept out of the database and written to --hooks-out.
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_FIELDS = ("contentAngle", "discussionQuestion")
REQUIRED = ("id", "dedupKey", "domain", "title", "citation", "url", "date", "clinicalImpactScore",
            "littBusinessImpact", "littBusinessDirection", "indications", "verified")


def norm_key(k):
    k = (k or "").strip().lower()
    k = re.sub(r"^https?://(dx\.)?doi\.org/", "", k)
    return re.sub(r"[?#].*$", "", k) if k.startswith("http") else k


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True)
    ap.add_argument("--mode", default="surveillance")
    ap.add_argument("--window", required=True)
    ap.add_argument("--note", default="")
    ap.add_argument("--hooks-out")
    ap.add_argument("scans", nargs="+")
    a = ap.parse_args()

    db_path = ROOT / "database.json"
    db = json.loads(db_path.read_text(encoding="utf-8"))
    tax = db["taxonomy"]
    items = db["items"]

    # new/updated flags describe the latest run only
    for it in items:
        if it.get("status") in ("new", "updated"):
            it["status"] = "carried"

    by_key = {}
    for it in items:
        by_key[norm_key(it.get("dedupKey"))] = it
        by_key[norm_key(it.get("doi"))] = it
        by_key[it["id"]] = it
    by_key.pop("", None)

    found = added = updated = skipped = 0
    hooks = {}
    for scan in a.scans:
        for f in json.loads(Path(scan).read_text(encoding="utf-8")):
            found += 1
            content = {k: f.pop(k) for k in CONTENT_FIELDS if k in f}
            missing = [k for k in REQUIRED if f.get(k) in (None, "", [])]
            if missing:
                raise SystemExit(f"{scan}: {f.get('id')} missing {missing}")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", f["date"]):
                raise SystemExit(f"{f['id']}: date must be YYYY-MM-DD, got {f['date']!r}")
            bad = [x for x in f["indications"] if x not in tax["indications"]]
            bad += [x for x in f.get("strategies", []) if x not in tax["strategies"]]
            if bad:
                raise SystemExit(f"{f['id']}: unknown taxonomy keys {bad}")

            existing = next((by_key[k] for k in (norm_key(f["dedupKey"]), norm_key(f.get("doi")), f["id"])
                             if k and k in by_key), None)
            if existing is not None:
                if f.get("status") == "updated" and existing.get("lastUpdatedRun") != a.date:
                    first_seen = existing.get("firstSeenRun")
                    existing.update(f)
                    existing.update(status="updated", firstSeenRun=first_seen, lastUpdatedRun=a.date)
                    updated += 1
                    hooks[existing["id"]] = content
                else:
                    skipped += 1
                continue

            f.update(status="new", firstSeenRun=a.date, lastUpdatedRun=a.date)
            f.setdefault("changeNote", "")
            items.append(f)
            for k in (norm_key(f["dedupKey"]), norm_key(f.get("doi")), f["id"]):
                if k:
                    by_key[k] = f
            added += 1
            hooks[f["id"]] = content

    run = {"date": a.date, "mode": a.mode, "window": a.window, "found": found,
           "added": added, "updated": updated, "skipped": skipped}
    if a.note:
        run["note"] = a.note
    db["runs"].append(run)
    db["lastUpdated"] = a.date
    db_path.write_text(json.dumps(db, indent=2, ensure_ascii=False), encoding="utf-8")

    if a.hooks_out:
        Path(a.hooks_out).write_text(json.dumps(hooks, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(run))
    print(f"database.json: {len(items)} items")


if __name__ == "__main__":
    main()
