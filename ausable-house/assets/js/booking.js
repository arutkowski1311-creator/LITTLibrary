/* booking.js — interactive calendar, date selection, pricing, request submit */
(function(){
  const S = window.SITE, AH = window.AH, AV = window.AVAIL;
  const R = S.ratesRules;
  const sel = document.getElementById("bookProperty");
  const calEl = document.getElementById("bookCal");
  const summaryEl = document.getElementById("bookSummary");
  const noticeEl = document.getElementById("directBookingNotice");
  const formCard = document.getElementById("bookFormCard");
  const addOnList = document.getElementById("addOnList");
  const stairsLine = document.getElementById("ackStairsLine");

  let viewDate = new Date(); viewDate.setDate(1);
  let start=null, end=null, model={blocked:new Set(),buffer:new Set()};

  // property dropdown
  sel.innerHTML = S.properties.map(p=>`<option value="${p.id}">${p.name} — ${p.beds}BR/${p.baths}BA · sleeps ${p.sleeps}</option>`).join("");

  const iso = AV.iso;
  const today = new Date(); today.setHours(0,0,0,0);

  async function loadProperty(){
    start=end=null;
    model = await AV.model(sel.value);
    stairsLine.style.display = sel.value==="the-perch" ? "flex" : "none";
    document.getElementById("ackStairs").required = sel.value==="the-perch";
    renderCal(); renderSummary(); renderAddOns();
  }

  function isBlocked(d){ const k=iso(d); return model.blocked.has(k)||model.buffer.has(k); }

  function renderCal(){
    const y=viewDate.getFullYear(), m=viewDate.getMonth();
    const first=new Date(y,m,1), startDow=first.getDay(), days=new Date(y,m+1,0).getDate();
    const monthName=first.toLocaleString("en-US",{month:"long",year:"numeric"});
    let html=`<div class="cal-head"><button id="prevM">‹</button><strong>${monthName}</strong><button id="nextM">›</button></div>
      <div class="cal-grid">`+["S","M","T","W","T","F","S"].map(d=>`<div class="dow">${d}</div>`).join("");
    for(let i=0;i<startDow;i++) html+=`<div class="cal-day empty"></div>`;
    for(let day=1;day<=days;day++){
      const d=new Date(y,m,day); d.setHours(0,0,0,0); const k=iso(d);
      let cls="cal-day ", clickable=true;
      if(d<today){ cls+="past"; clickable=false; }
      else if(model.blocked.has(k)){ cls+="blocked"; clickable=false; }
      else if(model.buffer.has(k)){ cls+="buffer"; clickable=false; }
      else cls+="avail";
      if(start && k===iso(start)) cls+=" sel";
      if(end && k===iso(end)) cls+=" sel";
      if(start && end && d>start && d<end) cls+=" inrange";
      html+=`<div class="${cls}" ${clickable?`data-d="${k}"`:""}>${day}</div>`;
    }
    html+="</div>";
    calEl.innerHTML=html;
    document.getElementById("prevM").onclick=()=>{viewDate.setMonth(m-1);renderCal();};
    document.getElementById("nextM").onclick=()=>{viewDate.setMonth(m+1);renderCal();};
    calEl.querySelectorAll("[data-d]").forEach(el=>el.onclick=()=>pick(AV.parseISO(el.dataset.d)));
  }

  function pick(d){
    if(!start || (start && end)){ start=d; end=null; }
    else if(d<=start){ start=d; }
    else {
      // ensure no blocked/buffer day sits between start and chosen end
      let cur=new Date(start); let ok=true;
      while(cur<d){ cur.setDate(cur.getDate()+1); if(cur<d && isBlocked(cur)){ ok=false; break; } }
      if(!ok){ AH.toast("Those nights include an unavailable date — pick a clear range."); start=d; end=null; }
      else end=d;
    }
    renderCal(); renderSummary();
  }

  function nights(){ return start&&end ? Math.round((end-start)/86400000) : 0; }

  function isHoliday(d){
    // simple: treat configured holidayMultiplier dates — extend as needed
    return false; // hook for future holiday list
  }

  function priceBreakdown(){
    const p=AH.prop(sel.value); const n=nights();
    let nightly=0;
    let cur=new Date(start);
    for(let i=0;i<n;i++){
      const season=AH.seasonOf(cur);
      let rate=p.rates[season];
      const dow=cur.getDay();
      if(dow===5||dow===6) rate*=R.weekendMultiplier;
      if(isHoliday(cur)) rate*=R.holidayMultiplier;
      nightly+=rate;
      cur.setDate(cur.getDate()+1);
    }
    // add-ons
    let addons=0; const chosen=[];
    addOnList.querySelectorAll("input:checked").forEach(c=>{
      const a=S.addOns.find(x=>x.id===c.value); if(a){ addons+=a.price; chosen.push(a); }
    });
    const platformSubtotal = nightly + p.cleaningFee;
    const directDiscount = platformSubtotal * R.directDiscountPercent;
    const subtotal = platformSubtotal - directDiscount + addons;
    const tax = subtotal * R.taxPercent;
    const total = subtotal + tax;
    const deposit = total * R.depositPercent;
    return {p,n,nightly,addons,chosen,cleaning:p.cleaningFee,directDiscount,subtotal,tax,total,deposit};
  }

  function renderSummary(){
    const p=AH.prop(sel.value);
    if(!start||!end){
      summaryEl.innerHTML=`<h3>${p.name}</h3><p style="color:#d8cfbb">Select your check-in and check-out
        dates on the calendar to see live pricing. Minimum ${p.minNights} nights.</p>`;
      formCard.style.display="none"; noticeEl.innerHTML=""; return;
    }
    const b=priceBreakdown();
    if(b.n < p.minNights){
      summaryEl.innerHTML=`<h3>${p.name}</h3><p style="color:var(--brass-2)">Minimum stay is ${p.minNights} nights.
        You've selected ${b.n}. Extend your dates.</p>`;
      formCard.style.display="none"; return;
    }
    summaryEl.innerHTML=`<h3>${p.name}</h3>
      <div class="line"><span>${iso(start)} → ${iso(end)}</span><span>${b.n} nights</span></div>
      <div class="line"><span>Nightly (seasonal)</span><span>${AH.money(b.nightly)}</span></div>
      <div class="line"><span>Cleaning fee</span><span>${AH.money(b.cleaning)}</span></div>
      ${b.chosen.map(a=>`<div class="line"><span>${a.name}</span><span>${AH.money(a.price)}</span></div>`).join("")}
      <div class="line"><span class="brass">Book-direct savings (${Math.round(R.directDiscountPercent*100)}%)</span><span class="brass">−${AH.money(b.directDiscount)}</span></div>
      <div class="line"><span>Taxes &amp; occupancy (${Math.round(R.taxPercent*100)}%)</span><span>${AH.money(b.tax)}</span></div>
      <div class="line total"><span>Total</span><span>${AH.money(b.total)}</span></div>
      <div class="line" style="border:0;margin-top:.6rem"><span>Non-refundable deposit (${Math.round(R.depositPercent*100)}%)</span><span class="brass">${AH.money(b.deposit)}</span></div>`;

    noticeEl.innerHTML=`<div class="notice warn" style="margin-top:1rem">
      <b>Booking direct:</b> this rate is lower than the online platforms, but it does not include
      AirCover/platform guest protection, and the deposit is <b>non-refundable</b>. See the checkboxes below.</div>`;
    formCard.style.display="block";
  }

  function renderAddOns(){
    const season = start?AH.seasonOf(start):"all";
    addOnList.innerHTML=S.addOns
      .filter(a=>a.seasons.includes("all")||a.seasons.includes(season))
      .map(a=>`<label class="checkline" style="background:var(--white);border:1px solid #e0d6c0;border-radius:10px;padding:.6rem .8rem">
        <input type="checkbox" value="${a.id}"><span><b>${a.name}</b><br>
        <span class="muted">${AH.money(a.price)} ${a.unit}</span></span></label>`).join("");
    addOnList.querySelectorAll("input").forEach(c=>c.addEventListener("change",renderSummary));
  }

  // submit -> compose email to owner (no backend needed; payment link sent on confirm)
  document.getElementById("bookForm").addEventListener("submit", e=>{
    e.preventDefault();
    if(sel.value==="the-perch" && !document.getElementById("ackStairs").checked){
      AH.toast("Please acknowledge the outdoor-stairs access note."); return;
    }
    const b=priceBreakdown(); const f=e.target;
    const body =
`NEW BOOKING REQUEST — ${b.p.name}
--------------------------------
Guest: ${f.name.value}
Email: ${f.email.value}
Phone: ${f.phone.value}
Guests: ${f.guests.value}

Dates: ${iso(start)} check-in → ${iso(end)} check-out (${b.n} nights)
Add-ons: ${b.chosen.map(a=>a.name).join(", ")||"none"}

Estimated total: ${AH.money(b.total)}
Non-refundable deposit due: ${AH.money(b.deposit)}

Notes: ${f.notes.value||"—"}

Acknowledged: direct-booking terms, winter/safety notice, liability waiver & house rules.
${sel.value==="the-perch"?"Acknowledged: outdoor-stairs access.":""}`;
    location.href = AH.mailto(`Booking Request — ${b.p.name} (${iso(start)}→${iso(end)})`, body);
    AH.toast("Opening your email to send the request…");
  });

  sel.addEventListener("change", loadProperty);
  loadProperty();
})();
