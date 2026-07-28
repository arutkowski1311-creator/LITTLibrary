/* main.js — nav, hero, content injection, shared helpers */
(function(){
  const S = window.SITE;

  /* ---------- shared helpers (exposed) ---------- */
  window.AH = {
    money: n => "$" + Math.round(n).toLocaleString("en-US"),
    toast: msg => {
      const t = document.getElementById("toast");
      t.textContent = msg; t.classList.add("show");
      clearTimeout(window._tt); window._tt = setTimeout(()=>t.classList.remove("show"), 3200);
    },
    // season from a Date
    seasonOf: d => {
      const m = d.getMonth()+1;
      if (m>=12 || m<=2) return "winter";
      if (m>=3 && m<=5)  return "spring";
      if (m>=6 && m<=8)  return "summer";
      return "fall";
    },
    prop: id => S.properties.find(p=>p.id===id),
    // mailto builder (works with any email client; no backend required)
    mailto: (subject, body) =>
      `mailto:${S.brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- reveal-on-scroll observer (defined early so all sections can use it) ---------- */
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target);} });
  }, {threshold:.12});

  /* ---------- nav ---------- */
  const nav = document.getElementById("nav");
  addEventListener("scroll", ()=>nav.classList.toggle("scrolled", scrollY>60));
  const toggle = document.getElementById("navtoggle");
  const links = document.getElementById("navlinks");
  toggle.addEventListener("click", ()=>links.classList.toggle("open"));
  links.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>links.classList.remove("open")));

  /* ---------- hero video ---------- */
  const video = document.getElementById("heroVideo");
  const fallback = document.getElementById("heroFallback");
  if (S.media.heroPoster) video.poster = S.media.heroPoster;
  // Only load the video source if a file is configured; otherwise keep gradient fallback.
  if (S.media.heroVideo){
    const src = document.createElement("source");
    src.src = S.media.heroVideo; src.type = "video/mp4";
    video.appendChild(src);
    video.addEventListener("loadeddata", ()=>{ fallback.style.display="none"; });
    video.addEventListener("error", ()=>{ video.style.display="none"; });
    video.load();
  } else { video.style.display="none"; }

  /* ---------- property cards ---------- */
  const pc = document.getElementById("propertyCards");
  pc.innerHTML = S.properties.map(p=>{
    const access = p.accessNote
      ? `<div class="notice warn"><b>Access note:</b> ${p.accessNote}</div>` : "";
    const rateFrom = Math.min(...Object.values(p.rates));
    return `<div class="card reveal">
      <div class="media">${firstImageFor(p.id) || p.name}</div>
      <div class="pad">
        <p class="eyebrow" style="margin-bottom:.4rem">${p.subtitle}</p>
        <h3>${p.name}</h3>
        <div class="spec"><span><b>${p.beds}</b> bed</span><span><b>${p.baths}</b> bath</span>
          <span>sleeps <b>${p.sleeps}</b></span><span>from <b>${window.AH.money(rateFrom)}</b>/night</span></div>
        <p>${p.description}</p>
        <ul class="feat">${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>
        ${access}
        <a href="#book" class="btn" data-prop="${p.id}">Check ${p.name} Dates</a>
      </div></div>`;
  }).join("");
  document.getElementById("bundleNote").innerHTML = "<b>Rent both together:</b> " + S.bundleNote;

  function firstImageFor(id){
    const g = S.media.gallery.find(x=>x.type==="image" && (x.tags||[]).includes(id==="the-perch"?"perch":"main"));
    return g ? `<img src="${g.src}" alt="" onerror="this.parentNode.textContent='Photo coming soon'">` : "";
  }
  // clicking a property CTA preselects it in the booking widget
  pc.addEventListener("click", e=>{
    const b = e.target.closest("[data-prop]");
    if (b){ const sel=document.getElementById("bookProperty"); if(sel){ sel.value=b.dataset.prop; sel.dispatchEvent(new Event("change")); } }
  });

  /* ---------- gallery ---------- */
  const grid = document.getElementById("galleryGrid");
  const filters = document.getElementById("galleryFilters");
  const cats = [["all","All"],["main","Ausable House"],["perch","The Perch"],["area","The Area"]];
  filters.innerHTML = cats.map((c,i)=>`<button data-f="${c[0]}" class="${i===0?'active':''}">${c[1]}</button>`).join("");
  function renderGallery(f){
    const items = S.media.gallery.filter(g=> f==="all" || (g.tags||[]).includes(f));
    grid.innerHTML = items.map((g,i)=>{
      const media = g.type==="video"
        ? `<video src="${g.src}" ${g.poster?`poster="${g.poster}"`:""} muted></video><span class="playbadge">▶ Video</span>`
        : `<img src="${g.src}" alt="${g.caption||""}" loading="lazy" onerror="this.closest('.tile').style.display='none'">`;
      return `<div class="tile" data-i="${S.media.gallery.indexOf(g)}">${media}<div class="cap">${g.caption||""}</div></div>`;
    }).join("") || `<p class="muted center" style="columns:1">Photos &amp; videos coming soon — add them in <code>config.js</code>.</p>`;
  }
  filters.addEventListener("click", e=>{
    const b=e.target.closest("button"); if(!b)return;
    filters.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active"); renderGallery(b.dataset.f);
  });
  renderGallery("all");

  /* ---------- lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbc = document.getElementById("lightboxContent");
  grid.addEventListener("click", e=>{
    const tile = e.target.closest(".tile"); if(!tile)return;
    const g = S.media.gallery[+tile.dataset.i];
    lbc.innerHTML = g.type==="video"
      ? `<video src="${g.src}" controls autoplay ${g.poster?`poster="${g.poster}"`:""}></video>`
      : `<img src="${g.src}" alt="${g.caption||""}">`;
    lb.classList.add("open");
  });
  document.getElementById("lightboxClose").addEventListener("click", ()=>{lb.classList.remove("open");lbc.innerHTML="";});
  lb.addEventListener("click", e=>{ if(e.target===lb){lb.classList.remove("open");lbc.innerHTML="";} });

  /* ---------- area guide ---------- */
  document.getElementById("guideGrid").innerHTML = S.areaGuide.map(a=>
    `<div class="guide-card reveal"><span class="dist">${a.dist}</span>
      <div class="cat">${a.cat}</div><h3 style="font-size:1.25rem;margin:.3rem 0 .5rem">${a.name}</h3>
      <p style="font-size:.92rem;color:#4a4d40">${a.blurb}</p></div>`).join("");

  /* ---------- testimonials + Google ---------- */
  const rv = S.reviews||{};
  const tg = document.getElementById("testimonialGrid");
  if(tg){
    tg.innerHTML = (rv.testimonials||[]).map(t=>`
      <div class="tstm reveal">
        <span class="stay">${t.stay}</span>
        <div class="stars">${"★".repeat(t.rating||5)}</div>
        <p class="quote">“${t.text}”</p>
        <p class="who">${t.name} <span>· ${t.location}</span></p>
      </div>`).join("");
    document.querySelectorAll("#testimonialGrid .reveal").forEach(el=>io.observe(el));
  }
  const gr = document.getElementById("googleReviews");
  if(gr){
    gr.innerHTML = `
      <a class="google-badge" href="${rv.googleReadUrl||'#'}" target="_blank" rel="noopener">
        <span class="g"><b>G</b><b>o</b><b>o</b><b>g</b><b>l</b><b>e</b></span>
        <span>★★★★★ Read our reviews</span></a>
      <a class="btn btn-dark" style="margin-left:.6rem" href="${rv.googleWriteUrl||'#'}" target="_blank" rel="noopener">Leave a Review</a>`;
  }

  /* ---------- social hashtag feed ---------- */
  const sh = S.social||{};
  const heading = document.getElementById("socialHeading");
  if(heading && sh.hashtag) heading.textContent = sh.hashtag;
  const sf = document.getElementById("socialFeed");
  if(sf){
    if(sh.aggregatorEmbed){
      // live feed from an aggregator (EmbedSocial / Curator / Taggbox / Elfsight)
      sf.innerHTML = sh.aggregatorEmbed;
    } else {
      sf.innerHTML = `<div class="social-grid">${(sh.posts||[]).map(p=>`
        <div class="social-tile">
          <img src="${p.img}" alt="${p.caption||''}" loading="lazy" onerror="this.closest('.social-tile').style.background='linear-gradient(135deg,#2b3d31,#101a14)'">
          <div class="meta"><b>${p.handle||''}</b>${p.caption||''}</div>
        </div>`).join("")}</div>
        <div class="social-cta">
          <a class="btn" href="${sh.instagram||'#'}" target="_blank" rel="noopener">Follow on Instagram</a>
          <p class="muted" style="font-size:.82rem;margin-top:.8rem">Tag <b>${sh.hashtag}</b> to be featured.</p>
        </div>`;
    }
  }

  /* ---------- contact ---------- */
  document.getElementById("contactInfo").innerHTML = `
    <li><b>Email:</b> <a href="mailto:${S.brand.email}" style="color:var(--brass-2)">${S.brand.email}</a></li>
    <li><b>Phone / text:</b> ${S.brand.phone}</li>
    <li><b>Where:</b> ${S.brand.location}</li>
    <li><b>Typical response:</b> within 24 hours</li>`;

  document.getElementById("messageForm").addEventListener("submit", e=>{
    e.preventDefault();
    const f = e.target;
    const body = `Message from ${f.name.value} (${f.email.value}):\n\n${f.message.value}`;
    location.href = window.AH.mailto("Ausable House — Website Inquiry", body);
    window.AH.toast("Opening your email to send…");
  });

  /* ---------- reveal on scroll: observe everything now on the page ---------- */
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));

  /* ---------- legal doc modal ---------- */
  const modal = document.getElementById("docModal");
  const dc = document.getElementById("docContent");
  document.body.addEventListener("click", e=>{
    const link = e.target.closest("[data-doc]"); if(!link)return;
    e.preventDefault();
    const doc = window.LEGAL[link.dataset.doc];
    if(doc){ dc.innerHTML = doc; modal.classList.add("open"); }
  });
  document.getElementById("docClose").addEventListener("click", ()=>modal.classList.remove("open"));
  modal.addEventListener("click", e=>{ if(e.target===modal) modal.classList.remove("open"); });
})();
