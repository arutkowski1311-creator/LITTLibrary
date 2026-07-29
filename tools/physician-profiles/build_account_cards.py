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

# ---- enrichment (live web research for naive candidates / champions) -----------
_ENR_PATH = os.path.join(HERE, "research_enrichment.json")
ENRICH = {}
if os.path.exists(_ENR_PATH):
    ENRICH = {k: v for k, v in json.load(open(_ENR_PATH)).items() if not k.startswith("_")}

# ---- capital-equipment taxonomy (robots vs navigation are NOT the same thing) --
# Robots physically drive the trajectory; navigation/targeting platforms plan and
# guide it. ClearPoint SmartFrame is MRI-guided NAVIGATION/targeting, not a robot.
LIBRARY = {
    "litt": [
        "NeuroBlate (Monteris — ours)", "Visualase (Medtronic — competitor)", "None",
    ],
    "robots": [
        "ROSA (Zimmer Biomet)", "Mazor X (Medtronic)", "ExcelsiusGPS (Globus)",
        "Cirq arm (Brainlab)", "Stealth Autoguide (Medtronic)", "neuromate (Renishaw)",
        "None", "Unknown — confirm in field",
    ],
    "navigation": [
        "ClearPoint SmartFrame (MRI-guided targeting)", "Brainlab (Curve / Kick)",
        "Medtronic StealthStation", "Stryker Q Guidance", "Frameless (AxiEM / mask)",
        "Leksell / CRW frame", "None", "Unknown — confirm in field",
    ],
    "play_types": [
        "Develop surgeon", "Crack competitor", "Activate referral", "Defend", "Custom",
    ],
}

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

def _num(x):
    try: return int(x or 0)
    except (TypeError, ValueError): return 0

def candidate_profile(name):
    """Data-driven read on a LITT-naive surgeon: drivers (with real numbers), a
    composite score for ranking, and a plain-language 'why this candidate'."""
    p = PROV_BY_NAME.get(name) or {}
    seeg = _num(p.get("seeg"))
    epi = _num(p.get("epi_cranio"))
    tum = _num(p.get("tumor_cranio"))
    mets = _num(p.get("mets_rn"))
    pool = _num(p.get("intractable"))
    wh = ((p.get("wheelhouse") or {}).get("archetype") or "")
    enr = ENRICH.get(name) or {}
    assess = ((enr.get("litt_candidacy") or {}).get("assessment") or "").lower()
    kol = name in KOL_NAMES
    # wheelhouse LITT affinity bonus
    whl = wh.lower()
    wh_bonus = 0
    if any(k in whl for k in ("ablation", "litt", "laser")): wh_bonus += 8
    if any(k in whl for k in ("epilepsy", "seeg", "mtle", "focal cortical")): wh_bonus += 5
    if any(k in whl for k in ("metasta", "necrosis", "glioma", "gbm", "tumor")): wh_bonus += 3
    # research-verified candidacy override (strong signal when we have it)
    assess_adj = {"strong": 10, "moderate": 2, "weak": -12}.get(assess, 0)
    score = (seeg * 3) + (epi * 0.5) + (tum * 0.35) + (mets * 0.15) \
            + (8 if kol else 0) + wh_bonus + assess_adj
    drivers = []
    if seeg: drivers.append({"label": "SEEG implants", "value": seeg})
    if epi:  drivers.append({"label": "epilepsy cranis", "value": epi})
    if tum:  drivers.append({"label": "tumor cranis", "value": tum})
    if mets: drivers.append({"label": "mets/RN cranis", "value": mets})
    if pool: drivers.append({"label": "intractable pool", "value": pool})
    # rationale — prefer the researched assessment, else derive from claims signal
    if enr.get("litt_candidacy", {}).get("rationale"):
        rationale = enr["litt_candidacy"]["rationale"]
    elif seeg and epi:
        rationale = (f"Active epilepsy surgeon — {seeg} SEEG implants and {epi} epilepsy "
                     f"craniotomies. SEEG-localized foci convert directly into ablation targets.")
    elif epi:
        rationale = f"{epi} epilepsy craniotomies — epilepsy volume amenable to LITT conversion."
    elif tum or mets:
        rationale = (f"{tum + mets} tumor / mets-RN craniotomies — a candidate for tumor, "
                     f"metastasis and radiation-necrosis ablation.")
    else:
        rationale = ("Low in-house craniotomy/SEEG signal in claims — confirm current case "
                     "mix and interest before investing.")
    if kol and "KOL" not in rationale:
        rationale += " Published LITT/epilepsy KOL."
    return {
        "score": round(score, 1), "drivers": drivers, "rationale": rationale,
        "assessment": assess or None, "wheelhouse": wh,
        "seeg": seeg, "epi_cranio": epi, "tumor_cranio": tum, "mets_rn": mets, "pool": pool,
        "kol": kol,
    }

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
        cp = candidate_profile(name)
        naive.append({
            "name": name, "npi": (p or {}).get("npi"),
            "cohort": (p or {}).get("cohort", ""),
            "epi_cranio": cp["epi_cranio"], "tumor_cranio": cp["tumor_cranio"],
            "seeg": cp["seeg"], "mets_rn": cp["mets_rn"], "pool": cp["pool"],
            "wheelhouse": cp["wheelhouse"], "kol": cp["kol"],
            "score": cp["score"], "drivers": cp["drivers"],
            "rationale": cp["rationale"], "assessment": cp["assessment"],
        })
    # rank naive targets by data-driven candidate score (best first)
    naive.sort(key=lambda n: -n["score"])
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

