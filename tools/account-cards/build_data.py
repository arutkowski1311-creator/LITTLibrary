# -*- coding: utf-8 -*-
"""
Account Report Card — data engine.

Joins three sources into one per-account record consumed by the printable
report-card tool:

  * account_intel.py         — curated territory-plan intelligence (18 accounts)
  * physician-profiles.json  — 2,807 mapped clinicians + research payloads
  * 20xx_NE_Sales_Data.xlsx  — 3 years of NeuroBlate line-item sales

Output: tools/account-cards/account_cards.json  (embedded into the HTML tool)

The engine DERIVES everything it can (sales trajectory, probes/case, $/case vs
region, reservoir penetration, a composite health grade, and seed SWOT +
strategy) so the field team edits rather than authors. Every seeded qualitative
field is editable in the tool.
"""
import json, os, importlib.util, re
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
UPLOADS = "/root/.claude/uploads/a0b180ed-326e-587f-bb74-bb43186df4d1"

# ---------------------------------------------------------------- load sources
spec = importlib.util.spec_from_file_location(
    "account_intel", os.path.join(ROOT, "tools", "physician-profiles", "account_intel.py"))
AI = importlib.util.module_from_spec(spec); spec.loader.exec_module(AI)

PROF = json.load(open(os.path.join(ROOT, "physician-profiles.json")))
PROVIDERS = PROF["providers"]

def _norm(s):
    return re.sub(r"[^a-z ]", "", (s or "").lower()).split()

# index providers by (first-initial, last-name) so short "Guy McKhann" resolves
# to the full-record "Guy M Mckhann".
_PROV_EXACT = {p["name"].lower(): p for p in PROVIDERS}
_PROV_FL = defaultdict(list)   # (first, last) -> providers
for p in PROVIDERS:
    toks = _norm(p["name"])
    if len(toks) >= 2:
        _PROV_FL[(toks[0], toks[-1])].append(p)

def resolve(name):
    if not name:
        return None
    if name.lower() in _PROV_EXACT:
        return _PROV_EXACT[name.lower()]
    toks = _norm(name)
    if len(toks) >= 2:
        hits = _PROV_FL.get((toks[0], toks[-1]))
        if hits:
            return hits[0]
    return None

class _CompatMap:
    def get(self, k, default=None):
        return resolve(k) or default
PROV_BY_NAME = _CompatMap()

SALES_FILES = {
    "2024": os.path.join(UPLOADS, "262a4696-2024_NE_Sales_Data.xlsx"),
    "2025": os.path.join(UPLOADS, "e954bd43-2025_NE_Sales_Data.xlsx"),
    "2026": os.path.join(UPLOADS, "60d63652-2026_Sales_Data_NE.xlsx"),
}

# hospital-name (as it appears in sales export) -> account acronym
HOSP_TO_ACR = {
    "columbia university medical center": "CUMC",
    "yale new haven hospital": "YALE",
    "brigham & women's hospital": "BWH",
    "beth israel deaconess med ctr": "BID",
    "westchester medical center": "WMC",
    "nyu hospitals center": "NYU",
    "stony brook university hospital": "SUH",
    "memorial sloan kettering cancer center": "MSK",
    "temple university hospital": "TUH",
    "hackensack meridian health": "HJFK",
    "new york presbyterian hospital - cornell": "CORN",
    "rochester regional health": "ROC",
    "suny upstate medical university": "SUNY",
    "mount sinai hospital": "MSSM",
    "mt. sinai school of medicine": "MSSM",
}

def line_category(desc, ino):
    d = (desc or "").lower(); ino = str(ino or "")
    if ino.upper().startswith("ALACART") or "neuroblate system" in d:
        return "Capital"
    if "procedure" in d and "fee" in d:
        return "Procedure Fee"
    if "driver" in d or "mandrel" in d or "insertion" in d:
        return "Accessory"
    if ("probe" in d and "packaged" in d) or "laser probe" in d \
            or ino.startswith("FFD") or ino.startswith("NBP"):
        return "Probe"
    if "bolt" in d or "fiducial" in d:
        return "Accessory"
    return "Other"

