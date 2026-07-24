# -*- coding: utf-8 -*-
"""
Build the LITT physician-profile dataset.
Inputs : Total_Docs (master claims), Sales_NE, Probes, Patient_Counts, + curated account_intel
Outputs: physician-profiles.json  (embedded into the dashboard + source for the Excel workbook)
"""
import openpyxl, json, re
from collections import defaultdict
import account_intel as AI

U = "/root/.claude/uploads/a0b180ed-326e-587f-bb74-bb43186df4d1/"
FRAC = AI.ADDRESSABLE_FRACTION            # 0.05 blended addressable rate (legacy)
# Per-pool addressable rates (editable). Epilepsy uses ONE pool per pathway (largest);
# oncology pools are distinct populations and add.
R_INTR=0.05    # intractable-epilepsy panel -> MTLE/HH/PVNH/FCD/insular/CC
R_EPICR=0.20   # open epilepsy craniotomy -> convert to LITT
R_SEEG=0.25    # SEEG-localized foci -> ablation (strongest precursor)
R_METS=0.05    # Mets/RN pool -> brain-metastasis + radiation-necrosis ablation
R_SRS=0.03     # SRS pool -> post-SRS radiation necrosis needing LITT
R_TUMOR=0.08   # tumor craniotomy -> glioma/HGG deep/difficult resection
DRE_RATE = 0.30                           # 25-40% of epilepsy is drug-resistant (ASSFN/Monteris brief)
ELOQUENT_RATE = 0.49                      # up to 49% of tumors in/near eloquent areas (AANS/CNS brief)
DRE_SURGERY_TODAY = 0.04                  # only ~4% of eligible DRE patients get surgery annually

def num(x):
    try: return float(x)
    except: return 0.0

# ---------- load master ----------
wb = openpyxl.load_workbook(U+"83d59de0-Total_Docs_20260722173008.xlsx", read_only=True, data_only=True)
ws = wb["Sheet1"]; rows = list(ws.iter_rows(values_only=True)); wb.close()
data = rows[1:]

# column groups (0-indexed). higher of a same-named pair = performing, lower = referring
EPI_CR=[14,15,16]; TUM_CR=[17,18]; LITT=[19,20]; SRS=[21]; METS=[22,23]
CPT=[24,25]; SEEG=[26,27,28]; INTR=[29,30]
def perf(r,ix): return max(num(r[i]) for i in ix)
def ref(r,ix):  return min(num(r[i]) for i in ix)

# ---------- name-based plan lookups ----------
SUFFIX={'jr','sr','ii','iii','iv','md','do','phd','msc','mbbs','facs','mba'}
def norm(n):
    n=re.sub(r'^(dr\.?\s+)','',str(n).strip(),flags=re.I)
    n=re.sub(r'[.,]',' ',n)
    toks=[t for t in n.lower().split() if t and t not in SUFFIX]
    if len(toks)>=2:                      # key on first + last token (drop middle initials)
        return toks[0]+" "+toks[-1]
    return " ".join(toks)

ORG_RE=re.compile(r'\b(hospital|health|healthcare|medical|medicine|clinic|center|centre|institute|'
    r'physician|associate|group|university|college|oncology|radiology|cardiology|neurology|'
    r'pediatric|children|care|partner|comprehensive|memorial|oral|maxillofacial|llc|'
    r'inc|llp|department|division|foundation|system|service|imaging|cancer|regional|community|'
    r'county|network|practice|dept|ambulatory|surgical|orthopedic|rehabilitation|urology|'
    r'anesthesia|pathology|laborator|lab|labs|pharmacy|therapy|wellness|nhpp|roswell|diagnostic|'
    r'consultant|specialist|professional|corp|trustees|infirmary|clinica)s?\b', re.I)
def is_org(name):
    s=str(name or "")
    if ORG_RE.search(s): return True
    if any(ch.isdigit() for ch in s): return True
    toks=s.split()
    return len(toks)<2 or len(toks)>4