def pubmed_name(name):
    from urllib.parse import quote_plus
    parts = name.split()
    if len(parts) < 2: return None
    q = f"{parts[-1]} {parts[0][0]}"  # "Feldstein N"
    return "https://pubmed.ncbi.nlm.nih.gov/?term=" + quote_plus(q + "[Author]")

def scholar_name(name):
    from urllib.parse import quote_plus
    return "https://scholar.google.com/scholar?q=" + quote_plus(name + " laser interstitial thermal OR epilepsy OR glioma")

# per-paper LITT affinity: 2=directly LITT, 1=ablation-amenable indication, 0=other
_HIGH = ("litt", "laser interstitial", "laser ablation", "mr-guided laser", "mrglitt",
         "mrgLITT", "thermal therapy", "thermal ablation", "interstitial thermal", "laser")
_MED = ("seeg", "stereoelectro", "drug-resistant epilepsy", "drug resistant epilepsy",
        "temporal lobe epilepsy", "mtle", "epilepsy surg", "focal cortical", "hypothalamic hamartoma",
        "tuberous", "brain metasta", "radiation necrosis", "recurrent glioma", "glioblastoma",
        "gbm", "high-grade glioma", "ablation", "convection-enhanced", "meningioma")
def paper_affinity(title, area="", explicit=None):
    if explicit in ("high", "med", "low"):
        return {"high": 2, "med": 1, "low": 0}[explicit]
    t = (str(title or "") + " " + str(area or "")).lower()
    if any(k in t for k in _HIGH): return 2
    if any(k in t for k in _MED): return 1
    return 0

