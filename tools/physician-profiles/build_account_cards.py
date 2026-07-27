# -*- coding: utf-8 -*-
"""
Build account-cards.json — the data layer for the Account Report Card tool.

Joins three sources into one per-account record:
  1. account_intel.ACCOUNTS  — curated territory-plan intelligence (class, posture,
     platform, surgeons, referrers, reservoirs, targets, business potential).
  2. physician-profiles.json — the 2,807-provider universe (cohorts, SEEG, craniotomy
     volumes, KOL research + publications, indication wheelhouse).
  3. sales_2024/2025/2026.xlsx — raw NeuroBlate invoices (net sales, probe/item qty,
     dates) → case history, probes/case, revenue/case, trajectory, projection.

Everything derivable is derived here; qualitative sections (SWOT, strategy, header
field confirmations) ship as editable seeds the rep completes in the tool.
"""
import json, os, importlib.util, re
from collections import defaultdict
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))

# ---- load curated account intel ------------------------------------------------
spec = importlib.util.spec_from_file_location("ai", os.path.join(HERE, "account_intel.py"))
AI = importlib.util.module_from_spec(spec); spec.loader.exec_module(AI)

# ---- load provider universe ----------------------------------------------------
PROF = json.load(open(os.path.join(ROOT, "physician-profiles.json")))
PROVIDERS = PROF["providers"]

TERR = AI.TERRITORY
REGION_AVG_CASE = TERR["avg_rev_per_case"]  # 18,300

# ---- raw sales aggregation -----------------------------------------------------
# Map raw hospital strings -> account acronym.
HOSP2ACR = {
    "Yale New Haven Hospital": "YALE",
    "Brigham & Women's Hospital": "BWH",
    "Westchester Medical Center": "WMC",
    "Columbia University Medical Center": "CUMC",
    "NYU Hospitals Center": "NYU",
    "Stony Brook University Hospital": "SUH",
    "Memorial Sloan Kettering Cancer Center": "MSK",
    "Temple University Hospital": "TUH",
    "HACKENSACK MERIDIAN HEALTH": "HJFK",
    "New York Presbyterian Hospital - Cornell": "CORN",
    "Beth Israel Deaconess Med Ctr": "BID",
    "ROCHESTER REGIONAL HEALTH": "ROC",
    "SUNY Upstate Medical University": "SUNY",
    "Mount Sinai Hospital": "MSSM",
    "Mt. Sinai School of Medicine": "MSSM",
}

def sku_class(item, desc):
    """Classify a line item into capital / laser_probe / driver / bolt / accessory / fee."""
    item = str(item or "").upper(); d = str(desc or "").lower()
    if item.startswith("ALACART") or "neuroblate system" in d:
        return "capital"
    if item == "PROCEDUREFEE" or "procedure support fee" in d:
        return "fee"
    # laser probe = the ablation catheter (one per trajectory)
    if (item.startswith(("FFD-", "NBP-", "20891", "20893", "20895", "22002"))
            or (("laser probe" in d) or ("probe packaged" in d) or ("probe, packaged" in d))):
        if "driver" in d or "mandrel" in d or "insertion" in d:
            return "driver" if "driver" in d else "accessory"
        return "laser_probe"
    if "driver" in d:
        return "driver"
    if "bolt" in d:
        return "bolt"
    return "accessory"

sales = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))   # acr -> year -> metric -> val
sku_mix = defaultdict(lambda: defaultdict(float))                       # acr -> class -> net
for yr, fn in (("2024", "sales_2024.xlsx"), ("2025", "sales_2025.xlsx"), ("2026", "sales_2026.xlsx")):
    wb = openpyxl.load_workbook(os.path.join(HERE, fn), data_only=True)
    ws = wb["Export"]
    for r in list(ws.iter_rows(values_only=True))[1:]:
        terr, hosp, net, itemno, desc, sop, soptype, date, qty, acr, po = r
        a = HOSP2ACR.get(hosp)
        if not a:
            continue
        net = float(net or 0); qty = float(qty or 0)
        cls = sku_class(itemno, desc)
        sales[a][yr]["net"] += net
        sku_mix[a][cls] += net
        if cls == "laser_probe":
            sales[a][yr]["probes"] += qty

