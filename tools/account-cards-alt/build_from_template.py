# -*- coding: utf-8 -*-
"""
Team intake → Account Report Card dataset.

Turns a rep-filled Excel intake workbook into an `account-cards.json` that the
Account Report Card engine (account-cards.html / -standalone.html) can load via the
"Load my data" button. No physician-universe dataset required — everything comes
from the workbook, so any rep on the team can produce their own territory's cards.

Usage:
  python3 build_from_template.py --make-template        # writes territory_template.xlsx (blank + 1 example)
  python3 build_from_template.py my_territory.xlsx       # writes my_territory.account-cards.json
  python3 build_from_template.py my_territory.xlsx out.json

The deep-dive research appendix (KOL papers, training pedigree) is seeded from
whatever links the rep provides; the richer web-researched dossiers are added
centrally per territory (see TEAM-ROLLOUT.md).
"""
import json, os, sys
from collections import defaultdict
from urllib.parse import quote_plus
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.comments import Comment

REGION_AVG_CASE = 18300

# per-indication LITT-eligibility factors (see the reservoir method in the tool)
INDICATION_FACTORS = {"Radiation necrosis": 20, "Recurrent GBM": 12, "Intractable epilepsy": 8, "Mets": 3}
INDICATION_LOGIC = {
    "Radiation necrosis": "symptomatic / steroid-dependent / progressive RN (biopsy + ablation + steroid weaning in one pass)",
    "Recurrent GBM": "deep / eloquent / unresectable recurrence with adequate performance status",
    "Intractable epilepsy": "focal, localizable epilepsy — MTLE, focal cortical dysplasia, hypothalamic hamartoma, PVNH",
    "Mets": "deep / surgically-inaccessible lesions or SRS-failed local recurrence",
}
DEFAULT_FACTOR = 5

LIBRARY = {
    "litt": ["NeuroBlate (Monteris — ours)", "Visualase (Medtronic — competitor)", "None"],
    "robots": ["ROSA (Zimmer Biomet)", "Mazor X (Medtronic)", "ExcelsiusGPS (Globus)", "Cirq arm (Brainlab)",
               "Stealth Autoguide (Medtronic)", "neuromate (Renishaw)", "None", "Unknown — confirm in field"],
    "navigation": ["ClearPoint SmartFrame (MRI-guided targeting)", "Brainlab (Curve / Kick)", "Medtronic StealthStation",
                   "Stryker Q Guidance", "Frameless (AxiEM / mask)", "Leksell / CRW frame", "None", "Unknown — confirm in field"],
    "play_types": ["Develop surgeon", "Crack competitor", "Activate referral", "Defend", "Custom"],
}
RESERVOIR_METHOD = {
    "pool": "Patients coded for this indication in the account's referral area (claims volume).",
    "addressable": "The clinically LITT-appropriate share of the pool, per year — factor differs by indication (editable).",
    "opportunity": f"Addressable × the region's average revenue per case (${REGION_AVG_CASE:,}).",
    "scope": "Total winnable market per year — inclusive of the cases we already win, not incremental. The plan's realistic near-term incremental target is the separate “Annual potential” figure.",
    "factors": INDICATION_FACTORS,
}

