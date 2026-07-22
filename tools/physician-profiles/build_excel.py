# -*- coding: utf-8 -*-
"""Build LITT_Physician_Profiles.xlsx — multi-tab targeting workbook."""
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, NamedStyle
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

d = json.load(open("physician-profiles.json"))
P = d["providers"]; F=d["facilities"]; META=d["meta"]

# palette (LITT Library dark→print-friendly navy/teal)
NAVY="0D1B2A"; BLUE="1B3A5F"; TEAL="14B8A6"; CYAN="2AD4FF"; INK="1F2937"; LT="EEF3F8"
def fill(c): return PatternFill("solid", fgColor=c)
H = Font(bold=True, color="FFFFFF", size=10, name="Calibri")
TITLE = Font(bold=True, color=NAVY, size=16, name="Calibri")
SUB = Font(color="475569", size=10, italic=True, name="Calibri")
BOLD = Font(bold=True, color=INK, name="Calibri")
thin = Side(style="thin", color="D5DEE8"); BORD = Border(thin,thin,thin,thin)

wb = openpyxl.Workbook()

def style_header(ws, row, ncols, color=BLUE):
    for c in range(1,ncols+1):
        cell=ws.cell(row=row,column=c); cell.fill=fill(color); cell.font=H
        cell.alignment=Alignment(horizontal="center",vertical="center",wrap_text=True)
        cell.border=BORD

def write_table(ws, headers, rows, start=1, zebra=True, color=BLUE, name=None):
    r0=start
    for j,h in enumerate(headers,1): ws.cell(row=r0,column=j,value=h)
    style_header(ws,r0,len(headers),color)
    for i,row in enumerate(rows,1):
        for j,v in enumerate(row,1):
            c=ws.cell(row=r0+i,column=j,value=v); c.border=BORD
            c.alignment=Alignment(vertical="center",
                horizontal=("left" if isinstance(v,str) else "center"), wrap_text=False)
            if zebra and i%2==0: c.fill=fill(LT)
    ws.freeze_panes=ws.cell(row=r0+1,column=1)
    return r0+len(rows)

# ---------------- 1. Overview / Methodology ----------------
ws=wb.active; ws.title="Overview"
ws.sheet_view.showGridLines=False
ws["A1"]="LITT Physician Profiles — Northeast Territory"; ws["A1"].font=TITLE
ws["A2"]=("Customer, competitor, and LITT-naïve craniotomy physician profiles with referral-network "
          "mapping and a triangulated potential-volume model."); ws["A2"].font=SUB
lines=[
 ("", ""),
 ("SCOPE", ""),
 ("Region", META["region"]),
 ("Providers profiled", f'{len(P):,} individual clinicians (+{META.get("excluded_low_signal",0)} no-signal rows excluded; {len(F)} facility/organization rows held separately)'),
 ("Generated", META["generated"]),
 ("Sources", META["source"]),
 ("", ""),
 ("THREE COHORTS (as requested)", ""),
 ("① LITT — Our Equipment (NeuroBlate)", "Field-confirmed Monteris NeuroBlate users from the NE Territory Plan (claims LITT counts undercount at academic centers, so field confirmation governs)."),
 ("② LITT — Competitor Equipment", "Field-confirmed users on Visualase (Medtronic) / ClearPoint, plus competitive-account and prospect LITT surgeons."),
 ("③ LITT — Unverified Platform", "Claims show LITT performed, but the laser platform is not field-confirmed. Verify — could be ours or a competitor's."),
 ("④ LITT-Naïve Craniotomy Surgeon", "Neurosurgeons with tumor and/or epilepsy craniotomy volume but zero LITT — the category-development conversion pool."),
 ("Referring Clinician", "Neurologists, epileptologists, neuro-onc, rad-onc who manage/refer the disease pools that feed LITT (the 'grow the feed' motion)."),
 ("", ""),
 ("PERFORMING vs REFERRING", "Each procedure appears twice in the source; the higher value is the physician's PERFORMING count, the lower is their REFERRING count (patients they send that get the procedure elsewhere)."),
 ("", ""),
 ("POTENTIAL-VOLUME MODEL (triangulated)", ""),
 ("Disease anchor — epilepsy", "25–40% of epilepsy is drug-resistant (DRE); only ~4% of eligible DRE patients get surgery today (ASSFN/Monteris). The 'Intractable Epilepsy' claims count is already the DRE pool."),
 ("Disease anchor — tumor", "Up to 49% of tumors are in/near eloquent areas, making resection difficult — LITT's core indication (AANS/CNS). Mets/RN pool feeds recurrent-mets + radiation-necrosis LITT."),
 ("Addressable fraction", f'{META["addressable_fraction"]*100:.0f}% of each raw disease pool per year — the blended, LITT-appropriate + realistically-convertible rate the Territory Plan applies uniformly across every account reservoir.'),
 ("Untapped LITT / yr", "= (Intractable pool × addressable%) + (Mets/RN pool × addressable%) − LITT already performed. Floored at 0."),
 ("Worked example", "A neurologist with 1,163 intractable-epilepsy patients → 1,163 × 5% ≈ 58 addressable LITT candidates/yr. If they have sent ~0, that is 58 untapped — the 'there have to be candidates out there' math."),
 ("Editable", "The addressable % lives in a single cell on the 'Model — Editable' tab; change it and the model recomputes. Treat outputs as directional targeting signal, not a forecast."),
 ("", ""),
 ("IMPORTANT", "Claims-based counts (Medscout) undercount academic-center volume and cannot identify the laser platform. Field intelligence overrides data where the two disagree. Not for clinical decision-making."),
]
r=4
for a,b in lines:
    ca=ws.cell(row=r,column=1,value=a); cb=ws.cell(row=r,column=2,value=b)
    if a and a.isupper(): ca.font=Font(bold=True,color=BLUE,size=11)
    elif a: ca.font=BOLD
    cb.font=Font(color=INK,size=10,name="Calibri"); cb.alignment=Alignment(wrap_text=True,vertical="top")
    ca.alignment=Alignment(wrap_text=True,vertical="top"); r+=1