# ---- provider universe grouped by account -------------------------------------
KOL_NAMES = set()          # names with a genuine LITT research profile (grade A/B)
PROV_BY_NAME = {}          # name -> provider (first match)
by_acct = defaultdict(list)

def has_papers(res):
    return bool(isinstance(res, dict) and (res.get("key_papers") or res.get("recent_papers")))

for p in PROVIDERS:
    a = p.get("accountAcr")
    if a:
        by_acct[a].append(p)
    PROV_BY_NAME.setdefault(p["name"], p)
    res = p.get("research") or {}
    grade = ((res.get("litt_relevance") or {}).get("grade") or "").upper()
    if isinstance(res, dict) and res.get("matched") and has_papers(res) and grade in ("A", "B"):
        KOL_NAMES.add(p["name"])

def classify_universe(acr, acct):
    """Return performers, kols, naive_targets, referrers for an account card."""
    prov = by_acct.get(acr, [])
    pmap = {p["name"]: p for p in prov}
    # performers come from the curated surgeon list (field-confirmed case counts)
    performers = []
    for name, cases in acct.get("surgeons", []):
        p = pmap.get(name) or _find(name)
        performers.append({
            "name": name, "cases": cases,
            "kol": name in KOL_NAMES,
            "npi": (p or {}).get("npi"),
            "specialty": (p or {}).get("specialty", ""),
            "seeg": (p or {}).get("seeg", 0),
            "wheelhouse": ((p or {}).get("wheelhouse") or {}).get("archetype", ""),
        })
    # naive targets = curated user_targets not already performing
    perf_names = {s[0] for s in acct.get("surgeons", [])}
    naive = []
    for name in acct.get("user_targets", []):
        if name in perf_names:
            continue
        p = pmap.get(name) or _find(name)
        naive.append({
            "name": name, "npi": (p or {}).get("npi"),
            "cohort": (p or {}).get("cohort", ""),
            "epi_cranio": (p or {}).get("epi_cranio", 0),
            "tumor_cranio": (p or {}).get("tumor_cranio", 0),
            "seeg": (p or {}).get("seeg", 0),
            "wheelhouse": ((p or {}).get("wheelhouse") or {}).get("archetype", ""),
            "kol": name in KOL_NAMES,
        })
    # referrers = curated referrers + epilepsy/necrosis referrers with indication pools
    referrers = []
    for name, ind, n in acct.get("referrers", []):
        referrers.append({"name": name, "indication": ind, "cases": n, "pool": None})
    for name, pool in acct.get("epilepsy_referrers", []):
        referrers.append({"name": name, "indication": "Epilepsy (DRE)", "cases": None, "pool": pool})
    for name, pool in acct.get("necrosis_referrers", []):
        referrers.append({"name": name, "indication": "Mets / Rad-necrosis", "cases": None, "pool": pool})
    kols = sorted({s["name"] for s in performers if s["kol"]} |
                  {n["name"] for n in naive if n["kol"]})
    return performers, kols, naive, referrers

def _find(name):
    return PROV_BY_NAME.get(name)

def pubmed(title):
    from urllib.parse import quote_plus
    return "https://pubmed.ncbi.nlm.nih.gov/?term=" + quote_plus(title) if title else None

# ---- research appendix (KOLs on the account) ----------------------------------
def build_appendix(acr, acct):
    names = {s[0] for s in acct.get("surgeons", [])} | set(acct.get("user_targets", []))
    entries = []
    for name in sorted(names):
        p = PROV_BY_NAME.get(name)
        if not p:
            continue
        res = p.get("research") or {}
        if not has_papers(res):
            continue
        wh = p.get("wheelhouse") or {}
        rel = res.get("litt_relevance") or {}
        papers = []
        for pp in (res.get("key_papers") or []):
            papers.append({"title": pp.get("title"), "year": pp.get("year"),
                           "area": pp.get("topic") or wh.get("archetype", ""),
                           "journal": pp.get("journal", ""), "kind": "Key",
                           "url": pubmed(pp.get("title"))})
        for pp in (res.get("recent_papers") or []):
            papers.append({"title": pp.get("title"), "year": pp.get("year"),
                           "area": pp.get("topic") or wh.get("archetype", ""),
                           "journal": pp.get("journal", ""), "kind": "Recent",
                           "url": pubmed(pp.get("title"))})
        entries.append({
            "physician": name, "npi": p.get("npi"),
            "grade": rel.get("grade"), "score": rel.get("score"),
            "identity": res.get("identity", ""),
            "facility": (p.get("affiliations") or p.get("system") or "").split(",")[0].strip(),
            "archetype": wh.get("archetype", ""),
            "themes": res.get("themes", [])[:4],
            "rationale": rel.get("rationale", ""),
            "medscout": p.get("medscout"),
            "scholar_url": res.get("scholar_url"), "profile_url": res.get("profile_url"),
            "papers": papers,
        })
    return entries

