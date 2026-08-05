# Alembic Pharmaceuticals — Email Builder

A single-file, no-install tool that turns a Canva design + approved copy into
**deliverability-safe, legally-structured HTML email**. Open `index.html` in any
browser (works offline). Left pane = slots to fill; right pane = live preview;
buttons download or copy the final email HTML.

## The workflow ("teach a man to fish")

1. In Canva, **export the images** (logo, hero, product shots) — unaltered.
2. Open `index.html`. Drop each image in (or paste a hosted image URL).
3. **Paste the approved copy** into each slot, verbatim.
4. Watch the live preview. Fix anything.
5. Click **Download email.html** — that file is what you hand to your ESP.

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
