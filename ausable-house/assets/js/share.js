/* share.js — generate a mobile story image (1080x1920) + caption + hashtags */
(function(){
  const S = window.SITE, AH = window.AH;
  const canvas = document.getElementById("shareCanvas");
  const ctx = canvas.getContext("2d");
  const propSel = document.getElementById("shareProperty");
  const datesEl = document.getElementById("shareDates");
  const vibeEl = document.getElementById("shareVibe");
  const captionEl = document.getElementById("shareCaption");
  const tagsEl = document.getElementById("shareHashtags");

  propSel.innerHTML = S.properties.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");
  let imgIndex = 0;
  const imgs = S.media.shareImages.length ? S.media.shareImages : [null];

  function draw(){
    const W=canvas.width, H=canvas.height;
    const propName = AH.prop(propSel.value).name;
    ctx.clearRect(0,0,W,H);

    const finish = ()=>{
      // gradient scrim (black)
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,"rgba(8,8,10,.5)"); g.addColorStop(.5,"rgba(8,8,10,.1)");
      g.addColorStop(1,"rgba(6,6,8,.95)");
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

      // thin gold frame
      ctx.strokeStyle="rgba(200,162,76,.5)"; ctx.lineWidth=3;
      ctx.strokeRect(40,40,W-80,H-80);

      // top eyebrow
      ctx.fillStyle="#c8a24c"; ctx.font="600 34px Inter, sans-serif"; ctx.textAlign="center";
      ctx.fillText("W I L M I N G T O N ,   N Y", W/2, 150);

      // brand
      ctx.fillStyle="#f6f3ec"; ctx.font="600 92px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(propName.toUpperCase(), W/2, 260);

      // vibe / dates block near bottom
      let by = H-360;
      if(datesEl.value){ ctx.fillStyle="#e6c983"; ctx.font="italic 600 58px 'Cormorant Garamond', serif";
        ctx.fillText(datesEl.value, W/2, by); by+=82; }
      ctx.fillStyle="#d6d2c8"; ctx.font="400 40px Inter, sans-serif";
      const vibe = vibeEl.value || "Adirondack air, Whiteface views, and quiet woods";
      wrap(vibe, W/2, by, W-180, 50);

      // footer CTA
      ctx.fillStyle="#c8a24c"; ctx.font="700 40px Inter, sans-serif";
      ctx.fillText("BOOK DIRECT", W/2, H-160);
      ctx.fillStyle="#f6f3ec"; ctx.font="400 34px Inter, sans-serif";
      ctx.fillText((S.brand.url||"").replace(/^https?:\/\//,""), W/2, H-105);
    };

    const src = imgs[imgIndex % imgs.length];
    if(src){
      const im=new Image(); im.crossOrigin="anonymous";
      im.onload=()=>{ coverDraw(im,W,H); finish(); };
      im.onerror=()=>{ bgFallback(W,H); finish(); };
      im.src=src;
    } else { bgFallback(W,H); finish(); }
  }

  function coverDraw(im,W,H){
    const r=Math.max(W/im.width,H/im.height);
    const w=im.width*r, h=im.height*r;
    ctx.drawImage(im,(W-w)/2,(H-h)/2,w,h);
  }
  function bgFallback(W,H){
    const g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,"#211b0f"); g.addColorStop(.5,"#12100b"); g.addColorStop(1,"#0a0a0c");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(200,162,76,.18)"; ctx.font="italic 40px 'Cormorant Garamond', serif";
    ctx.textAlign="center"; ctx.fillText("(add photos in config.js)", W/2, H/2);
  }
  function wrap(text,x,y,maxW,lh){
    const words=text.split(" "); let line="", yy=y;
    ctx.textAlign="center";
    words.forEach(w=>{
      const test=line+w+" ";
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line.trim(),x,yy); line=w+" "; yy+=lh; }
      else line=test;
    });
    ctx.fillText(line.trim(),x,yy);
  }

  function caption(){
    const p=AH.prop(propSel.value);
    const tmpl=S.share.captionTemplate
      .replace("{property}", p.name)
      .replace("{dates}", datesEl.value||"A few days")
      .replace("{vibe}", vibeEl.value||"all the quiet we can handle");
    return tmpl + "\n" + S.brand.url;
  }
  function renderCaption(){
    captionEl.textContent = caption();
    tagsEl.innerHTML = S.share.hashtags.map(t=>`<span class="tag">${t}</span>`).join("");
  }

  [propSel,datesEl,vibeEl].forEach(el=>el.addEventListener("input",()=>{draw();renderCaption();}));
  document.getElementById("cycleShare").addEventListener("click",()=>{imgIndex++;draw();});
  document.getElementById("downloadShare").addEventListener("click",()=>{
    const a=document.createElement("a");
    a.download=`AusableHouse-${propSel.value}-share.png`;
    a.href=canvas.toDataURL("image/png"); a.click();
    AH.toast("Share image downloaded — post it and tag your trip!");
  });
  document.getElementById("copyCaption").addEventListener("click",async()=>{
    const text = caption()+"\n\n"+S.share.hashtags.join(" ");
    try{ await navigator.clipboard.writeText(text); AH.toast("Caption + hashtags copied!"); }
    catch{ AH.toast("Select and copy the caption text."); }
  });

  draw(); renderCaption();
})();
