(() => {
  'use strict';

  const templates = window.PIVYA_TEMPLATES || [];
  if (templates.some(t => t.id === 'email8')) return;

  const piUrl = 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=51dde3f2-adb1-4ed8-83c6-1f63723a2529';

  function outlookButton(label, href, width = 248) {
    return `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:46px;v-text-anchor:middle;width:${width}px;" arcsize="13%" stroke="f" fillcolor="#0878C9"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${label}</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="${href}" style="background:#0878C9;border-radius:6px;color:#FFFFFF;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:46px;text-align:center;width:${width}px;-webkit-text-size-adjust:none;">${label}</a><!--<![endif]-->`;
  }

  const styles = `
html,body{margin:0!important;padding:0!important;width:100%!important;background:#F1F4F5;}
table,td{mso-table-lspace:0pt!important;mso-table-rspace:0pt!important;border-collapse:collapse;}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;}
a{text-decoration:none;}
body,td,a{font-family:Arial,Helvetica,sans-serif;}
@media screen and (max-width:620px){
.shell{width:100%!important;max-width:100%!important;}
.outer-pad{padding:12px 0!important;}
.shell table{width:100%!important;max-width:100%!important;}
.shell td{max-width:100%!important;}
.pad{padding-left:18px!important;padding-right:18px!important;}
.stack{display:block!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;}
.mobtop{padding-top:16px!important;}
.mobgap{padding-left:0!important;padding-right:0!important;padding-bottom:8px!important;}
.center{text-align:center!important;}
.centerimg img{margin-left:auto!important;margin-right:auto!important;}
.h1{font-size:28px!important;line-height:34px!important;letter-spacing:-.2px!important;}
.h2{font-size:23px!important;line-height:29px!important;}
.bodycopy{font-size:15px!important;line-height:23px!important;}
.hero-copy{padding:24px 20px 10px!important;}
.hero-image{padding:8px 20px 24px!important;text-align:center!important;}
.hero-image img{margin:0 auto!important;width:188px!important;}
.order-label,.order-value{display:block!important;width:100%!important;text-align:left!important;}
.order-label{padding:7px 0 2px!important;}
.order-value{padding:0 0 8px!important;overflow-wrap:anywhere!important;word-break:break-word!important;}
.order-box-pad{padding:13px 15px!important;}
.placeholder{display:inline!important;font-size:12.5px!important;line-height:18px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;}
.feature-table{border-spacing:0!important;}
.feature-card{display:block!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;padding:16px 15px 17px!important;margin:0 0 8px!important;}
}`;

  const header = `
<tr><td style="padding:17px 28px 15px;background:#FFFFFF;border-bottom:1px solid #DDE6E8;">
<table role="presentation" width="100%"><tr>
<td valign="middle"><a href="https://www.alembictherapeutics.com/"><img src="assets/brand/alembic-logo.png" width="142" alt="Alembic Therapeutics" style="width:142px;max-width:100%;height:auto;"></a></td>
<td align="right" valign="middle" style="font-size:11px;line-height:16px;color:#718091;">PHARMACY PARTNER<br>COMMUNICATION</td>
</tr></table></td></tr>
<tr><td style="height:4px;font-size:0;line-height:0;background:#249647;">&nbsp;</td></tr>
<tr><td style="height:3px;font-size:0;line-height:0;background:#0878C9;">&nbsp;</td></tr>`;

  const ordering = `
<tr><td class="pad" style="padding:20px 28px 10px;background:#FFFFFF;">
<div style="font-size:12px;line-height:17px;font-weight:800;letter-spacing:1.05px;color:#249647;text-transform:uppercase;padding-bottom:7px;">PHARMACY ORDERING INFORMATION</div>
<div class="h2" style="font-size:25px;line-height:31px;font-weight:800;color:#173F34;">How to order</div>
</td></tr>
<tr><td class="pad" style="padding:0 28px 22px;background:#FFFFFF;">
<table role="presentation" width="100%" style="background:#F5F8FB;border:1px solid #DCE5EC;border-radius:16px;"><tr><td class="order-box-pad" style="padding:18px 19px;">
<table role="presentation" width="100%" style="font-size:13.5px;line-height:20px;color:#253449;">
<tr><td class="order-label" width="39%" valign="top" style="padding:5px 0;color:#6A7886;">Wholesaler or distributor</td><td class="order-value" valign="top" style="padding:5px 0;font-weight:700;word-break:break-word;overflow-wrap:anywhere;"><span class="placeholder">[[INSERT INFORMATION]]</span></td></tr>
<tr><td class="order-label" valign="top" style="padding:5px 0;color:#6A7886;">Item or catalog number</td><td class="order-value" valign="top" style="padding:5px 0;font-weight:700;word-break:break-word;overflow-wrap:anywhere;"><span class="placeholder">[[INSERT INFORMATION]]</span></td></tr>
<tr><td class="order-label" valign="top" style="padding:5px 0;color:#6A7886;">Ordering link or contact</td><td class="order-value" valign="top" style="padding:5px 0;font-weight:700;word-break:break-word;overflow-wrap:anywhere;"><span class="placeholder">[[INSERT INFORMATION]]</span></td></tr>
<tr><td class="order-label" valign="top" style="padding:5px 0;color:#6A7886;">Availability notes</td><td class="order-value" valign="top" style="padding:5px 0;font-weight:700;word-break:break-word;overflow-wrap:anywhere;"><span class="placeholder">[[INSERT INFORMATION]]</span></td></tr>
</table>
</td></tr></table></td></tr>`;

  const indicationAndDosing = `
<tr><td class="pad" style="padding:18px 28px 10px;background:#FFFFFF;border-top:1px solid #E2E9EC;">
<div style="font-size:12px;line-height:17px;font-weight:800;letter-spacing:.8px;color:#249647;padding-bottom:6px;">INDICATION</div>
<div style="font-size:13px;line-height:20px;color:#253449;">Ciprofloxacin Otic Solution, 0.2% is a quinolone antimicrobial indicated for the local treatment of acute otitis externa caused by susceptible isolates of <em>Pseudomonas aeruginosa</em> or <em>Staphylococcus aureus</em>.</div>
</td></tr>
<tr><td class="pad" style="padding:8px 28px 20px;background:#FFFFFF;">
<table role="presentation" width="100%" style="background:#EAF6EE;border:1px solid #CFE8D7;border-radius:15px;"><tr><td style="padding:17px 18px;">
<div style="font-size:12px;line-height:17px;font-weight:800;letter-spacing:.8px;color:#249647;text-transform:uppercase;">DOSING</div>
<div style="font-size:15px;line-height:23px;color:#253449;padding-top:5px;">Instill the contents of <strong>one single-dose container</strong> into the affected ear <strong>twice daily</strong>, approximately 12 hours apart, for <strong>7 days</strong>.</div>
</td></tr></table></td></tr>`;

  const safety = `
<tr><td class="pad" style="padding:0 28px 22px;background:#FFFFFF;">
<table role="presentation" width="100%" style="background:#FFF5F4;border:1px solid #F0D8D5;border-radius:16px;"><tr><td style="padding:19px 20px 7px;">
<div style="font-size:15px;line-height:20px;font-weight:800;color:#9E4242;">IMPORTANT SAFETY INFORMATION</div>
</td></tr>
<tr><td style="padding:5px 20px 8px;font-size:12.5px;line-height:19px;color:#253449;"><strong>Contraindications</strong><br>Ciprofloxacin Otic Solution, 0.2% is contraindicated in patients with a history of hypersensitivity to ciprofloxacin.</td></tr>
<tr><td style="padding:5px 20px 8px;font-size:12.5px;line-height:19px;color:#253449;"><strong>Warnings &amp; Precautions</strong><br>• <strong>Otic Use Only:</strong> Do not use for injection, inhalation, or topical ophthalmic use.<br>• <strong>Hypersensitivity:</strong> Discontinue at the first appearance of a skin rash or any other sign of hypersensitivity.<br>• <strong>Growth of Resistant Organisms:</strong> Prolonged use may result in overgrowth of nonsusceptible organisms, including yeast and fungi. If superinfection occurs, discontinue use and institute alternative therapy.<br>• <strong>Lack of Clinical Response:</strong> If the infection is not improved after one week of therapy, cultures may help guide further treatment.</td></tr>
<tr><td style="padding:5px 20px 8px;font-size:12.5px;line-height:19px;color:#253449;"><strong>Adverse Reactions</strong><br>The most common adverse reactions reported in 2% to 3% of patients were application-site pain, ear pruritus, fungal ear superinfection, and headache.</td></tr>
<tr><td style="padding:5px 20px 18px;font-size:12.5px;line-height:19px;color:#253449;">To report suspected adverse reactions, contact Alembic Therapeutics at <a href="tel:18662109797" style="color:#0878C9;text-decoration:underline;">1-866-210-9797</a> or FDA at 1-800-FDA-1088 or <a href="https://www.fda.gov/medwatch" style="color:#0878C9;text-decoration:underline;">fda.gov/medwatch</a>.<br><br>Please see the <a href="${piUrl}" style="color:#0878C9;text-decoration:underline;">Full Prescribing Information</a>.</td></tr>
</table></td></tr>`;

  const footer = `
<tr><td style="padding:18px 28px;background:#F1F4F4;border-top:1px solid #DDE6E8;">
<table role="presentation" width="100%"><tr>
<td class="stack" valign="middle" style="font-size:10.5px;line-height:16px;color:#667787;">Ciprofloxacin Otic Solution, 0.2% | For U.S. healthcare professionals and pharmacy partners only<br>Alembic Therapeutics LLC | 550 Hills Drive, Suite 110 | Bedminster, NJ 07921<br><a href="https://www.alembictherapeutics.com/" style="color:#0878C9;text-decoration:underline;">AlembicTherapeutics.com</a> &nbsp;|&nbsp; <a href="mailto:info@alembictx.com" style="color:#0878C9;text-decoration:underline;">info@alembictx.com</a></td>
<td class="stack center mobtop" align="right" valign="bottom" style="font-size:10.5px;line-height:16px;color:#667787;">© 2026 Alembic Therapeutics LLC<br>All rights reserved.<br>US-CIP-00002 v1.0</td>
</tr></table></td></tr>`;

  function shell(preheader, title, body) {
    return `<!doctype html><html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${title}</title><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]--><style>${styles}</style></head><body style="margin:0;padding:0;background:#F1F4F5;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F1F4F5;"><tr><td class="outer-pad" align="center" style="padding:22px 10px;"><table role="presentation" class="shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#FFFFFF;box-shadow:0 8px 26px rgba(30,52,69,.08);">${header}${body}${indicationAndDosing}<tr><td align="center" class="pad" style="padding:0 28px 22px;background:#FFFFFF;text-align:center;">${outlookButton('Review Prescribing Information', piUrl)}</td></tr>${safety}${footer}</table></td></tr></table></body></html>`;
  }

  const backInStockPreheader = 'Ciprofloxacin Otic Solution, 0.2% is available in 14-count cartons of preservative-free single-dose containers.';
  const backInStockBody = `
<tr><td style="background:#17372C;">
<table role="presentation" width="100%"><tr>
<td class="stack hero-copy" width="61%" valign="middle" style="padding:31px 8px 31px 28px;">
<div style="font-size:12px;line-height:17px;font-weight:800;letter-spacing:1.2px;color:#9BD6AC;text-transform:uppercase;padding-bottom:10px;">AVAILABILITY UPDATE</div>
<div class="h1" style="font-size:39px;line-height:44px;font-weight:800;letter-spacing:-.45px;color:#FFFFFF;">Ciprofloxacin Otic Solution is <span style="color:#7FC6F4;">back in stock.</span></div>
<div class="bodycopy" style="font-size:15.5px;line-height:24px;color:#E5F0EC;padding-top:13px;">Ciprofloxacin Otic Solution, 0.2% is available in sterile, preservative-free single-dose containers for otic use.</div>
</td>
<td class="stack hero-image centerimg" width="39%" valign="middle" align="center" style="padding:20px 25px 20px 8px;background:#F4F0E8;"><img src="assets/product/ciprofloxacin-otic-packshot.png" width="185" alt="Ciprofloxacin Otic Solution, 0.2% carton" style="width:185px;max-width:100%;height:auto;margin:0 auto;"></td>
</tr></table></td></tr>
${ordering}
<tr><td class="pad" style="padding:4px 28px 9px;background:#FFFFFF;"><div class="h2" style="font-size:25px;line-height:31px;font-weight:800;color:#173F34;">Product at a glance</div></td></tr>
<tr><td style="padding:0 22px 21px;background:#FFFFFF;"><table class="feature-table" role="presentation" width="100%" style="border-collapse:separate;border-spacing:6px;"><tr>
<td class="stack feature-card" width="33.33%" valign="top" style="background:#EAF6EE;border-top:3px solid #249647;padding:17px 15px 18px;box-sizing:border-box;"><div style="font-size:18px;line-height:22px;font-weight:800;color:#249647;">Preservative-free</div><div style="font-size:13px;line-height:19px;color:#253449;padding-top:7px;">Sterile otic solution supplied in single-dose containers.</div></td>
<td class="stack feature-card" width="33.33%" valign="top" style="background:#EFF6FB;border-top:3px solid #0878C9;padding:17px 15px 18px;box-sizing:border-box;"><div style="font-size:18px;line-height:22px;font-weight:800;color:#0878C9;">14 containers</div><div style="font-size:13px;line-height:19px;color:#253449;padding-top:7px;">One carton contains fourteen 0.25 mL single-dose containers.</div></td>
<td class="stack feature-card" width="33.33%" valign="top" style="background:#F3F7F7;border-top:3px solid #277E82;padding:17px 15px 18px;box-sizing:border-box;"><div style="font-size:18px;line-height:22px;font-weight:800;color:#277E82;">7-day regimen</div><div style="font-size:13px;line-height:19px;color:#253449;padding-top:7px;">One container in the affected ear twice daily for 7 days.</div></td>
</tr></table></td></tr>`;

  const stockingGuidePreheader = 'Approved indication, dosing, carton configuration, storage, and ordering information for Ciprofloxacin Otic Solution, 0.2%.';
  const stockingGuideBody = `
<tr><td style="background:#EAF3F2;">
<table role="presentation" width="100%"><tr>
<td class="stack hero-copy" width="61%" valign="middle" style="padding:31px 8px 31px 28px;">
<div style="font-size:12px;line-height:17px;font-weight:800;letter-spacing:1.1px;color:#277E82;text-transform:uppercase;padding-bottom:9px;">PHARMACY PRODUCT OVERVIEW</div>
<div class="h1" style="font-size:37px;line-height:43px;font-weight:800;letter-spacing:-.45px;color:#173F34;">A concise stocking guide for <span style="color:#0878C9;">Ciprofloxacin Otic Solution, 0.2%</span></div>
<div class="bodycopy" style="font-size:15.5px;line-height:24px;color:#53657A;padding-top:13px;">Approved product, dosing, storage, and ordering information for pharmacy teams.</div>
</td>
<td class="stack hero-image centerimg" width="39%" valign="middle" align="center" style="padding:20px 25px 20px 8px;background:#DCEBE9;"><img src="assets/product/ciprofloxacin-otic-packshot.png" width="190" alt="Ciprofloxacin Otic Solution, 0.2% carton" style="width:190px;max-width:100%;height:auto;margin:0 auto;"></td>
</tr></table></td></tr>
<tr><td class="pad" style="padding:20px 28px 22px;background:#FFFFFF;">
<table role="presentation" width="100%" style="background:#F4F0E8;border-radius:18px;"><tr><td style="padding:21px 22px;">
<div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1px;color:#249647;text-transform:uppercase;padding-bottom:10px;">STOCKING DETAILS</div>
<table role="presentation" width="100%">
<tr><td width="27" valign="top" style="padding:1px 9px 10px 0;"><span style="display:inline-block;width:20px;height:20px;border-radius:10px;background:#249647;color:#FFFFFF;font-size:12px;line-height:20px;font-weight:800;text-align:center;">✓</span></td><td valign="top" style="padding:0 0 10px;font-size:14px;line-height:20px;color:#253449;">Sterile, preservative-free otic solution</td></tr>
<tr><td width="27" valign="top" style="padding:1px 9px 10px 0;"><span style="display:inline-block;width:20px;height:20px;border-radius:10px;background:#0878C9;color:#FFFFFF;font-size:12px;line-height:20px;font-weight:800;text-align:center;">✓</span></td><td valign="top" style="padding:0 0 10px;font-size:14px;line-height:20px;color:#253449;">14 single-dose containers per carton</td></tr>
<tr><td width="27" valign="top" style="padding:1px 9px 10px 0;"><span style="display:inline-block;width:20px;height:20px;border-radius:10px;background:#249647;color:#FFFFFF;font-size:12px;line-height:20px;font-weight:800;text-align:center;">✓</span></td><td valign="top" style="padding:0 0 10px;font-size:14px;line-height:20px;color:#253449;">0.25 mL delivers 0.5 mg ciprofloxacin per container</td></tr>
<tr><td width="27" valign="top" style="padding:1px 9px 0 0;"><span style="display:inline-block;width:20px;height:20px;border-radius:10px;background:#0878C9;color:#FFFFFF;font-size:12px;line-height:20px;font-weight:800;text-align:center;">✓</span></td><td valign="top" style="padding:0;font-size:14px;line-height:20px;color:#253449;">For otic use only</td></tr>
</table></td></tr></table></td></tr>
${ordering}
<tr><td class="pad" style="padding:0 28px 22px;background:#FFFFFF;">
<table role="presentation" width="100%" style="background:#F8FAFB;border-left:4px solid #277E82;"><tr><td style="padding:16px 17px;">
<div style="font-size:17px;line-height:22px;font-weight:800;color:#277E82;">Storage and handling</div>
<div style="font-size:13.5px;line-height:20px;color:#253449;padding-top:6px;">Store at 15°C to 25°C (59°F to 77°F). Store unused containers in the pouch to protect from light, and discard used containers.</div>
</td></tr></table></td></tr>`;

  templates.push({
    id: 'email8',
    name: 'Email 8 · Ciprofloxacin back in stock',
    product: 'ciprofloxacin',
    audience: 'Pharmacy',
    filename: 'Ciprofloxacin_Otic_Pharmacy_Email_08_Back_In_Stock.html',
    subject: 'Ciprofloxacin Otic Solution, 0.2% Is Back in Stock',
    preheader: backInStockPreheader,
    html: shell(backInStockPreheader, 'Ciprofloxacin Otic Solution, 0.2% Is Back in Stock', backInStockBody)
  });

  templates.push({
    id: 'email9',
    name: 'Email 9 · Ciprofloxacin stocking guide',
    product: 'ciprofloxacin',
    audience: 'Pharmacy',
    filename: 'Ciprofloxacin_Otic_Pharmacy_Email_09_Stocking_Guide.html',
    subject: 'Pharmacy Guide: Ciprofloxacin Otic Solution, 0.2%',
    preheader: stockingGuidePreheader,
    html: shell(stockingGuidePreheader, 'Pharmacy Guide: Ciprofloxacin Otic Solution, 0.2%', stockingGuideBody)
  });
})();