# ---------------------------------------------------------------- parse sales
def load_sales():
    import openpyxl
    by_acr = defaultdict(lambda: defaultdict(list))  # acr -> year -> [lines]
    for yr, f in SALES_FILES.items():
        wb = openpyxl.load_workbook(f, data_only=True)
        ws = wb["Export"]
        for r in list(ws.iter_rows(values_only=True))[1:]:
            terr, hosp, net, ino, desc, sop, st, date, qty, acr, po = r
            if not hosp:
                continue
            a = HOSP_TO_ACR.get(hosp.strip().lower())
            if not a:
                continue
            by_acr[a][yr].append({
                "net": float(net or 0), "ino": ino, "desc": desc,
                "qty": int(qty or 0), "cat": line_category(desc, ino),
                "date": str(date)[:10], "sop": sop,
            })
    return by_acr

SALES = load_sales()

def sales_metrics(acr):
    """Real, spreadsheet-derived business metrics for one account."""
    years = ["2024", "2025", "2026"]
    out = {"years": years, "hasData": acr in SALES}
    by_year = {}
    for yr in years:
        lines = SALES.get(acr, {}).get(yr, [])
        cat = defaultdict(float)
        for x in lines:
            cat[x["cat"]] += x["net"]
        probes = sum(x["qty"] for x in lines if x["cat"] == "Probe")
        # cases ≈ billed procedures: distinct invoices carrying a procedure fee,
        # else distinct invoices carrying a probe.
        fee_sops = set(x["sop"] for x in lines if x["cat"] == "Procedure Fee" and x["net"] > 0)
        probe_sops = set(x["sop"] for x in lines if x["cat"] == "Probe")
        cases = len(fee_sops) if fee_sops else len(probe_sops)
        by_year[yr] = {
            "net": round(sum(cat.values())),
            "byCat": {k: round(v) for k, v in cat.items()},
            "probes": probes,
            "cases": cases,
            "capital": round(cat.get("Capital", 0)),
        }
    out["byYear"] = by_year
    # trailing consumable (non-capital) revenue for run-rate
    total_probes = sum(by_year[y]["probes"] for y in years)
    total_cases = sum(by_year[y]["cases"] for y in years) or 1
    out["probesPerCase"] = round(total_probes / total_cases, 2)
    # $/case: consumable revenue (ex-capital) / cases
    consumable = sum(by_year[y]["net"] - by_year[y]["capital"] for y in years)
    out["revPerCase"] = round(consumable / total_cases) if total_cases else 0
    out["regionRevPerCase"] = AI.TERRITORY["avg_rev_per_case"]
    out["boughtCapital2026"] = by_year["2026"]["capital"] > 0
    return out

# ---------------------------------------------------------------- header seeds
# Anything the territory deck / account_intel states about platform, robot, MRI,
# SEEG, crani volume. Rest left blank + flagged for field confirmation.
HEADER_SEED = {
    "CUMC": {
        "robot": "ROSA (confirm) — SEEG-active", "mri": "Confirm in field",
        "nav": "Confirm in field", "seeg": "Yes", "crani50": "Yes",
        "contract": "Confirm in field",
        "note": "Bought own NeuroBlate system in 2026 (CUMC-C-003, $289K capital).",
    },
    "BWH": {
        "robot": "Confirm in field", "mri": "Intraop MRI (AMIGO)", "nav": "Confirm in field",
        "seeg": "Yes", "crani50": "Yes", "contract": "Confirm in field",
        "note": "ClearPoint capital threat via MGB standardization (Richardson, MGH).",
    },
}

def surgeon_flag(acct):
    return "Yes" if any(c >= 3 for _, c in acct.get("surgeons", [])) else "Low"