# named_users: norm-name -> dict(account, platform, cases, role)
named_users, plan_referrers, plan_targets = {}, {}, {}
acct_by_system = {}
for a in AI.ACCOUNTS:
    acct_by_system[a["system"].lower()] = a
    competitive = a["class"] == "Competitive"
    comp_plat = (AI.CLEARPOINT if AI.CLEARPOINT in a["platform"]
                 else AI.VISUALASE if AI.VISUALASE in a["platform"] else AI.UNVERIFIED)
    for (s,c) in a["surgeons"]:
        if competitive:
            plat, role = comp_plat, "Competitor LITT user (field-confirmed)"
        else:  # Installed / Installing / Pipeline / Contested with NeuroBlate present
            plat, role = AI.NEUROBLATE, "NeuroBlate user (field-confirmed)"
        named_users.setdefault(norm(s), dict(account=a, platform=plat, cases=c, role=role))
    for (nm,cnt) in a.get("epilepsy_referrers",[])+a.get("necrosis_referrers",[]):
        plan_referrers.setdefault(norm(nm), (a, cnt))
    for (r,ind,c) in a["referrers"]:
        plan_referrers.setdefault(norm(r), (a, c))
    for t in a["user_targets"]:
        plan_targets.setdefault(norm(t), a)

# confirmed referrers: physicians the territory plan logs as having SENT cases to our surgeons
confirmed_ref = defaultdict(list)
for a in AI.ACCOUNTS:
    for (nm,ind,cases) in a["referrers"]:
        confirmed_ref[norm(nm)].append(dict(account=a["name"], accountAcr=a["acronym"],
                                             indication=ind, cases=cases))

# competitor users from prospects/leakage (outside installed base)
for (acct,user,litt,epi,seeg,pool,plat) in AI.PROSPECTS:
    if user and user!="— none —":
        named_users.setdefault(norm(user), dict(account=None, platform=plat, cases=litt,
                               role="Competitor / prospect LITT user", prospectAccount=acct))

# ---------- classify each record ----------
providers=[]; facilities=[]
GENERIC={"health","system","medical","center","centre","hospital","university","medicine",
    "healthcare","cancer","memorial","regional","community","institute","clinic","partners",
    "group","childrens","children","physician","physicians","meridian","presbyterian"}
def account_for(systemstr):
    s=(systemstr or "").lower()
    for key,a in acct_by_system.items():
        if key and (key in s or s in key): return a
    # distinctive-token match (exclude generic hospital-system words)
    for a in AI.ACCOUNTS:
        toks=[t for t in re.split(r'[ ,]',a["system"].lower()) if len(t)>=5 and t not in GENERIC]
        if any(t in s for t in toks): return a
    return None