ws.column_dimensions["A"].width=34; ws.column_dimensions["B"].width=104

# ---------------- Master + cohort tabs ----------------
MHDR=["Name","NPI","Specialty","Role / Plan status","Cohort","Platform","Account","System / Affiliation","State",
      "LITT perf","LITT ref","Epilepsy cranio","Tumor cranio","Mets/RN","SRS","SEEG","Intractable epi pool",
      "Epi addressable","Onc addressable","Untapped LITT/yr","Opp. score","Email","Phone"]
def prow(p):
    m=p["model"]
    return [p.get("name",""),p.get("npi",""),p.get("specialty",""),p.get("planRole","—"),
        p.get("cohort",""),p.get("platform","—"),p.get("account",""),p.get("system",""),p.get("state",""),
        p["litt_perf"],p["litt_ref"],p["epi_cranio"],p["tumor_cranio"],p["mets_rn"],p["srs"],p["seeg"],
        m["intractable_pool"],m["epi_addressable"],m["onc_addressable"],m["untapped_litt_yr"],
        p.get("oppScore",0),p.get("email",""),p.get("phone","")]

def make_sheet(title, rows, color, note=None):
    ws=wb.create_sheet(title); ws.sheet_view.showGridLines=False
    start=1
    if note:
        ws.cell(row=1,column=1,value=note).font=SUB; start=3
        ws.merge_cells(start_row=1,start_column=1,end_row=1,end_column=len(MHDR))
    end=write_table(ws,MHDR,rows,start=start,color=color)
    widths=[26,11,30,26,30,20,22,34,7,9,9,12,12,9,7,7,15,13,13,15,10,26,15]
    for i,w in enumerate(widths,1): ws.column_dimensions[get_column_letter(i)].width=w
    ws.auto_filter.ref=f"{get_column_letter(1)}{start}:{get_column_letter(len(MHDR))}{end}"
    return ws

allrows=sorted(P,key=lambda p:-p.get("oppScore",0))
make_sheet("Physician Master",[prow(p) for p in allrows],NAVY,
    f"All {len(P):,} profiled clinicians, ranked by opportunity score. Use the column filters. See 'Overview' for definitions.")

def coh(name): return sorted([p for p in P if p["cohort"]==name],key=lambda p:-p.get("oppScore",0))
make_sheet("① NeuroBlate Users",[prow(p) for p in coh("LITT — Our Equipment (NeuroBlate)")],"0F766E",
    "Field-confirmed NeuroBlate (Monteris) users — our installed customers. Claims LITT counts undercount real volume.")
make_sheet("② Competitor LITT",[prow(p) for p in coh("LITT — Competitor Equipment")],"9A3412",
    "Field-confirmed competitor / prospect LITT users (Visualase, ClearPoint, or competitive accounts). Displacement & win-back targets.")
make_sheet("③ Unverified LITT",[prow(p) for p in coh("LITT — Unverified Platform")],"92400E",
    "Claims show LITT performed; platform not field-confirmed. Verify — these are where hidden competitive volume and unlogged NeuroBlate cases both hide.")
make_sheet("④ LITT-Naïve Surgeons",[prow(p) for p in coh("LITT-Naïve Craniotomy Surgeon")],"1E3A5F",
    "Neurosurgeons doing tumor/epilepsy craniotomy but no LITT — the category-development conversion pool.")

