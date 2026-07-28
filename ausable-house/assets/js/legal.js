/* legal.js — guest-facing legal documents shown in the modal.
   =============================================================================
   ⚠️  IMPORTANT: These are STARTER TEMPLATES, not legal advice. Before you go
   live, have a New York attorney (ideally one who knows short-term-rental /
   Adirondack Park law) review and finalize every document below. Laws on
   liability waivers, security deposits, and STR permits vary and change.
   ============================================================================= */
(function(){
  const S = window.SITE;
  const co = "Ausable House"; // legal entity name — replace with your LLC once formed

  const wrap = (title, body) => `<h3>${title}</h3>
    <p class="muted" style="font-size:.8rem;border-left:3px solid var(--brass);padding-left:.7rem">
    Template — have a New York attorney review before use.</p>${body}`;

  window.LEGAL = {

  /* ---------------- Liability Waiver & Rental Agreement ---------------- */
  waiver: wrap("Liability Waiver &amp; Short-Term Rental Agreement", `
    <p>This Agreement is between ${co} ("Host") and the guest who books a stay ("Guest").
    By booking, Guest agrees on behalf of all members of their party, including minors.</p>

    <h4>1. Assumption of Risk</h4>
    <p>Guest acknowledges the property is a rustic mountain property in the Adirondack
    Park and that outdoor recreation and the natural environment carry inherent risks,
    including but not limited to: uneven terrain, wildlife (including <b>bears</b>), insects,
    water hazards, cold, ice, snow, wood-burning appliances, stairs, and remote location
    with delayed emergency response. Guest <b>voluntarily assumes all such risks</b>.</p>

    <h4>2. Cold-Weather, Ice &amp; Snow Release</h4>
    <p>Guest understands this is a <b>cold, high-elevation, extreme-weather location</b>.
    Host is <b>not responsible for any injury, loss, or damage</b> arising from ice, snow,
    freezing conditions, slippery surfaces, or winter weather, whether on walkways, stairs,
    the driveway, or anywhere on or near the property. Guest agrees to exercise caution and
    to keep children supervised.</p>

    <h4>3. Driveway / Vehicle</h4>
    <p>The driveway is a steep hill that becomes slick in winter. Guest acknowledges that a
    <b>4×4 or AWD vehicle with proper tires is strongly recommended</b> in winter conditions
    and that Host is not responsible for vehicles that cannot ascend/descend, become stuck,
    or are damaged. Towing is at Guest's expense.</p>

    <h4>4. The Pinecone Perch — Outdoor Stairs</h4>
    <p>Where the booking includes The Pinecone Perch, Guest acknowledges access is via
    <b>outdoor stairs to a second-floor entrance</b> which can be icy or snow-covered, and
    accepts the associated risk. The Perch is not suitable for guests with mobility limitations.</p>

    <h4>5. Waiver &amp; Release of Liability</h4>
    <p>To the fullest extent permitted by New York law, Guest, for themselves and their party,
    <b>waives, releases, and holds harmless</b> Host, the property owner(s), and their agents
    from any and all claims, demands, or causes of action for personal injury, death, or
    property damage arising from Guest's stay or use of the property, gear, or grounds,
    <b>except for Host's gross negligence or willful misconduct</b> where such a limitation
    is not permitted by law.</p>

    <h4>6. Indemnification</h4>
    <p>Guest agrees to indemnify and defend Host against claims arising from the acts or
    omissions of Guest or any member/visitor of Guest's party.</p>

    <h4>7. Equipment &amp; Add-Ons</h4>
    <p>Use of canoes, kayaks, or other gear is <b>at Guest's own risk</b>. Guest is responsible
    for wearing appropriate safety equipment (e.g., life vests), following all laws, and for
    any loss or damage. Host makes no warranty as to the condition of any equipment.</p>

    <h4>8. Occupancy &amp; Damage</h4>
    <p>Maximum occupancy is as stated in the listing and may not be exceeded. Guest is
    responsible for damage beyond normal wear. A security deposit or hold may apply.</p>

    <h4>9. Governing Law</h4>
    <p>This Agreement is governed by the laws of the State of New York; venue is Essex County.
    If any provision is unenforceable, the remainder stays in effect.</p>`),

  /* ---------------- House Rules ---------------- */
  rules: wrap("House Rules", `
    <ul class="feat">
      <li><b>Check-in / check-out</b> times as confirmed; turnover time between guests is held automatically.</li>
      <li><b>No smoking / vaping</b> indoors, anywhere. Violations forfeit the deposit.</li>
      <li><b>No parties or events</b> and no exceeding max occupancy. Quiet hours 10pm–8am.</li>
      <li><b>Bear country:</b> keep all food indoors and secured; never leave trash or food outside;
        close and lock doors and windows. Do not feed wildlife.</li>
      <li><b>Septic system:</b> flush only toilet paper. No wipes, feminine products, grease, or chemicals.</li>
      <li><b>Well water:</b> the property is on a private well. Conserve water; report any issues.</li>
      <li><b>Wood stove / fireplace:</b> follow posted instructions; never leave a fire unattended;
        keep the flue open; dispose of ashes only when fully cold.</li>
      <li><b>Detectors:</b> smoke and carbon-monoxide detectors are installed — do not disable them.</li>
      <li><b>Pets:</b> only where the listing allows, with the pet fee paid and prior approval. Clean up after pets.</li>
      <li><b>Driveway/parking:</b> park only in designated areas; winter vehicles per the safety notice.</li>
      <li><b>Leave it as you found it:</b> start the dishwasher, bag trash per instructions, lock up on departure.</li>
    </ul>`),

  /* ---------------- Direct-Booking Terms ---------------- */
  direct: wrap("Direct-Booking Terms, Payment &amp; Cancellation", `
    <div class="notice warn"><b>Please read carefully.</b> Booking directly with us is different
    from booking through Airbnb or Vrbo.</div>
    <h4>No platform protection</h4>
    <p>This reservation is <b>not</b> made through Airbnb, Vrbo, or any online travel platform.
    It does <b>not</b> include AirCover, host guarantee, platform guest protection, travel
    insurance, or any platform dispute-resolution service. We are an independent host.</p>
    <h4>Why it can be cheaper — and less flexible</h4>
    <p>Because we save the platform's service fees, direct rates are typically lower.
    In exchange, direct bookings are <b>less flexible</b>:</p>
    <ul class="feat">
      <li>The <b>deposit is non-refundable</b> once paid.</li>
      <li>Cancellations do not receive the platform's flexible refunds.</li>
      <li>We strongly recommend Guest purchase their own <b>travel insurance</b>.</li>
    </ul>
    <h4>Payment</h4>
    <p>A non-refundable deposit of ${Math.round(S.ratesRules.depositPercent*100)}% is due to confirm.
    The balance is due before check-in. A refundable security hold may apply. Applicable New York
    sales tax and Essex County occupancy tax are collected and remitted.</p>
    <h4>Cancellation</h4>
    <p>If Guest cancels: the deposit is forfeited. If the balance was paid, the refundable portion
    (if any) is returned per the confirmation email. In the rare case Host must cancel, Guest
    receives a full refund of amounts paid.</p>`),

  /* ---------------- Winter & Safety Notice ---------------- */
  winter: wrap("Winter, Weather &amp; Safety Notice", `
    <div class="notice warn"><b>This is a cold, mountain, extreme-weather location.</b></div>
    <ul class="feat">
      <li><b>Ice &amp; snow are constant winter risks.</b> Walkways, stairs, decks, and the driveway
        can be slippery. Move carefully, use handrails, and supervise children.</li>
      <li><b>Driveway:</b> a steep hill that gets slick. A <b>4×4/AWD with winter tires</b> is strongly
        recommended Nov–Apr. Two-wheel-drive cars may not make it up.</li>
      <li><b>The Pinecone Perch</b> is up <b>outdoor stairs</b> — take extra care in winter.</li>
      <li><b>Come prepared:</b> layers, traction footwear, an emergency kit, and a full tank of gas.
        Storms can cause power or road interruptions.</li>
      <li><b>Wildlife:</b> bear country — secure all food and trash.</li>
      <li><b>Remote area:</b> emergency response times are longer than in a city. Program local
        numbers before you arrive.</li>
    </ul>
    <p>By booking, Guest accepts these conditions and the assumption-of-risk terms in the
    Liability Waiver.</p>`),

  /* ---------------- Privacy Policy ---------------- */
  privacy: wrap("Privacy Policy", `
    <p>We collect only what we need to respond to inquiries and manage bookings: your name,
    contact details, dates, party size, and any notes or optional concierge-survey answers you
    provide. We use this to communicate with you and prepare your stay.</p>
    <ul class="feat">
      <li>We do <b>not</b> sell your information.</li>
      <li>Concierge-survey answers are optional and used only to tailor your itinerary.</li>
      <li>Booking and message forms open your own email client to send to us directly.</li>
      <li>Contact us to access or delete information you've shared.</li>
    </ul>
    <p>Questions? Email <a href="mailto:${S.brand.email}">${S.brand.email}</a>.</p>`)
  };
})();