# ---- derived business metrics --------------------------------------------------
def business(acr, acct):
    s = sales.get(acr, {})
    nby = acct.get("net_sales_by_year", {})
    def net(y):  # prefer curated (field-reconciled) figure, fall back to raw
        return nby.get(y) if nby.get(y) is not None else round(s.get(y, {}).get("net", 0))
    net24, net25 = net("2024"), net("2025")
    net26ytd = nby.get("2026_ytd", round(s.get("2026", {}).get("net", 0)))
    net26proj = nby.get("2026_proj", 0)
    probes = {y: int(s.get(y, {}).get("probes", 0)) for y in ("2024", "2025", "2026")}
    probes_total = sum(probes.values())
    cases_total = acct.get("cases_logged", 0)
    probes_per_case = round(probes_total / cases_total, 2) if cases_total else None
    total_net = (net24 or 0) + (net25 or 0) + (net26ytd or 0)
    rev_per_case = round(total_net / cases_total) if cases_total else None
    rev_vs_region = round(rev_per_case / REGION_AVG_CASE, 2) if rev_per_case else None
    return {
        "net_by_year": {"2024": net24, "2025": net25, "2026_ytd": net26ytd, "2026_proj": net26proj},
        "probes_by_year": probes, "probes_total": probes_total,
        "cases_logged": cases_total, "probes_per_case": probes_per_case,
        "rev_per_case": rev_per_case, "region_avg_case": REGION_AVG_CASE,
        "rev_vs_region": rev_vs_region, "trend": acct.get("trend"),
        "business_potential_yr": acct.get("business_potential_yr", 0),
        "incremental_cases": acct.get("incremental_cases", 0),
        "sku_mix": {k: round(v) for k, v in sorted(sku_mix.get(acr, {}).items(), key=lambda x: -x[1])},
    }

# ---- reservoir penetration -----------------------------------------------------
def reservoirs(acct):
    out = []
    for name, tup in (acct.get("reservoirs") or {}).items():
        addr, pool = tup
        out.append({"indication": name, "addressable": addr, "pool": pool})
    return out

# ---- header capability chips (seeded; editable in tool) ------------------------
CAPITAL_KEYWORDS = re.compile(r"rosa|stealth|clearpoint|visualase|robot|mri|3t|1\.5", re.I)
def header_facts(acct):
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    does_litt = acct.get("cases_logged", 0) > 0 or any(pl in ("NeuroBlate", "Visualase", "ClearPoint") for pl in plats)
    seeg = sum(p.get("seeg", 0) for p in by_acct.get(acct["acronym"], []))
    crani = sum(p.get("epi_cranio", 0) + p.get("tumor_cranio", 0) for p in by_acct.get(acct["acronym"], []))
    # robot: ClearPoint SmartFrame is competitive; ROSA is Zimmer (synergy). Seed from situation text.
    sit = acct.get("situation", "").lower()
    robot = "ROSA (Zimmer)" if "rosa" in sit else ("ClearPoint SmartFrame" if "clearpoint" in plats or "clearpoint" in sit else "")
    return {
        "account_type": acct.get("class"),
        "does_litt": does_litt,
        "our_system": "NeuroBlate" if "NeuroBlate" in plats else "—",
        "competitor_system": ", ".join(pl for pl in plats if pl in ("Visualase", "ClearPoint")) or "None confirmed",
        "mri": "",                         # confirm in field
        "robot": robot,                    # seeded from intel where mentioned
        "navigation": "",                  # confirm in field
        "does_seeg": bool(seeg),
        "seeg_volume": seeg,
        "crani_over_50": crani >= 50,
        "crani_volume": crani,
        "service_contract": "",            # confirm in field
    }

