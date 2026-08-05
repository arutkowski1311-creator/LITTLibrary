# Alembic Pharmaceuticals — Email Builder

A single-file, no-install tool that turns a Canva design + approved copy into
**deliverability-safe, legally-structured HTML email**. Open `index.html` in any
browser (works offline). Left pane = slots to fill; right pane = live preview;
buttons download or copy the final email HTML.

> **This is step 1 of a physician behavior-change platform, not just an editor.**
> See [`STRATEGY.md`](STRATEGY.md) for the prescribing-journey model, adaptive
> sequencing, and the physician adoption-scoring blueprint.

## Clinical Story Engine (campaign context)

Before picking a layout, set the **campaign context**: product (with **Pivya** and
**Cipro** starters), target specialty, **journey stage** (Awareness → Consideration
→ First Rx → Reinforcement), objective, and available evidence. The engine then:

- shows the **stage's goal, content rule, and correct CTA posture** (so an Awareness
  email never over-asks for a prescription),
- **recommends a story structure** from stage + objective + evidence,
- tags links with `utm_content = journey stage` for stage-level analytics.

It **never invents clinical claims** — it structures the story you approve; every
efficacy/safety line stays a placeholder for MLR-approved, verbatim language.

## The workflow ("teach a man to fish")

1. **Pick a layout** from the gallery (see below).
2. In Canva, **export the images** (logo, hero, product shots) — unaltered.
3. Drop each image in (or paste a hosted image URL).
4. **Paste the approved copy** into each slot, verbatim.
5. Watch the live preview. Fix anything.
6. Click **Download email.html** — that file is what you hand to your ESP.

## Templates (pick one, then fill its slots)

**Layouts** (control how it looks):

| Layout | Use it for |
|---|---|
| **Single-column** | All-purpose: hero, headline, body, button. Renders identically everywhere. |
| **Hero + two-column** | Two side-by-side messages/benefits; stacks on mobile. |
| **Product-card grid** | A row of 2–3 product cards (image + caption + link). |
| **Multi-story newsletter** | Stacked story blocks — a digest-style update. |
| **Video (poster → link)** | A play-button thumbnail linking to a hosted video. |
| **Swipe gallery** | A horizontal scroll strip of media. |

**Clinical story structures** (control how it argues):

| Structure | Shape |
|---|---|
| **Publication** | Clinical headline → key finding → one figure → why it matters → link to paper. |
| **Patient case** | Presentation → treatment decision → outcome → practice takeaway. |
| **Guideline update** | What changed → evidence → implications → suggested population. |
| **Myth vs evidence** | Common misconception → current evidence → practical takeaway. |

Logo, Indication, ISI, and the compliant footer are present in **every** template.

### Two email-specific realities baked into these

- **Video does not play inside email.** Only Apple Mail supports inline HTML5
  video; Gmail/Outlook do not. The video layout uses a **poster image + ▶ button
  that links out** to your hosted (MLR-approved) video page — the universal,
  reliable pattern.
- **True carousels don't work in email** (no JavaScript; Outlook ignores the CSS).
  The swipe gallery is a horizontal scroll strip that **swipes in Apple Mail /
  iOS / most webmail and gracefully stacks into a column in Outlook** — so it
  never looks broken.

## Metrics — UTM link tagging (and what the tool can't do)

- The tool **auto-appends `utm_source` / `utm_medium` / `utm_campaign`** to your
  content links (CTA, cards, gallery, video) so Google Analytics attributes site
  traffic to the email. Legal links (unsubscribe, PI, privacy) are never tagged.
- **Open/click pixels are NOT in this HTML.** A tracking pixel needs a *unique
  URL per recipient*, which only the sending platform can generate — so your ESP
  injects it (and rewrites links for click tracking) at send time. Note: since
  Apple Mail Privacy Protection, *open* rates are unreliable industry-wide;
  *click* rate is the metric to trust.
- **Pharma/HCP caveat:** whether to track individual recipient behavior is a
  privacy/MLR decision, not just a technical one.

## Why it's *not* "drop the whole Canva file in and go"

Two of Alembic's own requirements make full auto-conversion the wrong approach:

- **Verbiage must match exactly (legal).** The only way to auto-read text off a
  Canva image is OCR, which *guesses* characters — unacceptable for indication
  and safety text. So copy is **pasted verbatim; the tool never rewrites it.**
- **Images must stay unaltered.** The tool places images as-is and only scales
  them to fit the 600px width — never crops, recolors, or distorts.

Also, the only way to be 100% pixel-identical to Canva is an all-image email —
which is the #1 spam trigger *and* hides your required safety text from spam
filters and screen readers. Real HTML text is both safer and required.

## Built-in guardrails

- **Verbatim text** — no rewriting, summarizing, or reflowing of your words.
- **Fair-balance enforcement** — won't export until Indication, ISI, and the
  full Prescribing Information link are filled in.
- **Compliant footer required** — unsubscribe link, physical address, job code.
- **Unaltered images** — scaled to fit only.
- **Size meter** — warns if the email exceeds ~102 KB (Gmail clips larger).

## Before any real send (the builder can't do these for you)

- **Host images at public URLs** and use those in the tool. Dropped files embed
  as base64 for preview only; Gmail/Outlook often block embedded images.
- **Authenticate the domain**: SPF, DKIM, DMARC.
- **Send through an ESP** (or Veeva/Salesforce Marketing Cloud for pharma) — not raw SMTP.
- **Set brand color/logo** to Alembic's exact assets (defaults are placeholders).
- **MLR review.** This tool structures the email; it does not approve the content.
