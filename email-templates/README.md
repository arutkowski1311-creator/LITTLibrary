# Promotional HTML Email Template

`product-promo-email.html` is a table-based, inline-CSS email built for
deliverability (low bounce rate + inbox placement). Replace every
`{{PLACEHOLDER}}` before sending.

## Why emails bounce vs. get filtered

- **Bounce** = the receiving server *rejected* the message (bad address, failed
  authentication, blocklisted sender, no unsubscribe).
- **Spam foldering** = it was *accepted but filtered* to junk. The HTML mostly
  influences this, not bounces.

## Pre-send checklist (most of deliverability is NOT the HTML)

**Sending infrastructure**
- [ ] Send through a reputable ESP (SendGrid, Mailgun, Amazon SES, Salesforce
      Marketing Cloud, or a pharma platform like Veeva). Never bulk-send from raw SMTP.
- [ ] Authenticate the sending domain: **SPF**, **DKIM**, **DMARC** DNS records.
- [ ] Warm up a new sending IP/domain gradually; don't blast a cold list.

**List hygiene**
- [ ] Opt-in addresses only. No scraped/purchased lists (→ hard bounces + blocklisting).
- [ ] Remove past hard bounces and complainers. Keep spam complaints < 0.3%.

**Compliance (required — omission causes rejection/reports)**
- [ ] Visible unsubscribe link + one-click `List-Unsubscribe` / `List-Unsubscribe-Post` headers.
- [ ] Physical postal address in the footer (CAN-SPAM).
- [ ] A `text/plain` alternative part (multipart/alternative) — ESP can auto-generate.

**Content / rendering**
- [ ] Under ~102 KB total (Gmail clips larger messages).
- [ ] Real HTML text, not an all-image email. Alt text on every image.
- [ ] No spam-trigger words / ALL CAPS / `!!!` / hidden text / URL shorteners.
- [ ] Test render in Outlook, Gmail, Apple Mail (e.g. Litmus or Email on Acid).

**Pharma-specific (regulated promotional email)**
- [ ] Indication statement, fair balance, Important Safety Information (ISI).
- [ ] Link to full Prescribing Information (+ boxed warning / Medication Guide if applicable).
- [ ] Job/PI code in footer. **Medical/Legal/Regulatory (MLR) review before any send.**