# ----- intake schema: sheet -> [(column, help)] --------------------------------
SHEETS = {
    "Accounts": [
        ("rank", "Priority rank (1 = top)"), ("account_name", "e.g. Columbia (NYP)"),
        ("acronym", "Short unique code, e.g. CUMC"), ("health_system", "e.g. NewYork-Presbyterian"),
        ("class", "Installed / Contested / Installing / Pipeline / Competitive"),
        ("posture", "Your one-line posture, e.g. Expand, priority"),
        ("platform", "Semicolon list: NeuroBlate;Visualase;ClearPoint"),
        ("win", "High / Medium / Long-horizon"),
        ("situation", "Free-text account narrative"),
        ("robot", "From the robot library, or blank"), ("navigation", "From the navigation library, or blank"),
        ("mri", "e.g. iMRI / 3T / blank"), ("service_contract", "e.g. active / blank"),
        ("seeg_volume", "SEEG claims/volume (number), or 0"), ("crani_volume", "Tumor+epilepsy craniotomies/yr (number)"),
        ("net_2024", "Net sales 2024 ($)"), ("net_2025", "Net sales 2025 ($)"),
        ("net_2026_ytd", "Net sales 2026 YTD ($)"), ("net_2026_proj", "Full-year 2026 projection ($)"),
        ("cases_logged", "LITT cases logged (3yr)"), ("probes_2024", "Laser probes 2024"),
        ("probes_2025", "Laser probes 2025"), ("probes_2026", "Laser probes 2026"),
        ("business_potential_yr", "Plan's realistic incremental $/yr"), ("incremental_cases", "Plan's incremental cases target"),
        ("trend", "Up / Flat / Down / New / Competitive"),
    ],
    "Surgeons": [
        ("acronym", "Account acronym this surgeon belongs to"), ("name", "Surgeon full name"),
        ("role", "Performer (does LITT) or Target (LITT-naïve)"), ("cases", "LITT cases if a performer, else blank"),
        ("seeg", "SEEG volume (number)"), ("epi_cranio", "Epilepsy craniotomies (number)"),
        ("tumor_cranio", "Tumor craniotomies (number)"), ("wheelhouse", "Short archetype, e.g. SEEG-driven epilepsy ablation"),
        ("kol", "Y if a LITT KOL"), ("hospital_profile_url", "Optional bio link"), ("pubmed_url", "Optional PubMed link"),
    ],
    "Referrers": [
        ("acronym", "Account acronym"), ("name", "Referrer name"), ("indication", "e.g. Epilepsy (DRE) / Mets / Rad-necrosis"),
        ("pool_or_refs", "Patient pool size OR number of referrals (number)"),
    ],
    "Reservoirs": [
        ("acronym", "Account acronym"), ("indication", "Mets / Radiation necrosis / Intractable epilepsy / Recurrent GBM"),
        ("pool", "Coded claims pool (number)"), ("factor_pct", "LITT-eligible % (blank = indication default)"),
    ],
}

# ----- template generation -----------------------------------------------------
def make_template(path):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    hdr_fill = PatternFill("solid", fgColor="14425C"); hdr_font = Font(color="FFFFFF", bold=True, size=10)
    for sheet, cols in SHEETS.items():
        ws = wb.create_sheet(sheet)
        for c, (name, help_) in enumerate(cols, 1):
            cell = ws.cell(1, c, name); cell.fill = hdr_fill; cell.font = hdr_font
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.comment = Comment(help_, "template"); ws.column_dimensions[cell.column_letter].width = max(12, min(30, len(name) + 6))
        ws.freeze_panes = "A2"
    # one worked example so reps see the shape
    ex = wb["Accounts"]
    ex.append([1, "Example Medical Center", "EMC", "Example Health", "Installed", "Expand, priority",
               "NeuroBlate;Visualase", "High", "Fast-growing account; single-surgeon dependency; competitor Visualase in-house.",
               "", "", "", "", 6, 42, 40000, 120000, 210000, 330000, 12, 3, 6, 4, 90000, 6, "Up"])
    for r in [["EMC", "Dr Ada Performer", "Performer", 9, 6, 18, 2, "SEEG-driven epilepsy ablation", "Y", "", ""],
              ["EMC", "Dr Ben Target", "Target", "", 4, 14, 1, "Epilepsy surgery", "N", "", ""],
              ["EMC", "Dr Cy Target", "Target", "", 0, 1, 8, "Neuro-oncology", "N", "", ""]]:
        wb["Surgeons"].append(r)
    for r in [["EMC", "Dr Rae Referrer", "Epilepsy (DRE)", 180], ["EMC", "Dr Sol Referrer", "Mets / Rad-necrosis", 60]]:
        wb["Referrers"].append(r)
    for r in [["EMC", "Intractable epilepsy", 420, ""], ["EMC", "Mets", 500, ""],
              ["EMC", "Radiation necrosis", 70, ""], ["EMC", "Recurrent GBM", 6, ""]]:
        wb["Reservoirs"].append(r)
    # a notes sheet
    notes = wb.create_sheet("READ ME", 0)
    for i, line in enumerate([
        "LITT Account Report Card — territory intake", "",
        "1. Fill one row per account in Accounts; add surgeons, referrers and reservoirs on their tabs (link by acronym).",
        "2. Run:  python3 build_from_template.py  <thisfile>.xlsx", "",
        "3. Open account-cards.html (or -standalone.html), click “Load my data”, choose the generated .json.",
        "4. Everything is editable in the tool; Export saves your edits.", "",
        "Hover any column header for help. Numbers can be left blank (treated as 0).",
        "Reservoir factor_pct blank = indication default (Rad-necrosis 20 · Recurrent GBM 12 · Epilepsy 8 · Mets 3).",
        "The physician deep-dive research/pedigree is added centrally per territory — see TEAM-ROLLOUT.md.",
    ]):
        notes.cell(i + 1, 1, line).font = Font(bold=(i == 0), size=12 if i == 0 else 10)
    notes.column_dimensions["A"].width = 110
    wb.save(path)
    print(f"Wrote {path} — fill it in, then run this script on it.")