for r in data:
    name=r[0]; spec=str(r[4] or ""); soc=str(r[5] or ""); npi=r[6]
    state=r[11]; addr=r[12] if False else r[10]; sysstr=str(r[13] or "")
    rec = dict(
        name=name, npi=(str(npi) if npi else ""), specialty=spec, socType=soc,
        state=str(r[11] or ""), address=str(r[10] or ""), phone=str(r[9] or ""),
        email=str(r[3] or ""), affiliations=str(r[12] or ""), system=sysstr,
        crm=str(r[1] or ""), medscout=str(r[48] or ""),
        litt_perf=int(perf(r,LITT)), litt_ref=int(ref(r,LITT)),
        epi_cranio=int(perf(r,EPI_CR)), epi_cranio_ref=int(ref(r,EPI_CR)),
        tumor_cranio=int(perf(r,TUM_CR)), tumor_cranio_ref=int(ref(r,TUM_CR)),
        srs=int(perf(r,SRS)), mets_rn=int(perf(r,METS)), mets_rn_ref=int(ref(r,METS)),
        cpt_cranio=int(perf(r,CPT)), seeg=int(perf(r,SEEG)),
        intractable=int(perf(r,INTR)), intractable_ref=int(ref(r,INTR)),
    )
    if soc.lower()=="hospital" or is_org(name):
        rec["entityType"]="Organization"
        facilities.append(rec); continue

    nm=norm(name)
    a_named=None; platform=None; planRole="—"
    nu=named_users.get(nm)
    if nu:
        platform=nu["platform"]; planRole=nu["role"]; a_named=nu["account"]
        if nu.get("prospectAccount"): rec["prospectAccount"]=nu["prospectAccount"]
    elif nm in plan_targets:
        planRole="Named conversion target"; a_named=plan_targets[nm]
    elif nm in plan_referrers:
        planRole="Named referrer (feeds the funnel)"; a_named=plan_referrers[nm][0]

    acct = a_named or account_for(sysstr)

    # cohort — a field-confirmed named user is our/competitor customer even when the
    # claims LITT count is 0 (claims undercount at academic centers, per the plan).
    # Every other LITT performer is "Unverified" because claims cannot prove the platform.
    litt=rec["litt_perf"]
    is_ns = "Neurological Surgery" in spec
    is_named_user = nu is not None and "user" in nu["role"].lower()
    if is_named_user and platform==AI.NEUROBLATE:
        cohort="LITT — Our Equipment (NeuroBlate)"
        if litt==0: rec["claimsUndercount"]=True
    elif is_named_user and platform not in (None, AI.NEUROBLATE):
        cohort="LITT — Competitor Equipment"
        if litt==0: rec["claimsUndercount"]=True
    elif litt>0 and is_ns:
        # LITT performed by a neurosurgeon, platform not field-confirmed
        platform=AI.UNVERIFIED; cohort="LITT — Unverified Platform"
    elif is_ns and (rec["tumor_cranio"]>0 or rec["epi_cranio"]>0):
        cohort="LITT-Naïve Craniotomy Surgeon"; platform="—"
    elif (rec["intractable"]>0 or rec["mets_rn"]>0 or rec["srs"]>0 or rec["litt_ref"]>0
          or rec["litt_perf"]>0 or rec["tumor_cranio_ref"]>0 or rec["epi_cranio_ref"]>0):
        cohort="Referring Clinician"; platform="—"
    else:
        cohort="Other / Low-signal"; platform="—"

    # ---------- potential-volume model (all indication pools, one per pathway) ----------
    intr=rec["intractable"]; mets=rec["mets_rn"]; tum=rec["tumor_cranio"]
    srs=rec["srs"]; epc=rec["epi_cranio"]; sg=rec["seeg"]
    # epilepsy: ONE pool per pathway (largest signal) to avoid double-counting the same patients
    epi_opts={"intractable":round(intr*R_INTR),"epi_cranio":round(epc*R_EPICR),"seeg":round(sg*R_SEEG)}
    epi_driver=max(epi_opts,key=lambda k:epi_opts[k]); epi_addr=epi_opts[epi_driver]
    # oncology: distinct populations -> they add
    onc_mets=round(mets*R_METS); onc_srs=round(srs*R_SRS); onc_tum=round(tum*R_TUMOR)
    onc_addr=onc_mets+onc_srs+onc_tum
    addressable_total=epi_addr+onc_addr
    eloquent_tumors=round(tum*ELOQUENT_RATE)
    untapped=max(0, addressable_total-litt)
    # confirmed referrer — proven to have sent cases to our surgeons
    cr = confirmed_ref.get(nm)
    if cr:
        rec["confirmedReferrals"]=cr
        rec["confirmedCases"]=sum(x["cases"] for x in cr)
        if cohort in ("Other / Low-signal","Referring Clinician"):
            cohort="Referring Clinician"

    # dominant pathway for "evidence to carry"
    if cohort=="LITT-Naïve Craniotomy Surgeon":
        pathway="onc" if rec["tumor_cranio"]>=rec["epi_cranio"] else "epilepsy"
    else:
        pathway="epilepsy" if epi_addr>=onc_addr else "onc"
    rec.update(
        pathway=pathway,
        cohort=cohort, platform=platform, planRole=planRole,
        account=(acct["name"] if acct else rec.get("prospectAccount","")),
        accountAcr=(acct["acronym"] if acct else ""),
        model=dict(
            intractable_pool=intr, epi_cranio_pool=epc, seeg_pool=sg,
            mets_rn_pool=mets, srs_pool=srs, tumor_cranio_pool=tum,
            dre_estimate=round(intr), eloquent_tumors=eloquent_tumors,
            epi_addressable=epi_addr, epi_driver=epi_driver, epi_options=epi_opts,
            onc_mets_addr=onc_mets, onc_srs_addr=onc_srs, onc_tumor_addr=onc_tum, onc_addressable=onc_addr,
            addressable_litt_yr=addressable_total, litt_done=litt, untapped_litt_yr=untapped,
            rates=dict(intractable=R_INTR, epi_cranio=R_EPICR, seeg=R_SEEG, mets=R_METS, srs=R_SRS, tumor=R_TUMOR),
        ),
    )
    providers.append(rec)