# ---------------------------------------------------------------- health grade
def health(acct, sm):
    """Composite 0-100 health score from 5 weighted dimensions."""
    dims = {}
    # 1. Trajectory (revenue direction) — 25
    t = {"Up": 25, "Flat": 14, "Down": 5}.get(acct.get("trend"), 12)
    dims["Trajectory"] = t
    # 2. Reservoir penetration headroom (opportunity) — 20 (more headroom = higher, it's upside)
    res = acct.get("reservoirs", {})
    addressable = sum(a for a, _ in res.values())
    logged = acct.get("cases_logged", 0)
    pen = logged / addressable if addressable else 0
    dims["Penetration"] = round(min(20, 6 + pen * 60))
    # 3. Surgeon depth (single-surgeon risk) — 20
    surg = acct.get("surgeons", [])
    active = [c for _, c in surg if c >= 2]
    if len(active) >= 2: sd = 20
    elif len(active) == 1: sd = 9
    else: sd = 4
    dims["SurgeonDepth"] = sd
    # 4. Competitive pressure (inverse) — 20
    plats = acct.get("platform", [])
    comp = any(("competitor" in p.lower() or "clearpoint" in p.lower() or "visualase" in p.lower()) for p in plats)
    ours = any("ours" in p.lower() or "neuroblate" in p.lower() for p in plats)
    if ours and not comp: cp = 20
    elif ours and comp: cp = 11
    else: cp = 4
    dims["Competitive"] = cp
    # 5. Commitment (capital / contract / win) — 15
    commit = 6
    if sm.get("boughtCapital2026"): commit += 6
    commit += {"High": 3, "Medium": 2, "Low": 1}.get(acct.get("win"), 1)
    dims["Commitment"] = min(15, commit)
    score = sum(dims.values())
    grade = ("A+" if score >= 90 else "A" if score >= 82 else "A-" if score >= 76 else
             "B+" if score >= 70 else "B" if score >= 63 else "B-" if score >= 57 else
             "C+" if score >= 50 else "C" if score >= 43 else "C-" if score >= 37 else
             "D" if score >= 28 else "F")
    return {"score": score, "grade": grade, "dims": dims}

# ---------------------------------------------------------------- SWOT seeds
def swot(acct, sm, hgrade):
    S, W, O, T = [], [], [], []
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    res = acct.get("reservoirs", {})
    # Strengths
    if sm.get("boughtCapital2026"):
        S.append("Owns its NeuroBlate system (2026 capital purchase) — committed installed base, not a loaner.")
    if acct.get("trend") == "Up":
        S.append("Revenue trajectory is up and to the right across the last 3 years.")
    if any(c >= 5 for _, c in acct.get("surgeons", [])):
        S.append("Established high-volume LITT operator anchoring the program.")
    big = [k for k, (a, raw) in res.items() if raw >= 400]
    if big:
        S.append("Large addressable reservoirs in " + ", ".join(big).lower() + ".")
    if "ROSA" in (HEADER_SEED.get(acct["acronym"], {}).get("robot", "")):
        S.append("ROSA robot on site — strategic alignment with the pending Zimmer acquisition.")
    if acct.get("epilepsy_referrers") and sum(v for _, v in acct["epilepsy_referrers"]) > 300:
        S.append("Deep epilepsy referral bench feeding SEEG→ablation pathway.")
    # Weaknesses
    active = [c for _, c in acct.get("surgeons", []) if c >= 2]
    if len(active) <= 1:
        W.append("Single-surgeon dependency — program concentration risk.")
    if "Visualase" in plats or "ClearPoint" in plats:
        comp = [p for p in plats if p in ("Visualase", "ClearPoint")]
        W.append("Competitive laser in house (" + ", ".join(comp) + ") splitting case flow.")
    if sm.get("hasData") and sm["byYear"]["2026"]["probes"] == 0 and acct.get("class") == "Installed":
        W.append("No probe pull-through recorded YTD — utilization stall.")
    if sm.get("revPerCase") and sm["revPerCase"] < sm.get("regionRevPerCase", 0) * 0.8:
        W.append("Consumable revenue per case trails the region average.")
    # Opportunities
    untapped = sum(max(0, a) for a, _ in res.values()) - acct.get("cases_logged", 0)
    if untapped > 5:
        O.append(f"~{int(untapped)} addressable cases/yr beyond current logged volume.")
    if acct.get("user_targets"):
        O.append("Develop additional surgeons: " + ", ".join(acct["user_targets"][:3]) + ".")
    if acct.get("necrosis_referrers"):
        O.append("Activate radiation-necrosis pathway via rad-onc referrers.")
    if acct.get("business_potential_yr"):
        O.append(f"${acct['business_potential_yr']:,}/yr incremental business potential in the plan.")
    # Threats
    if "ClearPoint" in plats:
        T.append("ClearPoint capital/standardization threat — political, report from field.")
    if "Visualase" in plats:
        T.append("Medtronic Visualase rep presence on site.")
    if "leaving" in acct.get("situation", "").lower() or "emory" in acct.get("situation", "").lower():
        T.append("Key champion departing — succession & relationship risk.")
    T.append("Competitive KOL influence — confirm allegiances in field.")
    return {"S": S, "W": W, "O": O, "T": T}