# ----- workbook → account-cards.json -------------------------------------------
def _num(v, d=0):
    try: return int(float(v))
    except (TypeError, ValueError): return d

def _rows(ws):
    cols = [c.value for c in ws[1]]
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row and any(v not in (None, "") for v in row):
            yield {cols[i]: row[i] for i in range(len(cols)) if i < len(row)}

def pubmed_name(name):
    parts = str(name).split()
    if len(parts) < 2: return None
    return "https://pubmed.ncbi.nlm.nih.gov/?term=" + quote_plus(f"{parts[-1]} {parts[0][0]}[Author]")

def candidate(row):
    seeg, epi, tum = _num(row.get("seeg")), _num(row.get("epi_cranio")), _num(row.get("tumor_cranio"))
    kol = str(row.get("kol", "")).strip().lower() in ("y", "yes", "true", "1")
    wh = row.get("wheelhouse") or ""
    score = seeg * 3 + epi * 0.5 + tum * 0.35 + (8 if kol else 0)
    if any(k in wh.lower() for k in ("epilepsy", "seeg", "ablation")): score += 5
    assess = "strong" if score >= 20 else "moderate" if score >= 6 else "weak"
    drivers = [{"label": l, "value": v} for l, v in
               (("SEEG implants", seeg), ("epilepsy cranis", epi), ("tumor cranis", tum)) if v]
    if seeg and epi:
        rat = f"Active epilepsy surgeon — {seeg} SEEG implants and {epi} epilepsy craniotomies; SEEG-localized foci convert directly to ablation targets."
    elif epi:
        rat = f"{epi} epilepsy craniotomies — epilepsy volume amenable to LITT conversion."
    elif tum:
        rat = f"{tum} tumor craniotomies — candidate for tumor / metastasis and radiation-necrosis ablation."
    else:
        rat = "Low in-house craniotomy/SEEG signal — confirm case mix and interest in the field."
    if kol: rat += " Published LITT/epilepsy KOL."
    return score, assess, drivers, rat, kol, wh, seeg, epi, tum