# ---------- dedupe providers by NPI (same person, multiple site rows) ----------
def sig(p): return (p["litt_perf"]+p["epi_cranio"]+p["tumor_cranio"]+p["mets_rn"]
                    +p["intractable"]+p["srs"]+p["seeg"])
by_npi={}; noid=[]
for p in providers:
    k=p["npi"].strip()
    if not k: noid.append(p); continue
    if k not in by_npi or sig(p)>sig(by_npi[k]): by_npi[k]=p
providers=list(by_npi.values())+noid

# ---------- attach research/citation profiles ----------
def normName(n):
    n=re.sub(r'^(dr\.?\s+)','',str(n).strip(),flags=re.I); n=re.sub(r'[.,]',' ',n)
    t=[x for x in n.lower().split() if x and x not in SUFFIX]
    return (t[0]+" "+t[-1]) if len(t)>=2 else " ".join(t)
def load_research():
    idx={}
    for path in ("research_raw.jsonl","tools/physician-profiles/research_raw.jsonl",
                 "/home/user/LITTLibrary/tools/physician-profiles/research_raw.jsonl"):
        try:
            for line in open(path):
                line=line.strip()
                if not line: continue
                r=json.loads(line); idx[normName(r["name"])]=r
            if idx: break
        except FileNotFoundError: continue
    return idx
def load_recent():
    idx={}
    for path in ("research_recent.jsonl","tools/physician-profiles/research_recent.jsonl",
                 "/home/user/LITTLibrary/tools/physician-profiles/research_recent.jsonl"):
        try:
            for line in open(path):
                line=line.strip()
                if not line: continue
                r=json.loads(line); idx[normName(r["name"])]=r.get("recent_papers",[])
            if idx: break
        except FileNotFoundError: continue
    return idx
RESEARCH=load_research()
RECENT=load_recent()
n_research=0; n_recent=0
for p in providers:
    r=RESEARCH.get(normName(p["name"]))
    if r: p["research"]=r; n_research+=1
    rp=RECENT.get(normName(p["name"]))
    if rp and p.get("research"): p["research"]["recent_papers"]=rp; n_recent+=1