# ---------------------------------------------------------------- strategy seeds
def strategy(acct, sm):
    plays = []
    plats = [p.split(" (")[0] for p in acct.get("platform", [])]
    posture = acct.get("posture", "")
    # Surgeon development
    if acct.get("user_targets"):
        plays.append({
            "type": "Develop surgeons",
            "title": "Build the bench beyond the anchor operator",
            "targets": acct["user_targets"][:4],
            "tactics": [
                "Proctoring / cadaver lab with the anchor surgeon as champion.",
                "Co-scrub first 3–5 cases; pair with clinical specialist.",
                "Share indication-matched LAANTERN outcomes for their subspecialty.",
                "Peer-to-peer visit to a NeuroBlate reference site.",
            ],
        })
    # Competitive crack
    if "ClearPoint" in plats:
        plays.append({
            "type": "Crack competitive",
            "title": "Exploit ClearPoint ablation-size ceiling on tumor/RN work",
            "tactics": [
                "ClearPoint is throughput-limited on larger tumor & radiation-necrosis ablations — position NeuroBlate side-fire + robust thermometry for larger lesions.",
                "Quantify OR-time and reposition burden vs. NeuroBlate for the surgeon.",
                "Target tumor & RN referrers who are underserved by an epilepsy-first ClearPoint program.",
            ],
        })
    if "Visualase" in plats:
        plays.append({
            "type": "Crack competitive",
            "title": "Displace Visualase on complex / repeat ablations",
            "tactics": [
                "Position full-perimeter monitoring and directional side-fire for complex geometries.",
                "Map which surgeon runs Visualase vs. NeuroBlate; convert the swing surgeon.",
                "Leverage in-house owned NeuroBlate capital to make ours the default.",
            ],
        })
    # Referral activation
    if acct.get("epilepsy_referrers") or acct.get("necrosis_referrers"):
        plays.append({
            "type": "Activate referrals",
            "title": "Convert referral reservoir into scheduled cases",
            "tactics": [
                "Epilepsy: SEEG-localized foci → laser amygdalohippocampotomy pathway with epileptology.",
                "Radiation necrosis: rad-onc tumor board presence, post-SRS surveillance → LITT.",
                "Build an indication-specific referral one-pager per pathway.",
            ],
        })
    return plays

# ---------------------------------------------------------------- physician universe
def universe(acct):
    perf = [{"name": n, "cases": c} for n, c in acct.get("surgeons", [])]
    perf_keys = {tuple(_norm(n)[-1:]) for n, _ in acct.get("surgeons", [])}
    naive = []
    for n in acct.get("user_targets", []):
        if tuple(_norm(n)[-1:]) in perf_keys:
            continue  # already a performer (e.g. named successor) — not naïve
        p = PROV_BY_NAME.get(n.lower())
        naive.append({
            "name": n,
            "cohort": (p or {}).get("cohort", ""),
            "seeg": (p or {}).get("seeg", 0),
            "tumor": (p or {}).get("tumor_cranio", 0),
            "epi": (p or {}).get("epi_cranio", 0),
        })
    refs = [{"name": n, "indication": ind, "count": c} for n, ind, c in acct.get("referrers", [])]
    epi = [{"name": n, "count": c, "pool": "Intractable epilepsy"} for n, c in acct.get("epilepsy_referrers", [])]
    nec = [{"name": n, "count": c, "pool": "Radiation necrosis"} for n, c in acct.get("necrosis_referrers", [])]
    # KOLs: research grade A/B among account physicians
    kols = []
    names = set([n for n, _ in acct.get("surgeons", [])] + acct.get("user_targets", []))
    for nm in names:
        p = PROV_BY_NAME.get(nm.lower())
        if not p:
            continue
        r = p.get("research") or {}
        rel = (r.get("litt_relevance") or {}) if isinstance(r, dict) else {}
        if rel.get("grade") in ("A", "A+", "B") or (isinstance(r, dict) and r.get("themes")):
            kols.append({"name": nm, "grade": rel.get("grade", "—"),
                         "why": rel.get("rationale", (r.get("identity") or ""))[:180]})
    return {"performers": perf, "naive": naive, "referrers": refs,
            "epiReferrers": epi, "necReferrers": nec, "kols": kols}

