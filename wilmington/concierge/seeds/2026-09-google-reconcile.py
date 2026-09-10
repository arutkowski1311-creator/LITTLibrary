#!/usr/bin/env python3
"""Reconcile the Google Places enrichment with the library (2026-09-10).

- Concept entries (drives, events, challenges, orgs) and wrong matches: drop the Google block and any
  address/phone/website/photo it filled in; flag `google-no-match` with what Google offered, for the owner.
- Well-matched entries Google says are CLOSED_PERMANENTLY: status=closed (hidden on the site), flag
  `google-says-closed` — listed for the owner to confirm or overrule.
- CLOSED_TEMPORARILY: keep visible, flag `google-temporarily-closed`, add a line to knowBefore.
- Well-matched OPERATIONAL entries: verification = verified by Google Places (automated), which clears the
  'verify before publishing' mark. Seeded prose stays flagged `prose-unreviewed` for the worksheet.
Idempotent. Needs the pre-enrichment backup only for the first run (restores fields for dropped matches).
"""
import json, re, difflib, pathlib, datetime as dt, sys
HERE = pathlib.Path(__file__).resolve().parents[1]; P = HERE / "places.json"
BACKUP = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
d = json.load(open(P)); back = {p["id"]: p for p in json.load(open(BACKUP))["places"]} if BACKUP and BACKUP.exists() else {}
TODAY = dt.date.today().isoformat()
def norm(s): return re.sub(r"[^a-z0-9 ]", "", (s or "").lower().replace("&", "and"))
STOP = {"the","and","of","at","in","lake","placid","saranac","ny","mountain","trail","restaurant","inn","cafe"}
def score(p, g):
    a, b = norm(p["name"]), norm(g.get("name")); r = difflib.SequenceMatcher(None, a, b).ratio()
    toks = set(a.split()) - STOP; ov = len([t for t in toks if t in b]) / max(1, len(toks)); return r, ov
# Hand-reviewed decisions for the ambiguous ones
KEEP = {"owls-head-in-keene-weekdays-only","lake-placid-center-for-the-arts-gallery-46","saranac-laboratory-museum","keene-farmers-market-at-marcy-field","hannaford-lake-placid-supermarket-pharmacy",
        "the-view-mirror-lake-inn","campfire-hotel-saranac","noris-village-market","skeleton-experience-mt-van-hoevenberg","indian-head-rainbow-falls-amr","mount-marcy-via-van-hoevenberg","taylor-pond-campground","whiteface-snowshoe-heaven-hill"}
CHECK = {"liquids-and-solids":"Google lists 'Sentinel & Station' at this address; Liquids & Solids may have been renamed or replaced",
         "players-sports-bar":"Google lists 'Players Waterfront Eatery' at 2405 Main St; confirm it is the same bar",
         "human-power-planet-earth":"Google finds 'Silver Birch Cycles' at 77 Main St; Human Power Planet Earth may have closed or changed hands",
         "middle-earth-expeditions":"No Google listing under this name; 'High Peaks Mountain Guides' is what came back",
         "jones-outfitters-lake-placid":"No Google listing; the address now returns High Peaks Cyclery. Jones Outfitters may be gone",
         "maui-north-lake-placid":"No Google listing under this name; Lake Placid Ski & Board came back for the address",
         "lakeview-deli":"Google shows 'Lakeview Catering' as permanently closed at this address; confirm whether the deli still trades",
         "nonna-fina":"Google shows \"Nonna Fina's Pizzeria\" as permanently closed; confirm"}
dropped = []; closed = []; temp = []; verified = 0; checks = []
for p in d["places"]:
    g = p.get("google")
    if not g or not g.get("placeId"): continue
    r, ov = score(p, g); good = p["id"] in KEEP or r >= 0.5 or ov >= 0.5
    p["flags"] = [f for f in p.get("flags", []) if not f.startswith("google-")]
    if p["id"] in CHECK:
        p["flags"].append("google-check"); p["googleNote"] = CHECK[p["id"]]; checks.append((p["id"], CHECK[p["id"]]))
        b = back.get(p["id"])
        if b:
            for k in ("address","phone","website","websiteKind","photo"): p[k] = b.get(k)
        p["google"] = {"unmatched": g.get("name"), "address": g.get("address"), "refreshed": TODAY}; continue
    if not good:
        b = back.get(p["id"])
        if b:
            for k in ("address","phone","website","websiteKind","photo"): p[k] = b.get(k)
            if b.get("signals") is not None: p["signals"] = b["signals"]
        p["google"] = {"unmatched": g.get("name"), "address": g.get("address"), "refreshed": TODAY}
        p["flags"].append("google-no-match"); dropped.append((p["id"], g.get("name"))); continue
    st = g.get("businessStatus")
    if st == "CLOSED_PERMANENTLY":
        p["status"] = "closed"; p["flags"].append("google-says-closed"); closed.append((p["id"], g.get("name"))); continue
    if st == "CLOSED_TEMPORARILY":
        p["flags"].append("google-temporarily-closed"); temp.append(p["id"])
        note = "Google listed this as temporarily closed on " + TODAY + "; confirm before going."
        if note not in (p.get("knowBefore") or ""): p["knowBefore"] = ((p.get("knowBefore") or "") + " " + note).strip()
    if st == "OPERATIONAL":
        v = p["verification"]
        if v.get("status") != "verified" or not v.get("lastVerified"):
            v.update({"lastVerified": TODAY, "verifiedBy": "Google Places (automated match)", "method": "Places API: open, address, phone, hours, rating", "nextReview": (dt.date.today() + dt.timedelta(days=30)).isoformat(), "status": "verified"})
            if p.get("source", {}).get("ref") == "[G2]" and "prose-unreviewed" not in p["flags"]: p["flags"].append("prose-unreviewed")
            verified += 1
    # price level -> cost when ours is a placeholder
    PL = {"PRICE_LEVEL_INEXPENSIVE":"$","PRICE_LEVEL_MODERATE":"$$","PRICE_LEVEL_EXPENSIVE":"$$$","PRICE_LEVEL_VERY_EXPENSIVE":"$$$$"}
    if g.get("priceLevel") in PL and (not p.get("cost") or p["cost"] in ("Verify",) or "(verify)" in p["cost"]): p["cost"] = PL[g["priceLevel"]]
json.dump(d, open(P, "w"), indent=1, ensure_ascii=False)
print(f"dropped {len(dropped)} wrong matches; closed {len(closed)}; temporarily closed {len(temp)}; newly verified {verified}; owner checks {len(checks)}")
print("CLOSED (confirm):"); [print("  ", c) for c in closed]
print("CHECK:"); [print("  ", c[0], "—", c[1]) for c in checks]