# ---------------- Referral network ----------------
refs=[p for p in P if p["model"]["intractable_pool"]>=20 or p["model"]["srs_pool"]>=20 or p["model"]["mets_rn_pool"]>=20]
refs=sorted(refs,key=lambda p:-p["model"]["untapped_litt_yr"])
RHDR=["Referrer","Specialty","Account / System","Intractable epi pool","Mets/RN pool","SRS pool (necrosis feeder)",
      "Epi addressable/yr","Onc addressable/yr","Total addressable LITT/yr","LITT already referred","Untapped referral potential/yr"]
rrows=[[p.get("name",""),p.get("specialty",""),(p.get("account") or p.get("system","")),
        p["model"]["intractable_pool"],p["model"]["mets_rn_pool"],p["model"]["srs_pool"],
        p["model"]["epi_addressable"],p["model"]["onc_addressable"],p["model"]["addressable_litt_yr"],
        p["litt_ref"],p["model"]["untapped_litt_yr"]] for p in refs]
ws=wb.create_sheet("⑤ Referral Network"); ws.sheet_view.showGridLines=False
ws.cell(row=1,column=1,value=("Clinicians whose disease pools feed LITT, ranked by untapped addressable candidates per year. "
    "This is the 'grow the feed' motion — the referrers behind the surgeons.")).font=SUB
ws.merge_cells(start_row=1,start_column=1,end_row=1,end_column=len(RHDR))
end=write_table(ws,RHDR,rrows,start=3,color="0F766E")
for i,w in enumerate([26,32,30,16,12,20,15,15,18,16,20],1): ws.column_dimensions[get_column_letter(i)].width=w
ws.auto_filter.ref=f"A3:{get_column_letter(len(RHDR))}{end}"

# ---------------- Model — Editable ----------------
ws=wb.create_sheet("Model — Editable"); ws.sheet_view.showGridLines=False
ws["A1"]="Potential-Volume Model — Editable"; ws["A1"].font=TITLE
ws["A2"]="Change the addressable % in B4 and every Untapped column recomputes. Top opportunities shown."; ws["A2"].font=SUB
ws["A4"]="Addressable fraction →"; ws["A4"].font=BOLD
ws["B4"]=META["addressable_fraction"]; ws["B4"].number_format="0%"; ws["B4"].fill=fill("FFF3CD"); ws["B4"].font=Font(bold=True,size=12)
ws["C4"]="(blended LITT-appropriate + convertible / yr; Territory Plan uses 5%)"; ws["C4"].font=SUB
MDHDR=["Clinician","Cohort","Account","Intractable epi pool","Mets/RN pool","Addressable = pool × frac","LITT done","Untapped LITT/yr"]
top=sorted(P,key=lambda p:-(p["model"]["intractable_pool"]+p["model"]["mets_rn_pool"]))[:200]
start=6
for j,h in enumerate(MDHDR,1): ws.cell(row=start,column=j,value=h)
style_header(ws,start,len(MDHDR),BLUE)
for i,p in enumerate(top,1):
    rr=start+i; m=p["model"]
    ws.cell(row=rr,column=1,value=p.get("name","")).border=BORD
    ws.cell(row=rr,column=2,value=p["cohort"]).border=BORD
    ws.cell(row=rr,column=3,value=(p.get("account") or p.get("system",""))).border=BORD
    ws.cell(row=rr,column=4,value=m["intractable_pool"]).border=BORD
    ws.cell(row=rr,column=5,value=m["mets_rn_pool"]).border=BORD
    ws.cell(row=rr,column=6,value=f"=ROUND((D{rr}+E{rr})*$B$4,0)").border=BORD
    ws.cell(row=rr,column=7,value=p["litt_perf"]).border=BORD
    ws.cell(row=rr,column=8,value=f"=MAX(0,F{rr}-G{rr})").border=BORD
    if i%2==0:
        for j in range(1,len(MDHDR)+1): ws.cell(row=rr,column=j).fill=fill(LT)
for i,w in enumerate([26,30,24,16,12,22,10,15],1): ws.column_dimensions[get_column_letter(i)].width=w
ws.freeze_panes=ws.cell(row=start+1,column=1)

# ---------------- Accounts ----------------
ws=wb.create_sheet("Accounts"); ws.sheet_view.showGridLines=False
AHDR=["#","Account","System","Class","Posture","Platform","Cases logged (3yr)","2026 proj $","Biz potential/yr",
      "Incr. cases","Win","Mets addr / pool","Intractable addr / pool","RN addr / pool","rGBM addr / pool"]
