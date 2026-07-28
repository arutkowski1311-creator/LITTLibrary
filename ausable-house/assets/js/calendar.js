/* calendar.js — availability model: manual blocks + iCal feeds + turnover buffers
   -----------------------------------------------------------------------------
   Produces window.AVAIL.blockedSet(propertyId) -> Set of "YYYY-MM-DD" that are
   unavailable, and window.AVAIL.bufferSet(propertyId) for turnover cushion days.

   iCal sync note: Airbnb/Vrbo publish a read-only .ics export URL. Browsers
   usually can't fetch those directly (CORS), so we route through a public proxy
   (r.jina.ai). This is ONE-WAY (their bookings block your calendar). For true
   TWO-WAY sync + payments, connect a channel manager (see README).
   ============================================================================= */
(function(){
  const S = window.SITE;
  const iso = d => d.toISOString().slice(0,10);
  const parseISO = s => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };

  // expand a {start,end} (end exclusive, hotel-style) into date strings
  function expandRange(startStr, endStr){
    const out=[]; let d=parseISO(startStr); const end=parseISO(endStr);
    while(d < end){ out.push(iso(d)); d.setDate(d.getDate()+1); }
    return out;
  }
  // n buffer days AFTER a checkout date (end is exclusive checkout day)
  function bufferAfter(endStr, n){
    const out=[]; let d=parseISO(endStr);
    for(let i=0;i<n;i++){ out.push(iso(d)); d.setDate(d.getDate()+1); }
    return out;
  }

  const cache = {}; // propertyId -> {blocked:Set, buffer:Set, ranges:[]}

  function baseModel(propertyId){
    const prop = window.AH.prop(propertyId);
    const blocked = new Set(), buffer = new Set(), ranges = [];
    (S.availability.manualBlocks[propertyId]||[]).forEach(r=>{
      ranges.push(r);
      expandRange(r.start, r.end).forEach(d=>blocked.add(d));
      bufferAfter(r.end, prop.turnoverDays).forEach(d=>buffer.add(d));
    });
    return {blocked, buffer, ranges};
  }

  // very small iCal VEVENT extractor (DTSTART/DTEND, all-day style)
  function parseICS(text, prop){
    const events=[];
    const blocks = text.split("BEGIN:VEVENT").slice(1);
    blocks.forEach(b=>{
      const s = (b.match(/DTSTART[^:]*:(\d{8})/)||[])[1];
      const e = (b.match(/DTEND[^:]*:(\d{8})/)||[])[1];
      if(s && e){
        const f = x => `${x.slice(0,4)}-${x.slice(4,6)}-${x.slice(6,8)}`;
        events.push({start:f(s), end:f(e)});
      }
    });
    return events;
  }

  async function withFeeds(propertyId){
    const model = baseModel(propertyId);
    const prop = window.AH.prop(propertyId);
    const feeds = S.availability.icalFeeds[propertyId]||[];
    for(const url of feeds){
      try{
        // public read-only proxy to sidestep CORS on platform .ics files
        const res = await fetch("https://r.jina.ai/"+url, {headers:{Accept:"text/calendar"}});
        const txt = await res.text();
        parseICS(txt, prop).forEach(ev=>{
          model.ranges.push(ev);
          expandRange(ev.start, ev.end).forEach(d=>model.blocked.add(d));
          bufferAfter(ev.end, prop.turnoverDays).forEach(d=>model.buffer.add(d));
        });
      }catch(err){ /* feed unavailable — fall back to manual blocks silently */ }
    }
    return model;
  }

  window.AVAIL = {
    // async because feeds may be fetched; resolves to {blocked,buffer,ranges}
    async model(propertyId){
      if(cache[propertyId]) return cache[propertyId];
      const m = await withFeeds(propertyId);
      cache[propertyId] = m;
      return m;
    },
    expandRange, bufferAfter, iso, parseISO,
    // export the owner's own bookings as a downloadable .ics for pasting into Airbnb/Google
    exportICS(propertyId){
      const m = baseModel(propertyId);
      let out = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AusableHouse//EN\n";
      m.ranges.forEach((r,i)=>{
        out += `BEGIN:VEVENT\nUID:ah-${propertyId}-${i}@ausablehouse\n`+
               `DTSTART;VALUE=DATE:${r.start.replace(/-/g,"")}\nDTEND;VALUE=DATE:${r.end.replace(/-/g,"")}\n`+
               `SUMMARY:Booked (Ausable House direct)\nEND:VEVENT\n`;
      });
      out += "END:VCALENDAR";
      return out;
    }
  };
})();
