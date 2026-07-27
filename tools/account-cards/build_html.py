# -*- coding: utf-8 -*-
"""
Account Report Card — HTML builder.

Reads account_cards.json and emits:
  * account-cards.html             (hosted — fetches account_cards.json)
  * account-cards-standalone.html  (data embedded — double-click / print)
  * account-cards-artifact.html    (same as standalone; for claude.ai artifact)

All rendering is client-side from the embedded/fetched data. Fields are
editable in the browser (Edit mode) and persist to localStorage per account.
Designed to print as 2 letter pages + a research appendix.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DATA = json.load(open(os.path.join(HERE, "account_cards.json")))

# The template. {{DATA}} is replaced with an inline JSON blob (standalone) or a
# fetch (hosted). {{MODE}} distinguishes.
TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LITT Account Report Cards — Northeast Territory</title>
<style>
:root{
  --ink:#14181d; --ink2:#3b4653; --muted:#6b7683; --line:#e3e7ec; --line2:#eef1f4;
  --surface:#ffffff; --surface2:#f7f9fb; --surface3:#eef3f8;
  --brand:#0f3d5c; --brand2:#12678f; --accent:#12a3a3;
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --s4:#eda100; --s5:#e34948; --s6:#4a3aa7;
  --good:#1a8f4c; --goodbg:#e7f4ec; --warn:#c9700a; --warnbg:#fbf0df;
  --bad:#cf3838; --badbg:#fbe9e9; --opp:#1f6fb2; --oppbg:#e6f0f9;
  --radius:10px; --shadow:0 1px 2px rgba(16,32,48,.06),0 6px 20px rgba(16,32,48,.05);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink); background:var(--surface2); font-size:13px; line-height:1.4;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4{margin:0; font-weight:700; letter-spacing:-.01em}
a{color:var(--brand2); text-decoration:none}
a:hover{text-decoration:underline}

/* ---- top toolbar (screen only) ---- */
.toolbar{
  position:sticky; top:0; z-index:50; display:flex; gap:10px; align-items:center;
  padding:10px 16px; background:rgba(255,255,255,.92); backdrop-filter:blur(8px);
  border-bottom:1px solid var(--line); flex-wrap:wrap;
}
.toolbar .brand{font-weight:800; color:var(--brand); letter-spacing:-.02em; font-size:15px; margin-right:6px}
.toolbar select,.toolbar button{
  font:inherit; font-size:12.5px; padding:6px 11px; border:1px solid var(--line);
  border-radius:8px; background:#fff; color:var(--ink); cursor:pointer; font-weight:600;
}
.toolbar select{min-width:230px}
.toolbar button:hover{border-color:var(--brand2); color:var(--brand2)}
.toolbar button.on{background:var(--brand); color:#fff; border-color:var(--brand)}
.toolbar .spacer{flex:1}
.toolbar .hint{font-size:11.5px; color:var(--muted); font-weight:500}

/* ---- page frame ---- */
.sheet{max-width:1060px; margin:16px auto; padding:0 16px}
.page{
  background:var(--surface); border:1px solid var(--line); border-radius:var(--radius);
  box-shadow:var(--shadow); padding:20px 22px; margin-bottom:18px; position:relative;
}
.page-tag{position:absolute; top:10px; right:14px; font-size:10px; color:var(--muted);
  font-weight:700; letter-spacing:.08em; text-transform:uppercase}

/* ---- header band ---- */
.hdr{display:grid; grid-template-columns:1fr auto; gap:14px; align-items:start;
  padding-bottom:14px; border-bottom:2px solid var(--brand)}
.hdr .eyebrow{font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--brand2)}
.hdr h1{font-size:25px; color:var(--brand); line-height:1.05; margin:2px 0 4px}
.hdr .sub{color:var(--ink2); font-size:13px; font-weight:600}
.pills{display:flex; gap:6px; flex-wrap:wrap; margin-top:8px}
.pill{font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px;
  background:var(--surface3); color:var(--brand); border:1px solid #dbe6ef; white-space:nowrap}
.pill.win-High{background:var(--goodbg); color:var(--good); border-color:#bfe4cc}
.pill.win-Medium{background:var(--warnbg); color:var(--warn); border-color:#f0dcb8}
.pill.win-Low{background:var(--badbg); color:var(--bad); border-color:#f0c9c9}
.hdr-right{text-align:right; min-width:150px}

/* facts grid */
.facts{display:grid; grid-template-columns:repeat(4,1fr); gap:0; margin-top:14px;
  border:1px solid var(--line); border-radius:9px; overflow:hidden}
.fact{padding:8px 11px; border-right:1px solid var(--line2); border-bottom:1px solid var(--line2)}
.fact:nth-child(4n){border-right:none}
.fact .k{font-size:9.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.fact .v{font-size:12.5px; font-weight:700; color:var(--ink); margin-top:2px}
.fact .v.flag{color:var(--warn)}
.fact .v.yes{color:var(--good)}
.fact .v.no{color:var(--muted)}
.note-line{margin-top:10px; font-size:12px; color:var(--ink2); background:var(--surface3);
  border-left:3px solid var(--accent); padding:7px 11px; border-radius:0 6px 6px 0}

/* section heads */
.sec{margin-top:18px}
.sec-h{display:flex; align-items:center; gap:9px; margin-bottom:10px}
.sec-h .n{width:20px; height:20px; border-radius:6px; background:var(--brand); color:#fff;
  font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center}
.sec-h h2{font-size:15px; color:var(--brand); letter-spacing:-.01em}
.sec-h .rule{flex:1; height:1px; background:var(--line)}

/* business band */
.biz{display:grid; grid-template-columns:168px 1fr; gap:16px; align-items:stretch}
.health-card{border:1px solid var(--line); border-radius:10px; padding:12px; text-align:center;
  background:linear-gradient(180deg,#fff, var(--surface2))}
.kpis{display:grid; grid-template-columns:repeat(4,1fr); gap:9px}
.kpi{border:1px solid var(--line); border-radius:9px; padding:9px 10px; background:#fff}
.kpi .k{font-size:9.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:var(--muted)}
.kpi .v{font-size:19px; font-weight:800; color:var(--ink); margin-top:2px; line-height:1}
.kpi .d{font-size:10.5px; font-weight:600; margin-top:3px; color:var(--muted)}
.kpi .d.up{color:var(--good)} .kpi .d.down{color:var(--bad)}
.charts2{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:11px}
.chart{border:1px solid var(--line); border-radius:9px; padding:10px 11px 6px; background:#fff}
.chart .ct{font-size:11px; font-weight:800; color:var(--ink2); margin-bottom:4px; letter-spacing:-.01em}
.chart .csub{font-size:10px; color:var(--muted); font-weight:600; margin-bottom:6px}

/* universe */
.uni{display:grid; grid-template-columns:1fr 1fr; gap:13px}
.ucard{border:1px solid var(--line); border-radius:9px; overflow:hidden}
.ucard .uh{font-size:11px; font-weight:800; letter-spacing:.04em; text-transform:uppercase;
  padding:7px 11px; color:#fff; display:flex; justify-content:space-between; align-items:center}
.uh.perf{background:var(--good)} .uh.kol{background:var(--s6)}
.uh.naive{background:var(--brand2)} .uh.ref{background:var(--s2)}
.ucard .ubody{padding:8px 11px}
.prow{display:flex; justify-content:space-between; align-items:baseline; gap:8px;
  padding:4px 0; border-bottom:1px dashed var(--line2)}
.prow:last-child{border-bottom:none}
.prow .nm{font-weight:700; font-size:12.5px}
.prow .nm.click{color:var(--brand2); cursor:pointer; border-bottom:1px dotted var(--brand2)}
.prow .meta{font-size:10.5px; color:var(--muted); font-weight:600}
.prow .badge{font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:5px;
  background:var(--surface3); color:var(--brand)}
.kolwhy{font-size:10.5px; color:var(--ink2); margin-top:2px; line-height:1.35}
.indtag{display:inline-block; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:5px;
  background:var(--oppbg); color:var(--opp); margin-left:5px}

/* SWOT */
.swot{display:grid; grid-template-columns:1fr 1fr; gap:12px}
.quad{border:1px solid var(--line); border-radius:10px; overflow:hidden; display:flex; flex-direction:column}
.quad .qh{padding:8px 12px; font-weight:800; font-size:13px; display:flex; align-items:center; gap:8px; color:#fff}
.quad.S .qh{background:var(--good)} .quad.W .qh{background:var(--warn)}
.quad.O .qh{background:var(--opp)} .quad.T .qh{background:var(--bad)}
.quad .qh .tag{font-size:10px; font-weight:700; opacity:.85; letter-spacing:.04em}
.quad ul{margin:0; padding:9px 12px 11px 26px; display:flex; flex-direction:column; gap:6px}
.quad li{font-size:12px; color:var(--ink); line-height:1.4}
.quad li::marker{color:var(--muted)}

/* strategy */
.plays{display:flex; flex-direction:column; gap:11px}
.play{border:1px solid var(--line); border-radius:10px; overflow:hidden}
.play .ph{display:flex; align-items:center; gap:9px; padding:9px 13px; background:var(--surface3);
  border-bottom:1px solid var(--line)}
.play .ptype{font-size:9.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase;
  padding:2px 8px; border-radius:6px; color:#fff; white-space:nowrap}
.ptype.develop{background:var(--brand2)} .ptype.crack{background:var(--bad)} .ptype.activate{background:var(--s3)}
.play .ph h3{font-size:13.5px; color:var(--ink)}
.play .pbody{padding:9px 14px 11px}
.play .targets{font-size:11px; color:var(--ink2); margin-bottom:6px; font-weight:600}
.play .targets b{color:var(--brand)}
.play ul{margin:0; padding-left:19px; display:flex; flex-direction:column; gap:5px}
.play li{font-size:12px; line-height:1.4; color:var(--ink)}

/* appendix */
.apx .page{padding:22px 26px}
.apx-h{border-bottom:2px solid var(--s6); padding-bottom:10px; margin-bottom:14px}
.apx-h h1{font-size:20px; color:var(--s6)}
.apx-h .sub{color:var(--muted); font-size:12px; font-weight:600; margin-top:3px}
.rprof{border:1px solid var(--line); border-radius:10px; padding:14px 16px; margin-bottom:14px;
  break-inside:avoid}
.rprof .rhh{display:flex; justify-content:space-between; align-items:flex-start; gap:12px}
.rprof h3{font-size:16px; color:var(--brand)}
.rprof .rspec{font-size:11px; color:var(--muted); font-weight:600; margin-top:1px}
.gradepill{font-size:11px; font-weight:800; padding:3px 10px; border-radius:7px; white-space:nowrap}
.gradepill.A{background:var(--goodbg); color:var(--good)}
.gradepill.B{background:var(--oppbg); color:var(--opp)}
.rprof .ident{font-size:12px; color:var(--ink2); margin:7px 0; line-height:1.45}
.rprof .themes{display:flex; gap:6px; flex-wrap:wrap; margin:7px 0}
.rprof .theme{font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:6px;
  background:var(--surface3); color:var(--brand2)}
.rprof .rationale{font-size:11.5px; color:var(--ink2); background:var(--surface2); border-radius:7px;
  padding:8px 11px; margin:7px 0; line-height:1.45}
.rprof h4{font-size:10.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase;
  color:var(--muted); margin:11px 0 5px}
.paper{padding:5px 0 5px 14px; border-left:2px solid var(--line); margin-bottom:4px}
.paper .pt{font-size:12px; font-weight:600; color:var(--ink); line-height:1.35}
.paper .pm{font-size:10.5px; color:var(--muted); font-weight:600; margin-top:1px}
.collab{font-size:11px; color:var(--ink2); line-height:1.5}
.collab b{color:var(--ink)}
.backlink{font-size:11px; font-weight:700; color:var(--brand2); cursor:pointer}

/* editable */
[data-edit]{border-radius:4px; transition:background .15s, box-shadow .15s}
body.editing [data-edit]{background:#fffceb; box-shadow:inset 0 0 0 1px #f0dca0; cursor:text; padding:1px 3px; margin:-1px -3px}
body.editing [data-edit]:focus{outline:none; background:#fff; box-shadow:inset 0 0 0 2px var(--brand2)}
body.editing .add-btn{display:inline-flex}
.add-btn{display:none; align-items:center; gap:4px; font-size:10.5px; font-weight:700; color:var(--brand2);
  cursor:pointer; margin-top:6px; padding:3px 8px; border:1px dashed var(--brand2); border-radius:6px; background:#fff}
.del-x{display:none; color:var(--bad); cursor:pointer; font-weight:800; margin-left:6px; font-size:12px}
body.editing .del-x{display:inline}

.footer-note{font-size:10px; color:var(--muted); text-align:center; margin:6px 0 24px; line-height:1.5}

@media (max-width:820px){
  .biz{grid-template-columns:1fr} .uni,.swot,.charts2,.facts{grid-template-columns:1fr 1fr}
  .facts{grid-template-columns:1fr 1fr}
}

/* ---------------- PRINT ---------------- */
@media print{
  @page{size:letter; margin:0.42in}
  body{background:#fff}
  .toolbar,.add-btn,.del-x,.backlink{display:none !important}
  /* Render the full desktop layout at a fixed width and scale it to the sheet,
     so print keeps the 2-column design instead of the narrow responsive one. */
  .sheet{width:1040px; zoom:0.70; margin:0; padding:0; max-width:none}
  .biz{grid-template-columns:168px 1fr !important}
  .uni,.swot,.charts2{grid-template-columns:1fr 1fr !important}
  .facts{grid-template-columns:repeat(4,1fr) !important}
  .page{border:none; box-shadow:none; border-radius:0; padding:0 0 6px; margin:0;
    page-break-after:always; break-after:page}
  .page.no-break-after{page-break-after:auto}
  .page-tag{display:none}
  .rprof,.play,.quad,.ucard{break-inside:avoid}
  .hdr h1{font-size:22px}
  [data-edit]{background:none !important; box-shadow:none !important}
}
</style>
</head>
<body>
<div class="toolbar">
  <span class="brand">▮ LITT Account Report Cards</span>
  <select id="acctSel" onchange="renderAccount(this.value)"></select>
  <button id="editBtn" onclick="toggleEdit()">✎ Edit</button>
  <button onclick="window.print()">⎙ Print / PDF</button>
  <button onclick="resetEdits()" title="Discard your edits for this account">↺ Reset</button>
  <div class="spacer"></div>
  <span class="hint" id="saveHint">Northeast Territory · edits save to this browser</span>
</div>
<div class="sheet" id="sheet"></div>
<div class="footer-note" id="foot"></div>

<script>
const PALETTE={s1:'#2a78d6',s2:'#eb6834',s3:'#1baf7a',s4:'#eda100',s5:'#e34948',s6:'#4a3aa7',
  brand:'#0f3d5c',brand2:'#12678f',accent:'#12a3a3',good:'#1a8f4c',warn:'#c9700a',bad:'#cf3838',
  line:'#e3e7ec',muted:'#6b7683',ink:'#14181d'};
{{DATA}}
let CUR=null, EDIT=false;
const store={
  key(acr){return 'litt-acctcard:'+acr;},
  load(acr){try{return JSON.parse(localStorage.getItem(this.key(acr)))||{};}catch(e){return {};}},
  save(acr,o){localStorage.setItem(this.key(acr),JSON.stringify(o));},
  clear(acr){localStorage.removeItem(this.key(acr));}
};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>'$'+Math.round(n).toLocaleString();
const kmoney=n=>n>=1000?'$'+(n/1000).toFixed(n>=100000?0:1)+'K':'$'+Math.round(n);

/* ---------- editable helpers ---------- */
function ed(acr,path,val,cls){ // inline editable span
  const ov=store.load(acr); const cur=path in ov?ov[path]:val;
  return `<span data-edit contenteditable="false" data-path="${path}" class="${cls||''}">${esc(cur)}</span>`;
}
function getVal(acr,path,val){const ov=store.load(acr);return path in ov?ov[path]:val;}

/* ================= CHARTS (inline SVG) ================= */
function gauge(score,grade){
  const R=52,C=2*Math.PI*R,frac=score/100,off=C*(1-frac);
  const col=score>=76?PALETTE.good:score>=57?PALETTE.warn:PALETTE.bad;
  return `<svg viewBox="0 0 130 130" width="130" height="130" role="img" aria-label="Health ${grade}">
    <circle cx="65" cy="65" r="${R}" fill="none" stroke="#eef1f4" stroke-width="12"/>
    <circle cx="65" cy="65" r="${R}" fill="none" stroke="${col}" stroke-width="12"
      stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"
      transform="rotate(-90 65 65)"/>
    <text x="65" y="60" text-anchor="middle" font-size="34" font-weight="800" fill="${PALETTE.ink}">${grade}</text>
    <text x="65" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="${PALETTE.muted}">${score}/100</text>
  </svg>`;
}
function radar(dims){
  const labels={Trajectory:'Trend',Penetration:'Upside',SurgeonDepth:'Bench',Competitive:'Position',Commitment:'Commit'};
  const max={Trajectory:25,Penetration:20,SurgeonDepth:20,Competitive:20,Commitment:15};
  const keys=Object.keys(dims),n=keys.length,cx=78,cy=74,R=52;
  const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];};
  let grid='';
  [0.25,0.5,0.75,1].forEach(f=>{
    let p=keys.map((_,i)=>pt(i,R*f).join(',')).join(' ');
    grid+=`<polygon points="${p}" fill="none" stroke="#eef1f4" stroke-width="1"/>`;
  });
  let axes='',lbls='';
  keys.forEach((k,i)=>{const[x,y]=pt(i,R);axes+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e3e7ec" stroke-width="1"/>`;
    const[lx,ly]=pt(i,R+13);lbls+=`<text x="${lx}" y="${ly+3}" text-anchor="middle" font-size="9" font-weight="700" fill="${PALETTE.muted}">${labels[k]||k}</text>`;});
  const poly=keys.map((k,i)=>pt(i,R*(dims[k]/max[k])).join(',')).join(' ');
  return `<svg viewBox="0 0 156 152" width="100%" height="150" role="img" aria-label="Health dimensions">
    ${grid}${axes}
    <polygon points="${poly}" fill="${PALETTE.brand2}" fill-opacity="0.18" stroke="${PALETTE.brand2}" stroke-width="2"/>
    ${keys.map((k,i)=>{const[x,y]=pt(i,R*(dims[k]/max[k]));return `<circle cx="${x}" cy="${y}" r="2.6" fill="${PALETTE.brand2}"/>`;}).join('')}
    ${lbls}</svg>`;
}
function salesChart(sales,proj){
  const yrs=sales.years, W=300,H=130,pad={l:34,r:10,t:10,b:20};
  const cons=yrs.map(y=>sales.byYear[y].net - sales.byYear[y].capital);
  const cap=yrs.map(y=>sales.byYear[y].capital);
  const bars=yrs.map((y,i)=>({y,cons:cons[i],cap:cap[i],tot:cons[i]+cap[i]}));
  const projVal=proj||0;
  const max=Math.max(...bars.map(b=>b.tot),projVal)*1.12||1;
  const iw=W-pad.l-pad.r, ih=H-pad.t-pad.b;
  const n=bars.length+ (projVal?1:0);
  const bw=Math.min(46, iw/n*0.6), gap=iw/n;
  const yOf=v=>pad.t+ih-(v/max)*ih;
  let g='';
  [0,max/2,max].forEach(v=>{const yy=yOf(v);g+=`<line x1="${pad.l}" y1="${yy}" x2="${W-pad.r}" y2="${yy}" stroke="#eef1f4"/>
    <text x="${pad.l-4}" y="${yy+3}" text-anchor="end" font-size="8" fill="${PALETTE.muted}">${v>=1000?(v/1000|0)+'K':Math.round(v)}</text>`;});
  let b='';
  bars.forEach((bar,i)=>{
    const x=pad.l+gap*i+gap/2-bw/2;
    const consH=(bar.cons/max)*ih, capH=(bar.cap/max)*ih;
    const yc=pad.t+ih-consH;
    b+=`<rect x="${x}" y="${yc}" width="${bw}" height="${Math.max(0,consH)}" rx="3" fill="${PALETTE.s1}"/>`;
    if(bar.cap>0){const ycap=yc-capH-2;b+=`<rect x="${x}" y="${ycap}" width="${bw}" height="${Math.max(0,capH)}" rx="3" fill="${PALETTE.s3}"/>`;}
    b+=`<text x="${x+bw/2}" y="${H-7}" text-anchor="middle" font-size="9" font-weight="700" fill="${PALETTE.muted}">${bar.y.replace('2026','26 YTD').replace('20','')}</text>`;
    b+=`<text x="${x+bw/2}" y="${yOf(bar.tot)-4}" text-anchor="middle" font-size="8.5" font-weight="800" fill="${PALETTE.ink}">${kmoney(bar.tot)}</text>`;
  });
  // projection ghost bar
  if(projVal){const i=bars.length;const x=pad.l+gap*i+gap/2-bw/2;const h=(projVal/max)*ih;const y=pad.t+ih-h;
    b+=`<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="none" stroke="${PALETTE.s2}" stroke-width="1.5" stroke-dasharray="3 2"/>
    <text x="${x+bw/2}" y="${H-7}" text-anchor="middle" font-size="9" font-weight="700" fill="${PALETTE.s2}">'26 proj</text>
    <text x="${x+bw/2}" y="${y-4}" text-anchor="middle" font-size="8.5" font-weight="800" fill="${PALETTE.s2}">${kmoney(projVal)}</text>`;}
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${g}${b}</svg>
    <div style="display:flex;gap:12px;font-size:9.5px;font-weight:700;color:var(--muted);margin-top:2px">
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${PALETTE.s1}"></i> Consumable</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${PALETTE.s3}"></i> Capital</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;border:1.5px dashed ${PALETTE.s2}"></i> Projection</span>
    </div>`;
}
function reservoirChart(res){
  const keys=Object.keys(res); if(!keys.length) return '<div style="font-size:11px;color:var(--muted)">No reservoir data.</div>';
  const rows=keys.map(k=>({k,addr:res[k].addressable,raw:res[k].raw}));
  const max=Math.max(...rows.map(r=>r.addr))||1;
  return `<div style="display:flex;flex-direction:column;gap:6px">`+rows.map(r=>{
    const w=(r.addr/max)*100;
    return `<div>
      <div style="display:flex;justify-content:space-between;font-size:10.5px;font-weight:700;margin-bottom:2px">
        <span>${esc(r.k)}</span><span style="color:var(--muted)">${r.addr} / yr <span style="font-weight:500;color:var(--muted)">of ${r.raw} pool</span></span></div>
      <div style="height:9px;background:#eef1f4;border-radius:5px;overflow:hidden">
        <div style="height:100%;width:${w}%;background:${PALETTE.brand2};border-radius:5px"></div></div>
    </div>`;}).join('')+`</div>`;
}

/* ================= RENDER ================= */
function renderAccount(acr){
  const a=DATA.accounts.find(x=>x.acr===acr); if(!a)return; CUR=a;
  document.getElementById('acctSel').value=acr;
  const T=DATA.meta.territory;
  const h=a.header, s=a.sales, hl=a.health, u=a.universe, sw=a.swot;
  // header facts
  const flagFmt=(path,def)=>{const v=getVal(acr,path,def);
    const cls=/confirm/i.test(v)?'flag':(/^yes$/i.test(v)?'yes':(/^(no|low|prospect)$/i.test(v)?'no':''));
    return `<span class="v ${cls}">${ed(acr,path,def)}</span>`;};
  const facts=[
    ['Account type',flagFmt('h.type',h.type)],
    ['Doing LITT',flagFmt('h.litt',h.doingLitt)],
    ['LITT system',`<span class="v">${ed(acr,'h.platform',h.platform.join(' + '))}</span>`],
    ['SEEG program',flagFmt('h.seeg',h.seeg)],
    ['Robot',`<span class="v">${ed(acr,'h.robot',h.robot)}</span>`],
    ['Intra-op MRI',`<span class="v">${ed(acr,'h.mri',h.mri)}</span>`],
    ['Navigation',`<span class="v">${ed(acr,'h.nav',h.nav)}</span>`],
    ['>50 crani/yr',flagFmt('h.crani50',h.crani50)],
    ['Service contract',`<span class="v">${ed(acr,'h.contract',h.contract)}</span>`],
    ['Posture',`<span class="v">${ed(acr,'h.posture',h.posture)}</span>`],
    ['Cases logged',`<span class="v">${a.casesLogged}</span>`],
    ['Health grade',`<span class="v" style="color:${hl.score>=76?'var(--good)':hl.score>=57?'var(--warn)':'var(--bad)'}">${hl.grade} · ${hl.score}/100</span>`],
  ];
  const factsHtml=facts.map(([k,v])=>`<div class="fact"><div class="k">${k}</div>${v.replace('<span class="v"','<div class="fv"').replace(/^<span/,'<div')}</div>`)
    .map(x=>x).join('');
  // simpler facts render
  const factRows=facts.map(([k,v])=>`<div class="fact"><div class="k">${k}</div>${v}</div>`).join('');

  // KPIs
  const y=s.years, ny=y[y.length-1];
  const consTrend=s.byYear[ny].net - s.byYear[ny].capital;
  const rpcDelta=Math.round((s.revPerCase - s.regionRevPerCase)/s.regionRevPerCase*100);
  const casesArr=y.map(yy=>s.byYear[yy].cases);
  const kpis=[
    ['Cases (3-yr)',casesArr.reduce((x,z)=>x+z,0),`${casesArr.join(' → ')} by yr`,''],
    ['Probes / case',s.probesPerCase,'pull-through',''],
    ['$ / case',kmoney(s.revPerCase),`${rpcDelta>=0?'+':''}${rpcDelta}% vs region`, rpcDelta>=0?'up':'down'],
    ['Potential / yr',kmoney(a.businessPotential),`+${a.incrementalCases} cases`,'up'],
  ];
  const kpiHtml=kpis.map(([k,v,d,cls])=>`<div class="kpi"><div class="k">${k}</div><div class="v">${v}</div><div class="d ${cls}">${d}</div></div>`).join('');

  // universe cards
  const perfHtml=u.performers.map(p=>{
    const click=a.appendix.some(e=>sameName(e.name,p.name));
    return `<div class="prow"><span class="nm ${click?'click':''}" ${click?`onclick="goApx('${esc(p.name)}')"`:''}>${esc(p.name)}</span><span class="meta">${p.cases} LITT case${p.cases==1?'':'s'}</span></div>`;
  }).join('')||'<div class="prow"><span class="meta">None logged.</span></div>';
  const kolHtml=u.kols.length?u.kols.map(k=>{
    const click=a.appendix.some(e=>sameName(e.name,k.name));
    return `<div style="padding:6px 0;border-bottom:1px dashed var(--line2)">
      <div class="prow" style="border:none;padding:0"><span class="nm ${click?'click':''}" ${click?`onclick="goApx('${esc(k.name)}')"`:''}>★ ${esc(k.name)}</span><span class="badge">Grade ${esc(k.grade)}</span></div>
      <div class="kolwhy">${esc(k.why)}</div></div>`;
  }).join(''):'<div class="prow"><span class="meta">No KOL-grade research match.</span></div>';
  const naiveHtml=u.naive.length?u.naive.map(p=>{
    const bits=[]; if(p.seeg)bits.push(p.seeg+' SEEG'); if(p.tumor)bits.push(p.tumor+' tumor crani'); if(p.epi)bits.push(p.epi+' epi crani');
    const click=a.appendix.some(e=>sameName(e.name,p.name));
    return `<div class="prow"><span class="nm ${click?'click':''}" ${click?`onclick="goApx('${esc(p.name)}')"`:''}>${esc(p.name)}</span><span class="meta">${bits.join(' · ')||'confirm volume'}</span></div>`;
  }).join(''):'<div class="prow"><span class="meta">No named development targets.</span></div>';
  const allRef=[...u.referrers.map(r=>({n:r.name,c:r.count,ind:r.indication})),
    ...u.epiReferrers.map(r=>({n:r.name,c:r.count,ind:'Epilepsy pool'})),
    ...u.necReferrers.map(r=>({n:r.name,c:r.count,ind:'Rad-necrosis pool'}))];
  const refHtml=allRef.length?allRef.map(r=>`<div class="prow"><span class="nm">${esc(r.n)}<span class="indtag">${esc(r.ind)}</span></span><span class="meta">${r.c}</span></div>`).join('')
    :'<div class="prow"><span class="meta">No mapped referrers.</span></div>';

  // SWOT
  const quad=(cls,tag,title,items,path)=>`<div class="quad ${cls}"><div class="qh"><span>${title}</span><span class="tag">${tag}</span></div>
    <ul data-list="${path}">${items.map((it,i)=>`<li><span data-edit data-path="${path}.${i}">${esc(it)}</span><span class="del-x" onclick="delItem('${path}',${i})">✕</span></li>`).join('')}</ul>
    <span class="add-btn" onclick="addItem('${path}')">＋ add</span></div>`;
  const S=getList(acr,'sw.S',sw.S),W=getList(acr,'sw.W',sw.W),O=getList(acr,'sw.O',sw.O),Th=getList(acr,'sw.T',sw.T);

  // strategy
  const playCls={'Develop surgeons':'develop','Crack competitive':'crack','Activate referrals':'activate'};
  const playsHtml=a.strategy.map((pl,pi)=>{
    const tacts=getList(acr,'st.'+pi,pl.tactics);
    return `<div class="play"><div class="ph"><span class="ptype ${playCls[pl.type]||'develop'}">${esc(pl.type)}</span><h3><span data-edit data-path="st.title.${pi}">${esc(pl.title)}</span></h3></div>
      <div class="pbody">${pl.targets?`<div class="targets">Primary targets: <b>${pl.targets.map(esc).join(', ')}</b></div>`:''}
      <ul data-list="st.${pi}">${tacts.map((t,ti)=>`<li><span data-edit data-path="st.${pi}.${ti}">${esc(t)}</span><span class="del-x" onclick="delItem('st.${pi}',${ti})">✕</span></li>`).join('')}</ul>
      <span class="add-btn" onclick="addItem('st.${pi}')">＋ add tactic</span></div></div>`;
  }).join('');

  // appendix
  const apxHtml=a.appendix.map(e=>{
    const gc=e.grade&&e.grade[0]==='A'?'A':'B';
    const papers=e.papers.filter(p=>p.title).map(p=>`<div class="paper"><div class="pt">${esc(p.title)}</div><div class="pm">${[p.journal,p.year].filter(Boolean).join(' · ')}${p.topic?' — '+esc(p.topic):''}</div></div>`).join('');
    const collab=(e.network||[]).length?`<h4>Collaborators &amp; KOL network</h4><div class="collab">${e.network.map(esc).join(' · ')}</div>`:'';
    return `<div class="rprof" id="apx-${slug(e.name)}">
      <div class="rhh"><div><h3>${esc(e.name)}</h3><div class="rspec">${esc(e.specialty||'')}${e.facility?' — '+esc(e.facility):''}</div></div>
        <span class="gradepill ${gc}">LITT relevance ${esc(e.grade)}</span></div>
      ${e.identity?`<div class="ident">${esc(e.identity)}</div>`:''}
      ${(e.themes||[]).length?`<div class="themes">${e.themes.map(t=>`<span class="theme">${esc(t)}</span>`).join('')}</div>`:''}
      ${e.rationale?`<div class="rationale"><b>Why they matter:</b> ${esc(e.rationale)}</div>`:''}
      ${papers?`<h4>Key & recent publications</h4>${papers}`:''}
      ${collab}
      <div style="margin-top:9px;display:flex;gap:14px">
        ${e.profileUrl?`<a href="${esc(e.profileUrl)}" target="_blank">Institutional profile ↗</a>`:''}
        ${e.medscout?`<a href="${esc(e.medscout)}" target="_blank">Medscout ↗</a>`:''}
        <span class="backlink" onclick="document.getElementById('page1').scrollIntoView({behavior:'smooth'})">↑ back to card</span>
      </div></div>`;
  }).join('');

  document.getElementById('sheet').innerHTML=`
  <!-- PAGE 1 -->
  <div class="page" id="page1"><div class="page-tag">Page 1 · Snapshot</div>
    <div class="hdr">
      <div>
        <div class="eyebrow">Rank #${a.rank} · ${esc(a.acr)} · ${DATA.meta.territory?'Northeast Territory':''}</div>
        <h1>${esc(a.name)}</h1>
        <div class="sub">${esc(a.system)}</div>
        <div class="pills">
          <span class="pill win-${esc(a.win)}">Win probability: ${esc(a.win||'—')}</span>
          <span class="pill">${esc(h.type)}</span>
          <span class="pill">${esc(h.posture)}</span>
          ${h.platform.map(p=>`<span class="pill">${esc(p)}</span>`).join('')}
        </div>
      </div>
      <div class="hdr-right">${gauge(hl.score,hl.grade)}<div style="font-size:10px;font-weight:700;color:var(--muted);margin-top:-6px">ACCOUNT HEALTH</div></div>
    </div>
    <div class="facts">${factRows}</div>
    ${h.note?`<div class="note-line">▸ ${ed(acr,'h.note',h.note)}</div>`:''}
    <div class="note-line" style="border-color:var(--brand2);background:#eef4f9">${ed(acr,'situation',a.situation)}</div>

    <div class="sec">
      <div class="sec-h"><span class="n">B</span><h2>Business Health</h2><span class="rule"></span></div>
      <div class="biz">
        <div class="health-card">
          <div style="font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--muted);text-transform:uppercase">Health drivers</div>
          ${radar(hl.dims)}
        </div>
        <div>
          <div class="kpis">${kpiHtml}</div>
          <div class="charts2">
            <div class="chart"><div class="ct">Net sales by year</div><div class="csub">consumable + capital, with 2026 projection</div>${salesChart(s,a.projection2026)}</div>
            <div class="chart"><div class="ct">Addressable reservoir / yr</div><div class="csub">LITT-appropriate cases by indication</div>${reservoirChart(a.reservoirs)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sec">
      <div class="sec-h"><span class="n">P</span><h2>Physician Universe</h2><span class="rule"></span></div>
      <div class="uni">
        <div class="ucard"><div class="uh perf">Performing LITT<span>${u.performers.length}</span></div><div class="ubody">${perfHtml}</div></div>
        <div class="ucard"><div class="uh kol">LITT KOLs ★<span>${u.kols.length}</span></div><div class="ubody">${kolHtml}</div></div>
        <div class="ucard"><div class="uh naive">LITT-naïve targets<span>${u.naive.length}</span></div><div class="ubody">${naiveHtml}<div style="font-size:10px;color:var(--muted);margin-top:6px">Click a highlighted name → research appendix</div></div></div>
        <div class="ucard"><div class="uh ref">Referrers by indication<span>${allRef.length}</span></div><div class="ubody" style="max-height:none">${refHtml}</div></div>
      </div>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page" id="page2"><div class="page-tag">Page 2 · Strategy</div>
    <div class="sec" style="margin-top:2px">
      <div class="sec-h"><span class="n">S</span><h2>SWOT Analysis</h2><span class="rule"></span></div>
      <div class="swot">
        ${quad('S','why this is a LITT account','Strengths',S,'sw.S')}
        ${quad('W','address these','Weaknesses',W,'sw.W')}
        ${quad('O','where we grow','Opportunities',O,'sw.O')}
        ${quad('T','report from field','Threats',Th,'sw.T')}
      </div>
    </div>
    <div class="sec">
      <div class="sec-h"><span class="n">T</span><h2>Strategy & Tactics</h2><span class="rule"></span></div>
      <div class="plays">${playsHtml}</div>
    </div>
  </div>

  <!-- APPENDIX -->
  ${apxHtml?`<div class="apx"><div class="page no-break-after" id="appendix">
    <div class="apx-h"><h1>Research Appendix — ${esc(a.name)}</h1>
      <div class="sub">Organized by physician · LITT & LITT-adjacent research relevance · click a name on the card to jump here</div></div>
    ${apxHtml}</div></div>`:''}
  `;
  attachEditors(acr);
  const T2=DATA.meta.territory;
  document.getElementById('foot').innerHTML=`Generated ${DATA.meta.generated} · Sales from 2024–2026 NE exports · Reservoir model @ 5% blended addressable · Region avg $${T2.avg_rev_per_case.toLocaleString()}/case · Confidential — field use`;
  if(EDIT) document.body.classList.add('editing');
}

/* name matching for click-through */
function norm(s){return (s||'').toLowerCase().replace(/[^a-z ]/g,'').split(/\s+/).filter(Boolean);}
function sameName(a,b){const A=norm(a),B=norm(b);return A.length&&B.length&&A[0]===B[0]&&A[A.length-1]===B[B.length-1];}
function slug(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');}
function goApx(name){const el=document.getElementById('apx-'+slug(name));if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.style.boxShadow='0 0 0 2px var(--brand2)';setTimeout(()=>el.style.boxShadow='',1400);}}

/* ---------- edit state ---------- */
function getList(acr,path,def){const ov=store.load(acr);return path in ov?ov[path]:def.slice();}
function attachEditors(acr){
  document.querySelectorAll('[data-edit]').forEach(el=>{
    el.setAttribute('contenteditable',EDIT);
    el.onblur=()=>{const ov=store.load(acr);const p=el.dataset.path;
      // list item?
      if(/\.\d+$/.test(p)&&document.querySelector(`[data-list]`)){ /* handled by list save */ }
      ov[p]=el.innerText.trim(); store.save(acr,ov); flashSaved();};
  });
  // list-based editors save whole array
  document.querySelectorAll('[data-list]').forEach(ul=>{
    ul.querySelectorAll('[data-edit]').forEach(el=>{
      el.onblur=()=>saveList(acr,ul.dataset.list);
    });
  });
}
function saveList(acr,listPath){
  const ul=document.querySelector(`[data-list="${listPath}"]`);if(!ul)return;
  const items=[...ul.querySelectorAll('li [data-edit]')].map(x=>x.innerText.trim()).filter(Boolean);
  const ov=store.load(acr);ov[listPath]=items;store.save(acr,ov);flashSaved();
}
function addItem(listPath){const ov=store.load(CUR.acr);const cur=getList(CUR.acr,listPath, currentDefault(listPath));
  cur.push('New item — edit me');ov[listPath]=cur;store.save(CUR.acr,ov);renderAccount(CUR.acr);document.body.classList.add('editing');}
function delItem(listPath,i){const cur=getList(CUR.acr,listPath,currentDefault(listPath));cur.splice(i,1);
  const ov=store.load(CUR.acr);ov[listPath]=cur;store.save(CUR.acr,ov);renderAccount(CUR.acr);document.body.classList.add('editing');}
function currentDefault(listPath){
  const a=CUR; if(listPath.startsWith('sw.'))return a.swot[listPath.split('.')[1]];
  if(listPath.startsWith('st.')){const i=+listPath.split('.')[1];return a.strategy[i].tactics;}
  return [];
}
function toggleEdit(){EDIT=!EDIT;document.body.classList.toggle('editing',EDIT);
  document.getElementById('editBtn').classList.toggle('on',EDIT);
  document.getElementById('editBtn').innerHTML=EDIT?'✓ Done':'✎ Edit';
  document.querySelectorAll('[data-edit]').forEach(el=>el.setAttribute('contenteditable',EDIT));
  if(EDIT)flash('Editing — click any highlighted text. Changes save to this browser.');}
function resetEdits(){if(!CUR)return;if(confirm('Discard your edits for '+CUR.name+'?')){store.clear(CUR.acr);renderAccount(CUR.acr);}}
let hintT;
function flashSaved(){flash('Saved ✓');}
function flash(msg){const h=document.getElementById('saveHint');h.textContent=msg;clearTimeout(hintT);
  hintT=setTimeout(()=>h.textContent='Northeast Territory · edits save to this browser',1800);}

/* ---------- init ---------- */
(function init(){
  const sel=document.getElementById('acctSel');
  DATA.accounts.sort((a,b)=>a.rank-b.rank).forEach(a=>{
    const o=document.createElement('option');o.value=a.acr;
    o.textContent=`#${a.rank}  ${a.name} (${a.acr}) — ${a.health.grade}`;sel.appendChild(o);
  });
  renderAccount(DATA.meta.flagship||DATA.accounts[0].acr);
})();
</script>
</body>
</html>"""

def build():
    blob = "const DATA=" + json.dumps(DATA, ensure_ascii=False) + ";"
    standalone = TEMPLATE.replace("{{DATA}}", blob)
    for name in ("account-cards-standalone.html", "account-cards.html"):
        with open(os.path.join(ROOT, name), "w") as f:
            f.write(standalone)
    # Artifact body: strip the doctype/html/head/body wrapper (claude.ai supplies it).
    body = standalone
    for i, j in (("<head>", "</head>"),):
        pass
    start = body.index("<style>")
    end = body.index("</script>") + len("</script>")
    artifact = body[start:end]
    with open(os.path.join(ROOT, "account-cards-artifact.html"), "w") as f:
        f.write(artifact)
    print("wrote account-cards*.html  standalone=", len(standalone), " artifact=", len(artifact))

if __name__ == "__main__":
    build()