def build(path, out):
    wb = openpyxl.load_workbook(path, data_only=True)
    surg = defaultdict(list); refs = defaultdict(list); resv = defaultdict(list)
    for r in _rows(wb["Surgeons"]): surg[r.get("acronym")].append(r)
    for r in _rows(wb["Referrers"]): refs[r.get("acronym")].append(r)
    for r in _rows(wb["Reservoirs"]): resv[r.get("acronym")].append(r)

    accounts = []
    for a in _rows(wb["Accounts"]):
        acr = a.get("acronym")
        if not acr: continue
        plats = [p.strip() for p in str(a.get("platform") or "").replace(",", ";").split(";") if p.strip()]
        comp_bits = []
        if any("visualase" in p.lower() for p in plats): comp_bits.append("Visualase (Medtronic)")
        if any("clearpoint" in p.lower() for p in plats): comp_bits.append("ClearPoint ecosystem (targeting/nav)")
        seeg_v, crani_v = _num(a.get("seeg_volume")), _num(a.get("crani_volume"))
        # reservoirs
        reservoirs = []
        for rr in resv.get(acr, []):
            ind, pool = rr.get("indication"), _num(rr.get("pool"))
            f = _num(rr.get("factor_pct")) or INDICATION_FACTORS.get(ind, DEFAULT_FACTOR)
            reservoirs.append({"indication": ind, "pool": pool, "factor_pct": f,
                               "addressable": round(pool * f / 100.0),
                               "logic": INDICATION_LOGIC.get(ind, "LITT-appropriate share of the coded pool")})
        # universe
        performers, naive, kols = [], [], []
        for s in surg.get(acr, []):
            role = str(s.get("role", "")).strip().lower()
            sc, assess, drivers, rat, kol, wh, seeg, epi, tum = candidate(s)
            if kol: kols.append(s.get("name"))
            if role.startswith("perf"):
                performers.append({"name": s.get("name"), "cases": _num(s.get("cases")), "kol": kol,
                                   "wheelhouse": wh, "specialty": "", "seeg": seeg, "npi": None})
            else:
                naive.append({"name": s.get("name"), "seeg": seeg, "epi_cranio": epi, "tumor_cranio": tum,
                              "wheelhouse": wh, "kol": kol, "score": round(sc, 1), "drivers": drivers,
                              "rationale": rat, "assessment": assess, "npi": None})
        naive.sort(key=lambda n: -n["score"])
        referrers = [{"name": r.get("name"), "indication": r.get("indication"),
                      "cases": None, "pool": _num(r.get("pool_or_refs"))} for r in refs.get(acr, [])]
        # header
        header = {"account_type": a.get("class"), "does_litt": _num(a.get("cases_logged")) > 0 or "NeuroBlate" in " ".join(plats),
                  "our_system": "NeuroBlate (Monteris — ours)" if any("neuroblate" in p.lower() for p in plats) else "—",
                  "competitor_system": ", ".join(comp_bits) or "None confirmed",
                  "mri": a.get("mri") or "", "robot": a.get("robot") or "", "navigation": a.get("navigation") or "",
                  "does_seeg": seeg_v > 0, "seeg_volume": seeg_v, "crani_over_50": crani_v >= 50, "crani_volume": crani_v,
                  "service_contract": a.get("service_contract") or ""}
        business = {"net_by_year": {"2024": _num(a.get("net_2024")), "2025": _num(a.get("net_2025")),
                                    "2026_ytd": _num(a.get("net_2026_ytd")), "2026_proj": _num(a.get("net_2026_proj"))},
                    "probes_by_year": {"2024": _num(a.get("probes_2024")), "2025": _num(a.get("probes_2025")),
                                       "2026": _num(a.get("probes_2026"))},
                    "region_avg_case": REGION_AVG_CASE, "cases_logged": _num(a.get("cases_logged")),
                    "business_potential_yr": _num(a.get("business_potential_yr")),
                    "incremental_cases": _num(a.get("incremental_cases")), "trend": a.get("trend") or "Flat", "sku_mix": {}}
        # SWOT + strategy seeds (self-contained, from the workbook)
        swot = seed_swot(header, performers, naive, reservoirs, business, plats)
        strategy = seed_strategy(naive, plats, reservoirs, refs.get(acr, []))
        appendix = seed_appendix(performers, naive, a.get("health_system") or "")
        accounts.append({
            "rank": _num(a.get("rank"), 99), "name": a.get("account_name"), "acronym": acr,
            "system": a.get("health_system"), "class": a.get("class"), "posture": a.get("posture"),
            "platform": plats, "win": a.get("win"), "situation": a.get("situation") or "",
            "header": header, "business": business, "reservoirs": reservoirs,
            "universe": {"performers": performers, "naive_targets": naive, "referrers": referrers, "kols": kols},
            "swot": swot, "strategy": strategy, "appendix": appendix,
        })
    accounts.sort(key=lambda c: c["rank"])
    data = {"meta": {"title": "LITT Account Report Cards", "generated": "", "note": "Built from territory intake workbook.", "enriched": []},
            "territory": {"region_avg_case": REGION_AVG_CASE}, "library": LIBRARY, "reservoir_method": RESERVOIR_METHOD,
            "accounts": accounts}
    with open(out, "w") as f: json.dump(data, f, indent=1)
    print(f"Wrote {out} — {len(accounts)} accounts. Open the tool and use “Load my data”.")

def seed_swot(h, perf, naive, reservoirs, biz, plats):
    S, W, O, T = [], [], [], []
    if h["does_seeg"]: S.append(f"Active SEEG program ({h['seeg_volume']}) — SEEG-localized foci convert directly to ablation targets.")
    if h["crani_over_50"]: S.append(f"High craniotomy volume ({h['crani_volume']}+) — large in-house conversion pool.")
    for r in sorted(reservoirs, key=lambda x: -x["addressable"])[:2]:
        if r["addressable"] >= 10: O.append(f"{r['indication']}: ~{r['addressable']} addressable/yr of {r['pool']} pool — under-penetrated.")
    active = [p for p in perf if p["cases"] > 0]
    if len(active) == 1: W.append("Single-surgeon dependency — volume collapses to zero on one departure. Develop a second adopter.")
    if any("visualase" in p.lower() for p in plats): W.append("Competitive laser in-house (Visualase, Medtronic) — split platform, capital-standardization risk.")
    if any("clearpoint" in p.lower() for p in plats): W.append("ClearPoint targeting/navigation ecosystem in-house — capital-standardization pressure.")
    if biz["trend"] == "Down": T.append("Revenue trending down — diagnose whether clinical, capital, or relationship-driven.")
    if not S: S.append("— add a strength —")
    if not W: W.append("— add a weakness —")
    if not O: O.append("— add an opportunity —")
    if not T: T.append("— add a threat —")
    return {"strengths": S, "weaknesses": W, "opportunities": O, "threats": T}