# ---- composite health grade ----------------------------------------------------
def health(acct, biz):
    """Weighted 0-100 health score → letter grade. Transparent sub-scores."""
    subs = {}
    # trajectory (25): trend + 2026 proj vs 2025
    tmap = {"Up": 25, "New": 20, "Flat": 14, "Down": 6, "Competitive": 8}
    subs["Trajectory"] = tmap.get(biz["trend"], 12)
    # penetration vs reservoir (20)
    rs = reservoirs(acct)
    addr = sum(r["addressable"] for r in rs) or 0
    pen = (acct.get("cases_logged", 0) / addr) if addr else 0
    subs["Reservoir capture"] = min(20, round(pen * 60)) if addr else 8
    # surgeon depth / single-surgeon risk (20)
    nsurg = len([s for s in acct.get("surgeons", []) if s[1] > 0])
    subs["Surgeon depth"] = {0: 4, 1: 8}.get(nsurg, min(20, 8 + nsurg * 4))
    # competitive pressure (20): lower is better
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    comp = any(pl in ("Visualase", "ClearPoint") for pl in plats)
    subs["Competitive position"] = 10 if comp else 20
    if acct.get("class") == "Competitive":
        subs["Competitive position"] = 5
    # value capture (15): rev vs region
    rv = biz.get("rev_vs_region")
    subs["Value capture"] = 15 if (rv and rv >= 1) else (10 if rv else 7)
    total = sum(subs.values())
    grade = ("A" if total >= 85 else "A-" if total >= 78 else "B+" if total >= 72 else
             "B" if total >= 65 else "B-" if total >= 58 else "C+" if total >= 50 else
             "C" if total >= 42 else "D" if total >= 32 else "F")
    return {"score": total, "grade": grade, "subs": subs}

# ---- SWOT + strategy seeds -----------------------------------------------------
def swot_seed(acct, biz, hdr):
    S, W, O, T = [], [], [], []
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    if hdr["robot"].startswith("ROSA"):
        S.append("ROSA in-house — Zimmer acquisition of Monteris makes this a strategic-synergy account.")
    if hdr["does_seeg"]:
        S.append(f"Active SEEG program ({hdr['seeg_volume']} claims) — SEEG-localized foci convert directly to ablation targets.")
    if hdr["crani_over_50"]:
        S.append(f"High craniotomy volume ({hdr['crani_volume']}+ tumor+epilepsy cranis) — large in-house conversion pool.")
    rs = reservoirs(acct)
    big = sorted(rs, key=lambda r: -r["addressable"])[:2]
    for r in big:
        if r["addressable"] >= 20:
            O.append(f"{r['indication']}: ~{r['addressable']} addressable of {r['pool']} pool — under-penetrated.")
    if any(s[1] > 0 for s in acct.get("surgeons", [])) and len([s for s in acct.get("surgeons", []) if s[1] > 0]) == 1:
        W.append("Single-surgeon dependency — volume collapses to zero on one departure. Develop a second adopter.")
    if any(pl in ("Visualase", "ClearPoint") for pl in plats):
        comp = ", ".join(pl for pl in plats if pl in ("Visualase", "ClearPoint"))
        W.append(f"Competitive laser in-house ({comp}) — split platform, capital-standardization risk.")
        T.append(f"{comp} entrenchment / competitive KOL influence — monitor capital cycle and consulting ties.")
    for name in acct.get("user_targets", []):
        if name in KOL_NAMES:
            T.append(f"Competitive KOL activity around {name} — confirm allegiance in field.")
            break
    if biz["trend"] == "Down":
        T.append("Revenue trending down — diagnose whether clinical, capital, or relationship-driven.")
    return {"strengths": S, "weaknesses": W, "opportunities": O, "threats": T}