# ---------- indication "wheelhouse" (triangulate claims + research) ----------
EPI_KEYS={"mtle","hh","pvnh","fcd","insular","cc","cav"}
def wheelhouse(p):
    m=p["model"]; R=p.get("research") or {}
    sig=R.get("signals") or {}
    themes=(" ".join(R.get("themes") or [])+" "+(R.get("identity") or "")+" "
            +" ".join(kp.get("topic","") for kp in (R.get("key_papers") or []))
            +" "+" ".join(kp.get("title","") for kp in (R.get("key_papers") or []))).lower()
    def has(*subs): return any(s in themes for s in subs)
    intr=m["intractable_pool"]; mets=m["mets_rn_pool"]; tum=m["tumor_cranio_pool"]; srs=m["srs_pool"]
    epi_cr=p.get("epi_cranio",0); litt=p["litt_perf"]; seeg=p.get("seeg",0)
    epi_or = intr>0 or epi_cr>0 or seeg>0 or sig.get("seeg") or sig.get("epilepsy_surgery")
    onc_or = mets>0 or tum>0 or srs>0 or sig.get("glioma") or sig.get("brain_mets") or sig.get("radiation_necrosis")
    ind={}
    def add(key,label,pw,pts,driver):
        if pts<=0: return
        if key not in ind: ind[key]=[0.0,set(),label,pw]
        ind[key][0]+=pts; ind[key][1].add(driver)
    # ---- epilepsy: SEEG/intracranial-EEG is the funnel into deep-focus ablation ----
    if sig.get("seeg"):
        add("mtle","MTLE","epi",32,"research"); add("pvnh","PVNH / heterotopia","epi",22,"research")
        add("fcd","Focal cortical dysplasia","epi",18,"research"); add("hh","Hypothalamic hamartoma","epi",12,"research")
        add("insular","Insular epilepsy","epi",12,"research")
    if seeg>0:
        add("mtle","MTLE","epi",min(18,seeg*3),"practice"); add("pvnh","PVNH / heterotopia","epi",min(12,seeg*2),"practice")
        add("fcd","Focal cortical dysplasia","epi",min(10,seeg*2),"practice")
    if sig.get("epilepsy_surgery"): add("mtle","MTLE","epi",15,"research")
    if sig.get("litt") and epi_or: add("mtle","MTLE","epi",18,"research")
    if intr>0:
        add("mtle","MTLE","epi",min(46,intr/15.0),"pool"); add("hh","Hypothalamic hamartoma","epi",min(10,intr/80.0),"pool")
        add("pvnh","PVNH / heterotopia","epi",min(8,intr/100.0),"pool")
    if litt>0 and epi_or: add("mtle","MTLE","epi",12,"practice")
    if has("mesial temporal","mtle","amygdalohippocamp","temporal lobe epilep","slah"): add("mtle","MTLE","epi",30,"research")
    if has("hypothalamic hamartoma","hamartoma"): add("hh","Hypothalamic hamartoma","epi",45,"research")
    if has("heterotopia","periventricular","nodular"): add("pvnh","PVNH / heterotopia","epi",42,"research")
    if has("cortical dysplasia","fcd"): add("fcd","Focal cortical dysplasia","epi",38,"research")
    if has("insular"): add("insular","Insular epilepsy","epi",42,"research")
    if has("callosotomy"): add("cc","Corpus callosotomy","epi",40,"research")
    if has("cavernous"): add("cav","Cavernous malformation","epi",35,"research")
    # ---- neuro-oncology ----
    if mets>0: add("mets","Brain metastases","onc",min(42,mets/45.0),"pool"); add("rn","Radiation necrosis","onc",min(14,mets/120.0),"pool")
    if srs>0: add("rn","Radiation necrosis","onc",min(26,srs/16.0),"pool"); add("mets","Brain metastases","onc",min(10,srs/40.0),"pool")
    if sig.get("brain_mets"): add("mets","Brain metastases","onc",30,"research")
    if sig.get("radiation_necrosis"): add("rn","Radiation necrosis","onc",34,"research")
    if has("metasta"): add("mets","Brain metastases","onc",20,"research")
    if has("radiation necrosis"): add("rn","Radiation necrosis","onc",26,"research")
    elif has("necrosis"): add("rn","Radiation necrosis","onc",14,"research")
    if tum>0: add("hgg","Glioma / HGG","onc",min(24,tum/4.0),"pool")
    if sig.get("glioma"): add("hgg","Glioma / HGG","onc",22,"research")
    if has("glioblastoma","gbm","high-grade glioma","malignant glioma","glioma"):
        if has("recurrent"): add("rgbm","Recurrent GBM","onc",28,"research")
        add("hgg","Glioma / HGG","onc",22,"research")
    if has("lower-grade glioma","low-grade glioma","lgg","idh-mutant","idh mutant","idh wild"): add("lgg","Lower-grade glioma","onc",30,"research")
    if litt>0 and onc_or:
        add("mets","Brain metastases","onc",8,"practice"); add("hgg","Glioma / HGG","onc",8,"practice")
    # build
    def whytxt(key,drv):
        b=[]
        if "research" in drv: b.append("research/citation signal")
        if "practice" in drv: b.append("performs it (claims)")
        if "pool" in drv:
            if key in EPI_KEYS and intr: b.append(f"{intr:,} intractable-epilepsy pool")
            elif key=="mets" and mets: b.append(f"{mets:,} mets/RN pool")
            elif key=="rn" and (srs or mets): b.append(f"{(srs or mets):,} SRS/necrosis feeder")
            elif key in ("hgg","rgbm","lgg") and tum: b.append(f"{tum} tumor craniotomies")
        return " · ".join(b)
    out=[]
    for k,(sc,drv,label,pw) in ind.items():
        sc=min(100,round(sc))
        if sc<20: continue
        tier="Strong" if sc>=60 else "Moderate" if sc>=38 else "Emerging"
        out.append(dict(key=k,label=label,pathway=pw,score=sc,tier=tier,drivers=sorted(drv),why=whytxt(k,drv)))
    out.sort(key=lambda x:-x["score"]); out=out[:6]
    arche=""
    if out:
        pw=out[0]["pathway"]; names=[o["label"] for o in out[:3]]
        if pw=="epi":
            arche="SEEG-driven epilepsy ablation" if (sig.get("seeg") or seeg>0) else "Epilepsy ablation"
        else:
            arche="Neuro-oncology ablation"
        arche+=" — "+", ".join(names)
    return dict(archetype=arche, indications=out)

