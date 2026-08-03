/* pricing.js — derive nightly base rates from comparable homes
   -----------------------------------------------------------------------------
   window.PRICING.rateFor(propertyId, season) -> nightly base (before weekend/
   holiday/seasonal-multiplier logic in booking.js).

   Source of truth priority:
     1. window.SITE_RATES  (snapshot written at set times by the cron job,
        assets/js/rates.js) — lets prices refresh on a schedule.
     2. live computation from SITE.pricing.comps  (this file).
     3. the property's own `rates` (fixed fallback).
   The SAME math runs in scripts/update-pricing.js so the cron and the live site
   always agree.
   ============================================================================= */
(function(){
  const S = window.SITE;
  const P = S.pricing || { mode:"fixed" };
  const SEASONS = ["winter","spring","summer","fall"];

  function summarize(vals, method){
    if(!vals.length) return null;
    const a = vals.slice().sort((x,y)=>x-y);
    if(method === "mean") return a.reduce((s,v)=>s+v,0)/a.length;
    if(method === "trimmedMean" && a.length >= 4){
      const t = a.slice(1, -1); return t.reduce((s,v)=>s+v,0)/t.length;
    }
    // median (default)
    const m = Math.floor(a.length/2);
    return a.length % 2 ? a[m] : (a[m-1]+a[m])/2;
  }

  function compsFor(prop){
    const [lo,hi] = prop.compBedrooms || [0, 99];
    return (P.comps||[]).filter(c => c.bedrooms >= lo && c.bedrooms <= hi);
  }

  // live computation of the base nightly rate for one property + season
  function computeRate(propId, season){
    const prop = window.AH ? window.AH.prop(propId) : S.properties.find(p=>p.id===propId);
    if(!prop) return 0;
    if(P.mode !== "comps") return prop.rates[season];
    const vals = compsFor(prop).map(c => c.rates && c.rates[season]).filter(v => typeof v === "number");
    const stat = summarize(vals, P.method);
    if(stat == null) return prop.rates[season];             // no comps -> fixed fallback
    let rate = stat * (P.positioning ?? 1);
    const floor = (P.floorRate||{})[propId];
    if(typeof floor === "number") rate = Math.max(rate, floor);
    const r = P.roundTo || 1;
    return Math.round(rate / r) * r;
  }

  window.PRICING = {
    seasons: SEASONS,
    compsFor,
    // rate for a property + season, honoring the priority chain above
    rateFor(propId, season){
      const snap = window.SITE_RATES && window.SITE_RATES.rates
        && window.SITE_RATES.rates[propId] && window.SITE_RATES.rates[propId][season];
      if(typeof snap === "number") return snap;
      return computeRate(propId, season);
    },
    computeRate,
    // full table for the owner pricing view
    table(){
      return S.properties.map(prop => ({
        id: prop.id, name: prop.name,
        comps: compsFor(prop),
        rates: SEASONS.reduce((o,s)=>{ o[s] = this.rateFor(prop.id, s); return o; }, {})
      }));
    },
    lastUpdated: (window.SITE_RATES && window.SITE_RATES.generatedAt) || null
  };
})();