arows=[]
for a in d["accounts"]:
    def res(k):
        v=a["reservoirs"].get(k); return (f'{v[0]} / {v[1]:,}' if v else "—")
    proj=a["net_sales_by_year"].get("2026_proj")
    arows.append([a["rank"],a["name"],a["system"],a["class"],a["posture"],", ".join(pl.split(" (")[0] for pl in a["platform"]),
        a["cases_logged"],(f'${proj:,}' if proj else "—"),
        (f'${a["business_potential_yr"]:,}' if a["business_potential_yr"] else "—"),
        a["incremental_cases"] or "—",a["win"],res("Mets"),res("Intractable epilepsy"),res("Radiation necrosis"),res("Recurrent GBM")])
end=write_table(ws,AHDR,arows,start=1,color=NAVY)
for i,w in enumerate([4,32,30,12,20,26,16,14,15,11,10,16,18,16,16],1): ws.column_dimensions[get_column_letter(i)].width=w

# ---------------- Competitive landscape ----------------
ws=wb.create_sheet("Competitive Landscape"); ws.sheet_view.showGridLines=False
ws.cell(row=1,column=1,value="Competitive leakage — claims LITT volume NOT ours (3-yr)").font=Font(bold=True,color=BLUE,size=12)
LHDR=["Account","Claims LITT","Ours","Gap","Play","Platform"]
lrows=[[x["account"],x["claims"],x["ours"],x["gap"],x["play"],x["platform"].split(" (")[0]] for x in d["leakage"]]
e1=write_table(ws,LHDR,lrows,start=2,color="9A3412")
r2=e1+3
ws.cell(row=r2,column=1,value="Prospects & landscape — programs outside the installed base").font=Font(bold=True,color=BLUE,size=12)
PHDR=["Account","LITT user","LITT","Epilepsy","sEEG","Necrosis pool","Platform"]
prows=[[x["account"],x["user"],x["litt"],x["epilepsy"],x["seeg"],x["necrosis_pool"],x["platform"].split(" (")[0]] for x in d["prospects"]]
write_table(ws,PHDR,prows,start=r2+1,color="1E3A5F")
for i,w in enumerate([30,22,12,10,8,16,22],1): ws.column_dimensions[get_column_letter(i)].width=w

# ---------------- Top targets ----------------
ws=wb.create_sheet("Top Targets (COI)"); ws.sheet_view.showGridLines=False
ws.cell(row=1,column=1,value="Top user targets by Composite Opportunity Index (Territory Plan)").font=Font(bold=True,color=BLUE,size=12)
THDR=["Surgeon","Affiliation","Motion","LITT","Epilepsy","Tumor","COI"]
trows=[[t["name"],t["affiliation"],t["motion"],t["litt"],t["epi"],t["tumor"],t["coi"]] for t in d["topTargets"]]
write_table(ws,THDR,trows,start=2,color=NAVY)
for i,w in enumerate([24,40,12,8,10,8,8],1): ws.column_dimensions[get_column_letter(i)].width=w

# ---------------- Playbook (growth levers) ----------------
ws=wb.create_sheet("Playbook"); ws.sheet_view.showGridLines=False
ws.cell(row=1,column=1,value="Growth-Lever Playbook — who to target + what to carry").font=Font(bold=True,color=BLUE,size=12)
ws.cell(row=2,column=1,value="Maps each Monteris growth lever to the cohort it targets in this tool and the tools to bring.").font=SUB
GHDR=["Growth lever","Targets cohort","In tool (#)","Account intel","Education / awareness","Clinical","Market access","Programs"]
def cohcount(cohs): return sum(1 for p in P if p["cohort"] in cohs)
grows=[]
for l in d["growthLevers"]:
    grows.append([l["title"], " / ".join(c.replace("LITT — ","") for c in l["cohorts"]), cohcount(l["cohorts"]),
        "\n".join(l["account"]), "\n".join(l["education"]), "\n".join(l["clinical"]),
        "\n".join(l["market_access"]), "\n".join(l["programs"])])
end=write_table(ws,GHDR,grows,start=4,color=NAVY,zebra=False)
for i,w in enumerate([30,26,10,26,34,32,26,32],1): ws.column_dimensions[get_column_letter(i)].width=w
for r in range(5,end+1):
    for c in range(1,len(GHDR)+1):
        ws.cell(row=r,column=c).alignment=Alignment(vertical="top",wrap_text=True)
    ws.row_dimensions[r].height=150
ws.cell(row=end+2,column=1,value=d["growthLeversNote"]).font=SUB

wb.save("LITT_Physician_Profiles.xlsx")
print("saved LITT_Physician_Profiles.xlsx  tabs:",wb.sheetnames)
