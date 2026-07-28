/* concierge.js — optional survey -> tailored itinerary -> downloadable PDF
   -----------------------------------------------------------------------------
   Rule-based matching engine over SITE.areaGuide (your activity library),
   weighted by season, group ages, stated interests, party size, and the dates
   (flags overlapping local events + seasonal weather notes). Emergency info and
   directions are always appended. Designed so YOU can bolt on richer logic and
   an AI call later — see buildItinerary() and the scoring function.
   ============================================================================= */
(function(){
  const S = window.SITE, AH = window.AH;
  const form = document.getElementById("conciergeForm");

  const STATE = { purpose:[], ages:[], interests:[], guests:2, dates:"", agenda:"" };

  const chipGroup = (key, label, opts) => `
    <div class="q"><label style="display:block;font-weight:600;color:var(--cream);margin-bottom:.6rem">${label}</label>
      <div class="chips" data-group="${key}">
        ${opts.map(o=>`<div class="chip" data-val="${o}">${o}</div>`).join("")}
      </div></div>`;

  form.innerHTML = `
    <div class="row-2">
      <div class="field"><label style="color:var(--cream)">Number of guests</label>
        <input type="number" min="1" id="cGuests" value="2"></div>
      <div class="field"><label style="color:var(--cream)">Your dates (optional)</label>
        <input id="cDates" type="text" placeholder="e.g. 2026-08-12 to 2026-08-16"></div>
    </div>
    ${chipGroup("purpose","Why are you coming? (pick any)",
      ["Relaxation","Adventure","Family time","Skiing","Fishing","Hiking","Romance","Celebration","Remote work"])}
    ${chipGroup("ages","Who's in the group?",
      ["Kids","Teens","Adults","Seniors"])}
    ${chipGroup("interests","What are you into?",
      ["Skiing","Hiking","Fishing","Biking","Swimming","Scenery","Dining","History","Family attractions","Just the quiet"])}
    <div class="field"><label style="color:var(--cream)">Already have plans on the agenda? (optional)</label>
      <textarea id="cAgenda" rows="2" placeholder="e.g. a day at Whiteface, dinner in Lake Placid Friday"></textarea></div>`;

  form.querySelectorAll(".chips").forEach(g=>{
    g.addEventListener("click", e=>{
      const c=e.target.closest(".chip"); if(!c)return;
      c.classList.toggle("on");
      const group=g.dataset.group;
      STATE[group] = [...g.querySelectorAll(".chip.on")].map(x=>x.dataset.val);
    });
  });

  function parseDates(str){
    const found = (str.match(/\d{4}-\d{2}-\d{2}/g)||[]);
    if(found.length) return found.map(s=>new Date(s+"T00:00:00"));
    return [];
  }

  function seasonNotes(season){
    return ({
      winter:"Expect cold, snow, and ice. Dress in layers, carry traction, and allow extra travel time. A 4×4/AWD is strongly recommended for the driveway.",
      spring:"Mud season and high, cold rivers — great fishing, variable trails. Waterproof boots recommended.",
      summer:"Warm days, cool nights. Bring bug spray for the woods and sun protection for the water.",
      fall:"Crisp days and spectacular foliage. Bring layers; peak color draws crowds to popular spots."
    })[season];
  }

  // ---- scoring engine (extend freely; add AI suggestions to `extras`) ----
  function scoreActivity(a, ctx){
    let s=0;
    if(a.season.includes(ctx.season)) s+=3; else s-=2;
    ctx.interestTags.forEach(t=>{ if((a.interests||[]).some(i=>i.toLowerCase().includes(t))) s+=2; });
    // age fit
    if(ctx.ages.includes("Kids") && (a.forAges||[]).includes("kids")) s+=1.5;
    if(ctx.ages.includes("Seniors") && (a.forAges||[]).includes("seniors")) s+=1;
    if((a.forAges||[]).includes("all")) s+=1;
    return s;
  }

  function overlappingEvents(dates){
    if(!dates.length) return [];
    const md = d => `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const range = [];
    // sample each day in range
    let cur=new Date(dates[0]); const last=dates[dates.length-1];
    while(cur<=last){ range.push(md(cur)); cur.setDate(cur.getDate()+1); }
    return S.events.filter(ev => range.some(x => x>=ev.start && x<=ev.end));
  }

  function buildItinerary(){
    STATE.guests = +document.getElementById("cGuests").value||2;
    STATE.dates = document.getElementById("cDates").value;
    STATE.agenda = document.getElementById("cAgenda").value;

    const dates = parseDates(STATE.dates);
    const season = dates.length ? AH.seasonOf(dates[0]) : (STATE.purpose.includes("Skiing")?"winter":"summer");
    const interestTags = [...STATE.interests, ...STATE.purpose].map(x=>x.toLowerCase());
    const ctx = { season, ages:STATE.ages, interestTags };

    const ranked = S.areaGuide
      .map(a=>({a, s:scoreActivity(a,ctx)}))
      .sort((x,y)=>y.s-x.s)
      .filter(x=>x.s>0)
      .map(x=>x.a);

    const events = overlappingEvents(dates);
    const nights = dates.length>=2 ? Math.round((dates[dates.length-1]-dates[0])/86400000) : 3;
    const days = Math.max(1, Math.min(nights, 5));

    // distribute top activities across days (2 per day)
    const plan=[]; let idx=0;
    for(let d=1; d<=days; d++){
      const picks = ranked.slice(idx, idx+2); idx+=2;
      plan.push({day:d, picks});
    }
    return {season, days, plan, events, ranked, ctx, dates};
  }

  function renderPreview(it){
    const em = S.brand.emergency;
    const eventHtml = it.events.length
      ? `<h4>Happening during your stay</h4><ul class="feat">${it.events.map(e=>`<li><b>${e.name}</b></li>`).join("")}</ul>`
      : "";
    const html = `<div class="itinerary-preview">
      <p class="eyebrow">Your Tailored Itinerary · ${it.season[0].toUpperCase()+it.season.slice(1)}</p>
      <h3 style="color:var(--forest)">Your Adirondack Days${it.dates.length?` · ${STATE.dates}`:""}</h3>
      <p class="muted">Curated for ${STATE.guests} guest${STATE.guests>1?"s":""}${STATE.ages.length?` (${STATE.ages.join(", ")})`:""}
        based on your interests. Everything is optional — mix, match, or just relax.</p>
      <div class="notice"><b>Seasonal note:</b> ${seasonNotes(it.season)}</div>
      ${eventHtml}
      ${it.plan.map(d=>`<div class="day-block"><h4 style="margin:.2rem 0">Day ${d.day}</h4>
        ${d.picks.length? d.picks.map(p=>`<p style="margin:.3rem 0"><b>${p.name}</b> <span class="muted">· ${p.cat} · ${p.dist} away</span><br>
          <span style="font-size:.9rem">${p.blurb}</span></p>`).join("")
          : `<p class="muted">An open day — rest by the fire, read, or wander the woods.</p>`}
      </div>`).join("")}
      ${STATE.agenda?`<h4>Your own plans</h4><p>${STATE.agenda}</p>`:""}
      <h4>Emergency &amp; directions</h4>
      <p style="font-size:.9rem"><b>Property:</b> ${em.addressLine}<br>
        <b>Emergencies:</b> 911<br>
        <b>Nearest hospital:</b> ${em.nearestHospital} — ${em.hospitalPhone}<br>
        <b>Poison control:</b> ${em.poison}<br>
        <b>${em.nonEmergency}</b><br>
        <b>Host:</b> ${S.brand.ownerName} · ${S.brand.phone}</p>
      <div style="text-align:center;margin-top:1.5rem">
        <button class="btn btn-lg" id="downloadPdf">Download PDF Itinerary</button>
      </div></div>`;
    document.getElementById("itineraryPreview").innerHTML = html;
    document.getElementById("downloadPdf").onclick = ()=>makePDF(it);
    document.getElementById("itineraryPreview").scrollIntoView({behavior:"smooth",block:"start"});
  }

  // ---- PDF generation via jsPDF ----
  function makePDF(it){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit:"pt",format:"letter"});
    const W = doc.internal.pageSize.getWidth();
    const M = 54; let y = 70;
    const em = S.brand.emergency;

    const line = (txt,size,color,font="normal",gap=16)=>{
      doc.setFont("times",font); doc.setFontSize(size); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(txt, W-2*M);
      lines.forEach(l=>{ if(y>740){doc.addPage(); y=70;} doc.text(l,M,y); y+=gap; });
    };

    // header band
    doc.setFillColor(31,45,36); doc.rect(0,0,W,44,"F");
    doc.setTextColor(202,166,104); doc.setFont("times","bold"); doc.setFontSize(18);
    doc.text("AUSABLE HOUSE", M, 29);
    doc.setTextColor(230,220,199); doc.setFontSize(9); doc.setFont("times","italic");
    doc.text("Your Adirondack Concierge Itinerary", W-M, 29, {align:"right"});

    line("Your Tailored Itinerary", 24, [31,45,36], "bold", 28);
    line(`${it.season[0].toUpperCase()+it.season.slice(1)}${STATE.dates?` · ${STATE.dates}`:""} · ${STATE.guests} guest(s)${STATE.ages.length?` · ${STATE.ages.join(", ")}`:""}`, 11, [120,120,110], "italic", 22);

    line("Seasonal note", 13, [176,137,79], "bold", 18);
    line(seasonNotes(it.season), 10.5, [40,40,35], "normal", 15);
    y+=6;

    if(it.events.length){
      line("Happening during your stay", 13, [176,137,79], "bold", 18);
      it.events.forEach(e=>line("• "+e.name, 10.5, [40,40,35], "normal", 15));
      y+=6;
    }

    it.plan.forEach(d=>{
      line(`Day ${d.day}`, 14, [31,45,36], "bold", 20);
      if(d.picks.length){
        d.picks.forEach(p=>{
          line(`${p.name}  —  ${p.cat} · ${p.dist} away`, 11.5, [31,45,36], "bold", 16);
          line(p.blurb, 10.5, [60,60,55], "normal", 14);
          y+=4;
        });
      } else line("An open day — rest by the fire, read, or wander the woods.", 10.5, [90,90,80], "italic", 15);
      y+=8;
    });

    if(STATE.agenda){ line("Your own plans", 13,[176,137,79],"bold",18); line(STATE.agenda,10.5,[40,40,35],"normal",15); y+=6; }

    if(y>620){ doc.addPage(); y=70; }
    doc.setDrawColor(200,180,140); doc.line(M,y,W-M,y); y+=20;
    line("Emergency & Directions", 14, [140,50,20], "bold", 20);
    line(`Property address: ${em.addressLine}`, 10.5, [40,40,35], "normal", 15);
    line("In any emergency, call 911.", 11, [140,50,20], "bold", 16);
    line(`Nearest hospital: ${em.nearestHospital} — ${em.hospitalPhone}`, 10.5, [40,40,35], "normal", 15);
    line(`Poison control: ${em.poison}`, 10.5, [40,40,35], "normal", 15);
    line(em.nonEmergency, 10.5, [40,40,35], "normal", 15);
    line(`Host: ${S.brand.ownerName} · ${S.brand.phone} · ${S.brand.email}`, 10.5, [40,40,35], "normal", 15);

    doc.setFontSize(8); doc.setTextColor(150,150,140); doc.setFont("times","italic");
    doc.text("Generated by Ausable House · ausablehouse.com · Suggestions only — verify hours, conditions, and licenses (NY DEC fishing license required).",
      M, 760, {maxWidth:W-2*M});

    doc.save("Ausable-House-Itinerary.pdf");
    AH.toast("Your itinerary PDF is downloading.");
  }

  document.getElementById("buildItinerary").addEventListener("click", ()=>{
    renderPreview(buildItinerary());
  });

  // expose so you can plug in AI-generated extras later:
  window.CONCIERGE = { buildItinerary, scoreActivity };
})();