# ---- research appendix: deep-dive for every performer + naive target ----------
def build_appendix(acr, acct):
    perf = [s[0] for s in acct.get("surgeons", [])]
    naive = [n for n in acct.get("user_targets", []) if n not in perf]
    order = [("Performer", n) for n in perf] + [("Development target", n) for n in naive]
    entries = []
    for role, name in order:
        p = PROV_BY_NAME.get(name) or {}
        res = p.get("research") or {}
        wh = p.get("wheelhouse") or {}
        rel = res.get("litt_relevance") or {}
        enr = ENRICH.get(name) or {}
        # papers: merge json key/recent + enrichment, tag affinity, sort by (affinity, year)
        papers = []
        for pp in (res.get("key_papers") or []):
            papers.append({"title": pp.get("title"), "year": pp.get("year"),
                           "area": pp.get("topic") or wh.get("archetype", ""),
                           "journal": pp.get("journal", ""), "kind": "Key",
                           "aff": paper_affinity(pp.get("title"), pp.get("topic")),
                           "url": pubmed(pp.get("title"))})
        for pp in (res.get("recent_papers") or []):
            papers.append({"title": pp.get("title"), "year": pp.get("year"),
                           "area": pp.get("topic") or wh.get("archetype", ""),
                           "journal": pp.get("journal", ""), "kind": "Recent",
                           "aff": paper_affinity(pp.get("title"), pp.get("topic")),
                           "url": pubmed(pp.get("title"))})
        seen = {(pp["title"] or "").lower() for pp in papers}
        for pp in (enr.get("papers") or []):
            if (pp.get("title") or "").lower() in seen: continue
            papers.append({"title": pp.get("title"), "year": pp.get("year"),
                           "area": pp.get("journal", ""), "journal": pp.get("journal", ""),
                           "kind": "Verified",
                           "aff": paper_affinity(pp.get("title"), pp.get("journal"), pp.get("litt_affinity")),
                           "url": pp.get("url") or pubmed(pp.get("title"))})
        papers.sort(key=lambda x: (-(x["aff"]), -(x["year"] or 0)))
        # candidacy (for naive targets)
        cand = candidate_profile(name) if role == "Development target" else None
        links = enr.get("links") or {}
        # training pedigree — enrichment (structured) preferred, else the flat string in the universe
        training = enr.get("training")
        if not training and p.get("training"):
            training = {"pedigree_note": p.get("training")}
        entries.append({
            "physician": name, "role": role, "npi": p.get("npi"),
            "grade": rel.get("grade"), "score": rel.get("score"),
            "title": enr.get("title") or res.get("identity", ""),
            "bio": enr.get("bio", ""),
            "training": training,
            "identity": res.get("identity", ""),
            "facility": enr.get("current_institution") or acct.get("system", ""),
            "archetype": wh.get("archetype", ""),
            "themes": (enr.get("research_focus") or res.get("themes") or [])[:7],
            "rationale": rel.get("rationale", ""),
            "candidacy": ({"assessment": cand["assessment"], "rationale": cand["rationale"],
                           "drivers": cand["drivers"]} if cand else None),
            "medscout": p.get("medscout"),
            "profile_url": links.get("hospital_profile") or res.get("profile_url"),
            "scholar_url": links.get("scholar") or res.get("scholar_url") or scholar_name(name),
            "pubmed_url": links.get("pubmed_search") or pubmed_name(name),
            "other_url": links.get("other"),
            "enriched": bool(enr),
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

# ---- addressable reservoirs ----------------------------------------------------
# The pool is the raw claims count coded for the indication in the account's referral
# area. Addressable = the clinically LITT-appropriate share of that pool, per year.
# This factor is NOT uniform: LITT eligibility differs sharply by indication.
INDICATION_FACTORS = {   # % of the coded pool realistically in-play for LITT
    "Radiation necrosis":  20,  # symptomatic / steroid-dependent / progressive RN; biopsy+ablation+steroid weaning in one pass
    "Recurrent GBM":       12,  # deep / eloquent / unresectable recurrence, adequate performance status
    "Intractable epilepsy": 8,  # focal, localizable only — MTLE (sweet spot), FCD, hypothalamic hamartoma, PVNH
    "Mets":                 3,  # deep/inaccessible or SRS-failed local recurrence; most mets go to SRS ± systemic
}
INDICATION_LOGIC = {
    "Radiation necrosis":  "symptomatic / steroid-dependent / progressive RN (biopsy + ablation + steroid weaning in one pass)",
    "Recurrent GBM":       "deep / eloquent / unresectable recurrence with adequate performance status",
    "Intractable epilepsy": "focal, localizable epilepsy — MTLE, focal cortical dysplasia, hypothalamic hamartoma, PVNH",
    "Mets":                 "deep / surgically-inaccessible lesions or SRS-failed local recurrence",
}
DEFAULT_FACTOR = 5

def reservoirs(acct):
    out = []
    for name, tup in (acct.get("reservoirs") or {}).items():
        _old_addr, pool = tup
        f = INDICATION_FACTORS.get(name, DEFAULT_FACTOR)
        out.append({"indication": name, "pool": pool, "factor_pct": f,
                    "addressable": round(pool * f / 100.0),
                    "logic": INDICATION_LOGIC.get(name, "LITT-appropriate share of the coded pool")})
    return out

# ---- header capability chips (seeded; editable in tool) ------------------------
CAPITAL_KEYWORDS = re.compile(r"rosa|stealth|clearpoint|visualase|robot|mri|3t|1\.5", re.I)
def header_facts(acct):
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    does_litt = acct.get("cases_logged", 0) > 0 or any(pl in ("NeuroBlate", "Visualase", "ClearPoint") for pl in plats)
    seeg = sum(p.get("seeg", 0) for p in by_acct.get(acct["acronym"], []))
    crani = sum(p.get("epi_cranio", 0) + p.get("tumor_cranio", 0) for p in by_acct.get(acct["acronym"], []))
    sit = acct.get("situation", "").lower()
    # ROBOT = physically drives the trajectory (ROSA etc.). ClearPoint SmartFrame is
    # NAVIGATION/targeting, NOT a robot — seed it under navigation, never robot.
    robot = "ROSA (Zimmer Biomet)" if "rosa" in sit else ""
    nav = "ClearPoint SmartFrame (MRI-guided targeting)" if ("clearpoint" in plats or "clearpoint" in sit) else ""
    # competitive LITT threat (laser / ecosystem) — ClearPoint is a targeting ecosystem, not a laser
    comp_bits = []
    if "Visualase" in plats: comp_bits.append("Visualase (Medtronic)")
    if "ClearPoint" in plats: comp_bits.append("ClearPoint ecosystem (targeting/nav)")
    return {
        "account_type": acct.get("class"),
        "does_litt": does_litt,
        "our_system": "NeuroBlate (Monteris — ours)" if "NeuroBlate" in plats else "—",
        "competitor_system": ", ".join(comp_bits) or "None confirmed",
        "mri": "",                         # confirm in field
        "robot": robot,                    # ROSA etc. — seeded where the deck states it
        "navigation": nav,                 # ClearPoint SmartFrame / Brainlab / StealthStation
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
    if "Visualase" in plats:
        W.append("Competitive laser in-house (Visualase, Medtronic) — split platform, capital-standardization risk.")
        T.append("Visualase entrenchment / competitive KOL influence — monitor capital cycle and consulting ties.")
    if "ClearPoint" in plats:
        W.append("ClearPoint targeting/navigation ecosystem in-house — capital-standardization pressure toward the competitive stack.")
        T.append("ClearPoint consultant influence pushing system standardization — monitor capital committee and consulting ties.")
    for name in acct.get("user_targets", []):
        if name in KOL_NAMES:
            T.append(f"Competitive KOL activity around {name} — confirm allegiance in field.")
            break
    if biz["trend"] == "Down":
        T.append("Revenue trending down — diagnose whether clinical, capital, or relationship-driven.")
    return {"strengths": S, "weaknesses": W, "opportunities": O, "threats": T}

def strategy_seed(acct, hdr, naive_ranked):
    plays = []
    perf = [s for s in acct.get("surgeons", []) if s[1] > 0]
    # develop-surgeon play — lead with the highest-scoring data-driven candidate
    if naive_ranked:
        top = naive_ranked[0]
        name = top["name"]
        wh = top.get("wheelhouse") or ""
        n_cand = min(3, max(2, (top.get("epi_cranio", 0) + top.get("tumor_cranio", 0)) // 5 or 2))
        plays.append({
            "type": "Develop surgeon",
            "target": name,
            "why": top.get("rationale", ""),
            "assessment": top.get("assessment"),
            "drivers": top.get("drivers", []),
            "objective": f"Convert {name} from LITT-naïve to a first case within two quarters.",
            "tactics": [
                f"Proctored first case: pair {name} with a matched NeuroBlate KOL proctor for their first ablation.",
                "Reference-site visit: bring them to observe a live NeuroBlate case at a nearby high-volume account.",
                f"Joint case-selection clinic: co-review {n_cand} of their SEEG/craniotomy candidates for ablation suitability.",
                "Value-analysis support: prep the VAC packet (clinical + economic) to clear capital/committee hurdles.",
                f"Carry the indication evidence pack matched to their wheelhouse{f' ({wh})' if wh else ''}.",
            ],
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
    # activate-referral play — when a large indication pool sits upstream of the OR
    rs = reservoirs(acct)
    big = sorted(rs, key=lambda r: -r["addressable"])[:1]
    top_refs = [r[0] for r in (acct.get("epilepsy_referrers", []) + acct.get("necrosis_referrers", []))][:3]
    if big and big[0]["addressable"] >= 20:
        r = big[0]
        ind = r["indication"]
        refs_str = (" (" + ", ".join(top_refs) + ")") if top_refs else ""
        plays.append({
            "type": "Activate referral",
            "target": f"{ind} referral base",
            "objective": f"Convert the {ind} pool (~{r['addressable']} addressable of {r['pool']}) into logged cases via referrer activation.",
            "tactics": [
                f"Prime the top referrers{refs_str} with the {ind}-matched evidence pack.",
                "Build the tumor-board / epilepsy-conference presence so LITT is named as an option at case selection.",
                "Close the referral loop back to the performing surgeon and track conversion.",
            ],
        })
    return plays

# ---- field intelligence: rep-owned layer no database can supply ----------------
# One structured slot per kind of on-the-ground fact (staff moves, champion,
# competitor activity, capital status, decision-makers, recent events, sentiment).
# Medscout gives volumes; sales gives revenue; only the rep knows a surgeon is
# leaving. Seeded empty unless the account intel carries a curated overlay.
FIELD_INTEL_SLOTS = [
    ("staff_moves", "Staff & surgeon moves", "— surgeons arriving / leaving / retiring; volume impact —"),
    ("champion", "Champion & relationship", "— who's our advocate, how strong —"),
    ("competitor_activity", "Competitor activity", "— Visualase / ClearPoint reps, trials, evals on the ground —"),
    ("capital_status", "Capital / committee status", "— purchase in motion, budget frozen, VAC pending —"),
    ("decision_makers", "Decision-makers & blockers", "— who actually controls the platform decision —"),
    ("recent_events", "Recent events", "— new hire, new iMRI, service issue, lost case —"),
    ("sentiment", "Momentum & sentiment", "— warming / cooling / stalled, and why —"),
]

def field_intel(acct):
    fi = dict(acct.get("field_intel") or {})
    out = {"updated": fi.get("updated", "")}
    for key, _label, _ph in FIELD_INTEL_SLOTS:
        out[key] = fi.get(key, "")
    return out

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
        "field_intel": field_intel(acct),
        "swot": swot_seed(acct, biz, hdr),
        "strategy": strategy_seed(acct, hdr, naive),
        "appendix": build_appendix(acr, acct),
    })

out = {
    "meta": {
        "title": "LITT Account Report Cards — Northeast Territory",
        "generated": PROF["meta"].get("generated", ""),
        "note": "Data-driven sections computed from account intel + physician universe + 3-yr NeuroBlate sales. Qualitative sections (header confirmations, SWOT, strategy) are editable seeds.",
        "enriched": sorted(ENRICH.keys()),
    },
    "library": LIBRARY,
    "reservoir_method": {
        "pool": "Patients coded for this indication in the account's referral area (claims volume).",
        "addressable": "The clinically LITT-appropriate share of the pool, per year — factor differs by indication (editable).",
        "opportunity": "Addressable × the region's average revenue per case ($" + f"{REGION_AVG_CASE:,}" + ").",
        "scope": "Total winnable market per year — inclusive of the cases we already win, not incremental. The plan's realistic near-term incremental target is the separate “Annual potential” figure.",
        "factors": INDICATION_FACTORS,
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