n_wheel=0
for p in providers:
    w=wheelhouse(p)
    if w["indications"]: p["wheelhouse"]=w; n_wheel+=1

# ---------- opportunity score: rebuilt around total untapped + strategic bonuses ----------
GRADE_BOOST={"A":14,"B":7,"C":2,"D":0}
def score(p):
    s = p["model"]["untapped_litt_yr"]           # total untapped market across all pools (base)
    s += min(15, p["litt_perf"]*1.5)             # proven LITT operator can scale
    if p["planRole"].startswith("NeuroBlate"): s+=15   # our installed customer
    if p["planRole"].startswith("Named"): s+=8         # named plan target
    if "Competitor" in p.get("cohort","") or "Unverified" in p.get("cohort",""): s+=6  # conversion/displacement
    if p.get("confirmedReferrals"): s+=10+3*p.get("confirmedCases",0)
    if p.get("research"): s+=GRADE_BOOST.get(p["research"]["litt_relevance"]["grade"],0)
    return round(s,1)
for p in providers: p["oppScore"]=score(p)

# ---------- tap into the LITT Library (database.json) ----------
EPI_IND={"mtle","hypothalamic_hamartoma","focal_epilepsy","corpus_callosotomy"}
def load_library():
    for path in ("database.json","/home/user/LITTLibrary/database.json","../../database.json"):
        try:
            L=json.load(open(path)); break
        except Exception: L=None
    if not L: return [], {}
    indmap=L.get("taxonomy",{}).get("indications",{})
    out=[]
    for it in L.get("items",[]):
        inds=it.get("indications",[]) or []
        pw=[]
        if any(i in EPI_IND for i in inds): pw.append("epilepsy")
        if any(i not in EPI_IND for i in inds): pw.append("onc")
        out.append(dict(
            id=it.get("id"), title=it.get("title",""), citation=it.get("citation",""),
            date=it.get("date",""), url=it.get("url",""), venue=it.get("venue",""),
            studyDesign=it.get("studyDesign",""), evidenceStrength=it.get("evidenceStrength",""),
            indications=[indmap.get(i,i) for i in inds], indKeys=inds,
            clinicalImpact=it.get("clinicalImpactScore",0),
            businessImpact=it.get("littBusinessImpact",0),
            direction=it.get("littBusinessDirection","neutral"),
            bottomLine=it.get("clinicalBottomLine",""), whyMatters=it.get("whyMatters",""),
            status=it.get("status",""), pathways=pw,
        ))
    out.sort(key=lambda x:(x["date"], x["clinicalImpact"]), reverse=True)
    meta=dict(count=len(out), engine=L.get("engine",""), lastUpdated=L.get("lastUpdated",""),
              dateRange=[min((x["date"] for x in out),default=""),max((x["date"] for x in out),default="")])
    return out, meta
