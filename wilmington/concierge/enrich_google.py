#!/usr/bin/env python3
"""Google Places enrichment for the concierge library.

Runs once the owner supplies a Google Maps Platform key (Places API (New) enabled).
For every entry with an address or a name+area it:
  1. resolves the place (places:searchText)              → placeId, lat/lng
  2. pulls details (places/{id})                          → rating, userRatingCount, websiteUri,
                                                            nationalPhoneNumber, regularOpeningHours,
                                                            editorialSummary, reviewSummary and
                                                            generativeSummary (Google's own AI digest of
                                                            recent reviews, where available in the US),
                                                            photos[] (names + author attributions)
  3. stores everything under `google` on the entry, never overwriting owner-written prose;
     `signals.googleRating` / `signals.reviewCount` are refreshed with the date;
     the first photo becomes `photo` = {"provider":"google","name":..., "attribution":...}
     which the production site renders through the Places Photo endpoint (allowed for display
     with attribution under the Maps Platform terms). The preview artifact cannot embed
     these (image bytes are not downloadable from this build environment), so it keeps the
     placeholder until a licensed still is dropped into site/photos/.

Usage:
  GOOGLE_MAPS_KEY=... python3 enrich_google.py [--only category] [--limit N] [--dry-run]
  or, in a Claude Code cloud environment with an API credential for places.googleapis.com
  (header X-Goog-Api-Key, no prefix), simply:  python3 enrich_google.py ...

Cost note: Text Search + Place Details (Pro/Enterprise field masks) bill per call; ~280 entries
is roughly two calls each, well inside the monthly free credit. Re-runs skip entries refreshed
within 30 days unless --force.

Untested against the live API from this environment (the key is not available here and
places.googleapis.com answers 403 without one). Field names follow the Places API (New) docs.
"""
import json, os, sys, time, urllib.request, urllib.error, datetime as dt, pathlib

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE / "places.json"
KEY = os.environ.get("GOOGLE_MAPS_KEY", "")
FIELDS = ",".join(["id","displayName","formattedAddress","location","rating","userRatingCount","websiteUri","nationalPhoneNumber",
                   "regularOpeningHours.weekdayDescriptions","editorialSummary","reviewSummary","generativeSummary","photos","businessStatus","priceLevel"])
TODAY = dt.date.today().isoformat()

def call(url, body=None, mask=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, method="POST" if body else "GET")
    req.add_header("Content-Type", "application/json")
    if KEY: req.add_header("X-Goog-Api-Key", KEY)   # otherwise the environment's API credential (agent proxy) attaches it
    if mask: req.add_header("X-Goog-FieldMask", mask)
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

def resolve(p):
    q = p["name"] + ", " + (p.get("address") or f'{p.get("area","")}, NY')
    res = call("https://places.googleapis.com/v1/places:searchText", {"textQuery": q, "locationBias": {"circle": {"center": {"latitude": 44.39, "longitude": -73.83}, "radius": 50000}}, "maxResultCount": 1}, "places.id,places.displayName,places.formattedAddress")
    return (res.get("places") or [None])[0]

def details(pid): return call(f"https://places.googleapis.com/v1/places/{pid}", mask=FIELDS)

def main():
    args = sys.argv[1:]; dry = "--dry-run" in args; force = "--force" in args
    only = args[args.index("--only") + 1] if "--only" in args else None
    limit = int(args[args.index("--limit") + 1]) if "--limit" in args else 10**9
    if not KEY and not dry: print("no GOOGLE_MAPS_KEY in the environment; relying on an API credential attached by the proxy for places.googleapis.com")
    d = json.load(open(DATA)); done = 0; log = []
    for p in d["places"]:
        if p["category"] in ("Emergency",) or p["status"] in ("removed", "placeholder"): continue
        if only and p["category"] != only: continue
        g = p.get("google") or {}
        if not force and g.get("refreshed") and (dt.date.today() - dt.date.fromisoformat(g["refreshed"])).days < 30: continue
        if done >= limit: break
        if dry: print("would enrich", p["id"]); done += 1; continue
        try:
            hit = resolve(p)
            if not hit: log.append({"id": p["id"], "result": "no-match"}); done += 1; continue
            det = details(hit["id"])
        except urllib.error.HTTPError as e:
            log.append({"id": p["id"], "result": f"http {e.code}", "body": e.read()[:300].decode(errors="ignore")}); done += 1
            if sum(1 for e in log if e["result"].startswith("http")) >= 5: print("stopping after 5 HTTP errors; see the log"); break
            continue
        p["google"] = {"placeId": det.get("id"), "name": (det.get("displayName") or {}).get("text"), "address": det.get("formattedAddress"),
                       "location": det.get("location"), "rating": det.get("rating"), "userRatingCount": det.get("userRatingCount"),
                       "website": det.get("websiteUri"), "phone": det.get("nationalPhoneNumber"), "priceLevel": det.get("priceLevel"),
                       "hours": (det.get("regularOpeningHours") or {}).get("weekdayDescriptions"), "businessStatus": det.get("businessStatus"),
                       "editorialSummary": (det.get("editorialSummary") or {}).get("text"),
                       "reviewSummary": ((det.get("reviewSummary") or {}).get("text") or {}).get("text"),
                       "generativeSummary": ((det.get("generativeSummary") or {}).get("overview") or {}).get("text"),
                       "reviewSummaryFlagUri": (det.get("reviewSummary") or {}).get("flagContentUri"),
                       "generativeSummaryFlagUri": (det.get("generativeSummary") or {}).get("overviewFlagContentUri"),
                       "summaryDisclosure": (((det.get("generativeSummary") or {}).get("disclosureText") or {}).get("text")) or (((det.get("reviewSummary") or {}).get("disclosureText") or {}).get("text")),
                       "photos": [{"name": ph.get("name"), "width": ph.get("widthPx"), "height": ph.get("heightPx"),
                                   "attribution": ", ".join(a.get("displayName", "") for a in ph.get("authorAttributions", []))} for ph in (det.get("photos") or [])[:5]],
                       "refreshed": TODAY}
        if det.get("rating") is not None:
            p.setdefault("signals", {}).update({"googleRating": det["rating"], "reviewCount": str(det.get("userRatingCount", "")), "asOf": TODAY})
        if det.get("businessStatus") == "CLOSED_PERMANENTLY": p["flags"] = sorted(set(p.get("flags", []) + ["google-says-closed"]))
        if not p.get("photo") and p["google"]["photos"]:
            ph = p["google"]["photos"][0]; p["photo"] = {"provider": "google", "name": ph["name"], "attribution": ph["attribution"]}
        if not p.get("website") and det.get("websiteUri"): p["website"] = det["websiteUri"]; p["websiteKind"] = "official"
        if not p.get("phone") and det.get("nationalPhoneNumber"): p["phone"] = det["nationalPhoneNumber"]
        if not p.get("address") and det.get("formattedAddress"): p["address"] = det["formattedAddress"]
        log.append({"id": p["id"], "result": "ok", "rating": det.get("rating"), "photos": len(p["google"]["photos"])}); done += 1; time.sleep(0.2)
    if not dry:
        d["meta"]["updated"] = TODAY; json.dump(d, open(DATA, "w"), indent=1, ensure_ascii=False)
        with open(HERE / "reviews" / "google-enrich.log.jsonl", "a") as f:
            for e in log: f.write(json.dumps({"date": TODAY, **e}) + "\n")
    print(f"{done} enriched; {sum(1 for e in log if e['result'] != 'ok')} problems")

if __name__ == "__main__": main()