def seed_strategy(naive, plats, reservoirs, referrer_rows):
    plays = []
    if naive:
        t = naive[0]; wh = t.get("wheelhouse") or ""
        plays.append({"type": "Develop surgeon", "target": t["name"], "why": t["rationale"],
                      "assessment": t["assessment"], "drivers": t["drivers"],
                      "objective": f"Convert {t['name']} from LITT-naïve to a first case within two quarters.",
                      "tactics": [f"Proctored first case: pair {t['name']} with a matched NeuroBlate KOL proctor.",
                                  "Reference-site visit to observe a live NeuroBlate case at a nearby high-volume account.",
                                  "Joint case-selection clinic: co-review their SEEG/craniotomy candidates for ablation suitability.",
                                  "Value-analysis (VAC) support to clear capital/committee hurdles.",
                                  f"Carry the indication evidence pack matched to their wheelhouse{f' ({wh})' if wh else ''}."]})
    if any("clearpoint" in p.lower() for p in plats):
        plays.append({"type": "Crack competitor", "target": "ClearPoint footprint",
                      "objective": "Displace or coexist by exploiting ClearPoint's ablation-size ceiling on tumor / RN work.",
                      "tactics": ["Position NeuroBlate for the tumor & radiation-necrosis book ClearPoint serves poorly.",
                                  "Quantify the mets/RN reservoir and bring the LITT+SRT and steroid-reduction evidence.",
                                  "Target tumor & rad-onc referrers, not just the implanting surgeon."]})
    if any("visualase" in p.lower() for p in plats):
        plays.append({"type": "Crack competitor", "target": "Visualase footprint",
                      "objective": "Convert a Visualase-trained surgeon using a live in-territory reference.",
                      "tactics": ["Leverage a nearby Visualase→NeuroBlate convert as social proof.",
                                  "Contrast real-time thermal monitoring & larger single-trajectory ablation volume.",
                                  "Trial-in-value-analysis motion where a system is already under review."]})
    big = sorted(reservoirs, key=lambda x: -x["addressable"])[:1]
    if big and big[0]["addressable"] >= 10:
        r = big[0]; tops = [x.get("name") for x in referrer_rows][:3]
        refs_str = (" (" + ", ".join(t for t in tops if t) + ")") if any(tops) else ""
        plays.append({"type": "Activate referral", "target": f"{r['indication']} referral base",
                      "objective": f"Convert the {r['indication']} pool (~{r['addressable']} addressable of {r['pool']}) into logged cases.",
                      "tactics": [f"Prime the top referrers{refs_str} with the {r['indication']}-matched evidence pack.",
                                  "Build tumor-board / epilepsy-conference presence so LITT is named at case selection.",
                                  "Close the referral loop back to the performing surgeon and track conversion."]})
    return plays

def seed_appendix(perf, naive, system):
    out = []
    for role, lst in (("Performer", perf), ("Development target", naive)):
        for p in lst:
            out.append({"physician": p["name"], "role": role, "npi": None, "grade": None, "score": None,
                        "title": "", "bio": "", "identity": "", "facility": system, "archetype": p.get("wheelhouse", ""),
                        "themes": [], "rationale": "",
                        "candidacy": ({"assessment": p.get("assessment"), "rationale": p.get("rationale"),
                                       "drivers": p.get("drivers")} if role == "Development target" else None),
                        "medscout": None, "profile_url": None, "scholar_url": None,
                        "pubmed_url": pubmed_name(p["name"]), "other_url": None, "enriched": False, "papers": [], "training": None})
    return out

if __name__ == "__main__":
    args = [a for a in sys.argv[1:]]
    if "--make-template" in args:
        make_template(os.path.join(os.path.dirname(__file__), "territory_template.xlsx"))
    elif args:
        src = args[0]
        dst = args[1] if len(args) > 1 else os.path.splitext(src)[0] + ".account-cards.json"
        build(src, dst)
    else:
        print(__doc__)