# ---------------------------------------------------------------- research appendix
def appendix(acct):
    entries = []
    names = set([n for n, _ in acct.get("surgeons", [])] + acct.get("user_targets", [])
                + [n for n, _, _ in acct.get("referrers", [])])
    for nm in names:
        p = PROV_BY_NAME.get(nm.lower())
        if not p:
            continue
        r = p.get("research")
        if not (isinstance(r, dict) and r.get("matched")):
            continue
        rel = r.get("litt_relevance") or {}
        papers = []
        for lst in (r.get("key_papers") or [], r.get("recent_papers") or []):
            for pp in lst:
                if isinstance(pp, dict):
                    papers.append({"title": pp.get("title", ""), "year": pp.get("year", ""),
                                   "journal": pp.get("journal", ""), "topic": pp.get("topic", "")})
        collab = [c.get("name") if isinstance(c, dict) else c
                  for c in (r.get("collaborators") or [])]
        network, seen = [], set()
        for cn in collab + (r.get("kol_connections") or []):
            k = " ".join(_norm(cn)[-2:]) if cn else ""
            if not cn or k in seen:
                continue
            seen.add(k); network.append(cn)
        entries.append({
            "name": nm,
            "identity": r.get("identity", ""),
            "themes": r.get("themes", []),
            "grade": rel.get("grade", "—"),
            "rationale": rel.get("rationale", ""),
            "network": network,
            "facility": p.get("affiliations", ""),
            "specialty": p.get("specialty", ""),
            "papers": papers,
            "profileUrl": r.get("profile_url", ""),
            "medscout": p.get("medscout", ""),
        })
    entries.sort(key=lambda e: (0 if e["grade"].startswith("A") else 1, e["name"]))
    return entries

# ---------------------------------------------------------------- assemble
def build_account(acct):
    acr = acct["acronym"]
    sm = sales_metrics(acr)
    hg = health(acct, sm)
    seed = HEADER_SEED.get(acr, {})
    header = {
        "type": acct.get("class", ""),
        "posture": acct.get("posture", ""),
        "doingLitt": "Yes" if acct.get("cases_logged", 0) > 0 else "Prospect",
        "system": acct.get("system", ""),
        "platform": [p.split(" (")[0] for p in acct.get("platform", [])],
        "robot": seed.get("robot", "Confirm in field"),
        "mri": seed.get("mri", "Confirm in field"),
        "nav": seed.get("nav", "Confirm in field"),
        "seeg": seed.get("seeg", "Confirm in field"),
        "crani50": seed.get("crani50", surgeon_flag(acct)),
        "contract": seed.get("contract", "Confirm in field"),
        "note": seed.get("note", ""),
    }
    return {
        "acr": acr, "name": acct["name"], "rank": acct["rank"],
        "system": acct.get("system", ""), "win": acct.get("win", ""),
        "situation": acct.get("situation", ""),
        "header": header, "sales": sm, "health": hg,
        "reservoirs": {k: {"addressable": a, "raw": raw} for k, (a, raw) in acct.get("reservoirs", {}).items()},
        "businessPotential": acct.get("business_potential_yr", 0),
        "incrementalCases": acct.get("incremental_cases", 0),
        "casesLogged": acct.get("cases_logged", 0),
        "projection2026": acct.get("net_sales_by_year", {}).get("2026_proj", 0),
        "universe": universe(acct),
        "swot": swot(acct, sm, hg),
        "strategy": strategy(acct, sm),
        "appendix": appendix(acct),
    }

def main():
    accounts = [build_account(a) for a in AI.ACCOUNTS]
    out = {
        "meta": {
            "title": "LITT Account Report Cards — Northeast Territory",
            "generated": "2026-07-27",
            "territory": AI.TERRITORY,
            "flagship": "CUMC",
        },
        "accounts": accounts,
    }
    dst = os.path.join(HERE, "account_cards.json")
    json.dump(out, open(dst, "w"), indent=1)
    print("wrote", dst)
    c = [a for a in accounts if a["acr"] == "CUMC"][0]
    print("Columbia health:", c["health"])
    print("Columbia sales byYear:", json.dumps(c["sales"]["byYear"], indent=1))
    print("appendix entries:", [(e["name"], e["grade"], len(e["papers"])) for e in c["appendix"]])

if __name__ == "__main__":
    main()