LIBRARY, LIBMETA = load_library()

# ---------- assemble output ----------
def cohort_counts(lst):
    c=defaultdict(int)
    for p in lst: c[p["cohort"]]+=1
    return dict(c)

out = dict(
    meta=dict(
        generated="2026-07-22", source="Medscout claims (Total_Docs), Monteris NE sales & probes, "
        "NeuroBlate NE Territory Plan, ASSFN/AANS-CNS position statements, LAANTERN literature",
        region="Northeast (Philadelphia to Maine)",
        n_providers=len(providers), n_facilities=len(facilities),
        addressable_fraction=FRAC, dre_rate=DRE_RATE, eloquent_rate=ELOQUENT_RATE,
        dre_surgery_today=DRE_SURGERY_TODAY,
    ),
    territory=AI.TERRITORY,
    cohortCounts=cohort_counts(providers),
    providers=providers,
    facilities=facilities,
    accounts=AI.ACCOUNTS,
    leakage=[dict(account=a,claims=c,ours=o,gap=g,play=p,platform=pl) for (a,c,o,g,p,pl) in AI.COMPETITIVE_LEAKAGE],
    prospects=[dict(account=a,user=u,litt=l,epilepsy=e,seeg=s,necrosis_pool=n,platform=pl) for (a,u,l,e,s,n,pl) in AI.PROSPECTS],
    topTargets=[dict(name=n,affiliation=af,motion=mo,litt=l,epi=e,tumor=t,coi=c) for (n,af,mo,l,e,t,c) in AI.TOP_USER_TARGETS],
    evidence=[dict(pathway=p,title=t,cite=c,finding=f,supports=s,strength=st,tags=tg,new=nw)
              for (p,t,c,f,s,st,tg,nw) in AI.EVIDENCE],
    growthLevers=AI.GROWTH_LEVERS, growthLeversNote=AI.GROWTH_LEVERS_NOTE,
    library=LIBRARY, libraryMeta=LIBMETA,
    researchMeta=dict(count=n_research, generated="2026-07-23",
        note="Research profiles compiled from public web sources (Google Scholar, institutional pages, journal/PubMed listings, ResearchGate) via automated search. LITT-relevance grade A-D is an editorial rubric: A=direct LITT/ablation or SEEG-guided epilepsy ablation research; B=convertible epilepsy/stereotactic/neuro-onc surgery; C=limited; D=little/none. Verify against primary sources before acting."),
    platforms=dict(neuroblate=AI.NEUROBLATE, visualase=AI.VISUALASE, clearpoint=AI.CLEARPOINT, unverified=AI.UNVERIFIED),
)

# drop true no-signal rows from the profile set (kept in the source count)
low = [p for p in providers if p["cohort"]=="Other / Low-signal" and not p.get("confirmedReferrals")]
lowset=set(id(x) for x in low)
out["providers"] = [p for p in providers if id(p) not in lowset]
out["meta"]["excluded_low_signal"] = len(low)
# strip empty-string keys to shrink payload
for p in out["providers"]+out["facilities"]:
    for k in [k for k,v in list(p.items()) if v==""]:
        del p[k]

with open("physician-profiles.json","w") as f:
    json.dump(out,f,separators=(",",":"))

# ---------- console summary ----------
print("providers:",len(providers)," facilities:",len(facilities))
print("cohorts:")
for k,v in sorted(out["cohortCounts"].items(),key=lambda x:-x[1]): print(f"  {v:5} {k}")
tot_unt=sum(p["model"]["untapped_litt_yr"] for p in providers)
print("total untapped LITT/yr (addressable):",tot_unt)
print("providers w/ untapped>=10:",sum(1 for p in providers if p["model"]["untapped_litt_yr"]>=10))
print("top 12 by oppScore:")
for p in sorted(providers,key=lambda d:-d["oppScore"])[:12]:
    print(f"  {p['oppScore']:6}  {str(p['name'])[:24]:25} {p['cohort'][:34]:35} untap={p['model']['untapped_litt_yr']}")