def strategy_seed(acct, hdr):
    plays = []
    perf = [s for s in acct.get("surgeons", []) if s[1] > 0]
    # develop-surgeon play
    naive = [n for n in acct.get("user_targets", []) if n not in {s[0] for s in perf}]
    if naive:
        plays.append({
            "type": "Develop surgeon",
            "target": naive[0],
            "objective": f"Convert {naive[0]} from LITT-naïve to first case within 2 quarters.",
            "tactics": ["Peer-to-peer with in-account performer + a matched KOL proctor",
                        "Cadaver / sim lab on NeuroBlate workflow",
                        "Case-selection clinic: co-review 2-3 of their craniotomy candidates for LITT suitability",
                        "Carry the indication evidence pack matched to their wheelhouse"],
        })
    # crack-competitor play
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    if "ClearPoint" in plats or acct.get("class") == "Competitive" and "ClearPoint" in acct.get("situation", ""):
        plays.append({
            "type": "Crack competitor",
            "target": "ClearPoint footprint",
            "objective": "Displace or coexist by exploiting ClearPoint's ablation-size ceiling.",
            "tactics": ["Exploit: ClearPoint is workflow-limited on larger tumor / RN ablations — position NeuroBlate for the tumor & radiation-necrosis book",
                        "Quantify the mets/RN reservoir they cannot serve well and bring the LITT+SRT and steroid-reduction evidence",
                        "Target tumor & rad-onc referrers, not just the implanting surgeon"],
        })
    if "Visualase" in plats:
        plays.append({
            "type": "Crack competitor",
            "target": "Visualase footprint",
            "objective": "Convert a Visualase-trained surgeon using a live in-territory reference.",
            "tactics": ["Leverage a Visualase→NeuroBlate convert nearby as social proof",
                        "Contrast real-time thermal monitoring & larger single-trajectory ablation volume",
                        "Trial-in-value-analysis motion where a system is already under review"],
        })
    return plays

# ---- assemble ------------------------------------------------------------------
cards = []
for acct in AI.ACCOUNTS:
    acr = acct["acronym"]
    perf, kols, naive, refs = classify_universe(acr, acct)
    biz = business(acr, acct)
    hdr = header_facts(acct)
    cards.append({
        "rank": acct["rank"], "name": acct["name"], "acronym": acr,
        "system": acct["system"], "class": acct["class"], "posture": acct["posture"],
        "platform": [p.split(" (")[0] for p in acct["platform"]],
        "win": acct.get("win"), "situation": acct.get("situation", ""),
        "header": hdr,
        "health": health(acct, biz),
        "business": biz,
        "reservoirs": reservoirs(acct),
        "universe": {"performers": perf, "kols": kols, "naive_targets": naive, "referrers": refs},
        "swot": swot_seed(acct, biz, hdr),
        "strategy": strategy_seed(acct, hdr),
        "appendix": build_appendix(acr, acct),
    })

out = {
    "meta": {
        "title": "LITT Account Report Cards — Northeast Territory",
        "generated": PROF["meta"].get("generated", ""),
        "note": "Data-driven sections computed from account intel + physician universe + 3-yr NeuroBlate sales. Qualitative sections (header confirmations, SWOT, strategy) are editable seeds.",
    },
    "territory": {
        "region_avg_case": REGION_AVG_CASE, "quota_2026": TERR["quota_2026"],
        "cases_ytd_2026": TERR["cases_ytd_2026"], "candidate_universe_yr": TERR["candidate_universe_yr"],
    },
    "accounts": sorted(cards, key=lambda c: c["rank"]),
}
with open(os.path.join(ROOT, "tools/account-cards-alt/account-cards.json"), "w") as f:
    json.dump(out, f, indent=1)

# quick console summary
print(f"Wrote account-cards.json — {len(cards)} accounts")
for c in out["accounts"]:
    h = c["health"]; b = c["business"]
    print(f"  #{c['rank']:>2} {c['acronym']:6s} {c['class']:12s} grade={h['grade']:2s}({h['score']:>3}) "
          f"cases={b['cases_logged']:>3} p/case={b['probes_per_case']} rev/case={b['rev_per_case']} "
          f"vsReg={b['rev_vs_region']} KOLs={len(c['universe']['kols'])} appx={len(c['appendix'])}")
