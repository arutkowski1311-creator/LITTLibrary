ALEMBIC EMAIL BUILDER 7.2
=========================

This is an offline, multi-product pharmacy email builder. It includes seven
PIVYA starter templates, two ciprofloxacin otic solution starter templates,
and a complete blank Alembic pharmacy framework.

INTERFACE
The workspace was redesigned for clarity. Nothing about the email output, the
starter templates, the Asset Library rules, or the QA checks changed.
- The top bar now shows only the two actions used constantly, Save and Create
  Send Folder. Save As, Restore starter, Download Project, Open Project, and
  Home moved into the File menu beside them. Ctrl/Cmd+S also saves.
- Structure rows show the section name in full with a type icon. Reorder, hide,
  duplicate, and remove appear on hover as labelled icon buttons.
- Add has a search box. Type any part of a section name or description to filter
  the whole library instead of scrolling five groups.
- Edit leads with the controls used most, text style, colour, and alignment.
  Font/size/spacing, selected-word formatting, background/pill, and padding are
  one click away in collapsible groups. The selection chip names what is
  selected in plain language rather than showing the HTML tag.
- QA puts the actions and the result first, sorts blocking issues above
  warnings and passes, and shows a count badge on the QA tab. Production image
  hosting is collapsed until needed.
- Every panel, modal, and preview shares one type, colour, and spacing scale,
  and the layout stays usable from 420 px up.

START HERE
1. Keep this entire folder together.
2. Open index.html in Chrome or Edge.
3. Choose Create a New Email or Use a Starter Template.

Starter templates are protected. Using one always creates a separate working
email under My Emails; it never overwrites the starter.

SAVING WORK
- Save updates the current working email on this computer.
- Save As creates a separate copy.
- Home > Open My Emails lets you open, rename, duplicate, download, or delete.
- Download Project creates a portable .alembic-email file for another computer.
- Open Project imports that file as a new working copy.

BUILDING AN EMAIL
- Preview Desktop and Preview Mobile are always available above the email.
- Structure reorders, hides, duplicates, or removes sections.
- The compact two-line Product legal name block is optional. It can be added,
  duplicated, edited, moved, or removed like every other section.
- Add is a complete reusable section library organized as Brand frame, Core
  content, Pharmacy & access, product-specific sections, and optional legal &
  footer. A new build can restore the Alembic header, green and blue brand
  bands, optional product name, hero, text/image/card/data/patient treatments,
  ordering, savings, CTAs, Indication, Important Safety Information,
  Prescribing Information button, references, and legal footer. No section is
  single-use or protected; users can add or remove any section at any time.
- Assets replaces or inserts approved library images. Add PNG creates a
  reusable local asset after the user completes its name, category, alt text,
  product, audience, role, placement, and recommended width.
- Every built-in Asset Library file is an optimized PNG under 200 KB. Product
  cutouts and the Alembic logo use real transparency. Designed charts, patient
  profiles, and access panels retain their intentional canvas so their approved
  text and visual hierarchy are not damaged.
- Reusable assets must be PNG. Oversized files are automatically scaled and
  optimized. Product-category assets must contain a true transparent background.
- Click any image and use Image hyperlink to add or remove an HTTPS destination.
  This supports linked logos, product images, banners, and other approved assets.
- Flexible 2 columns and Flexible 3 columns are available in Add > Core content.
  Every column includes independently editable text, image, and button elements.
  Remove anything not needed. In Edit > Column backgrounds, each column can use
  an independent email-safe color or inherit the section background. Every
  three-card treatment is normalized to equal desktop widths and full-width
  mobile stacking.
- Custom assets can be edited or deleted. An asset cannot be deleted while an
  email still references it. Portable projects include the custom assets used.
- Edit provides prominent whole-box typography presets plus direct font, size,
  weight, italic, underline, color, and alignment controls. Selected-word
  formatting remains available in a separate expandable control.
- Any section can use no fill, square, rounded, or capsule backgrounds with
  controlled tint/transparency. Styled inline elements can be converted to and
  edited as pills. Solid fallbacks preserve the design in older Outlook versions.
- Text elements default to No fill so copy prints directly on the section color.
  The tool also clears common accidental white text backgrounds inside colored
  sections and automatically tightens ordering/CIN sections with excess space.
- Starter templates use compact, email-safe section spacing by default. Manual
  desktop and mobile padding controls remain available for individual sections.
- QA checks structural, rendering, asset, link, and visible placeholder issues.
  It does not require or assess legal, safety, naming, or disclaimer content.
  Red technical findings must be fixed before handoff. HTML
  clipping risk and unfinished production image hosting remain visible warnings,
  but they do not block the Send Folder because its purpose is to package the
  images for the sending partner to upload and host.

NEW PRODUCTS
Home > Manage Products stores reusable product information locally. Add the
brand name, lower-case generic name, trademark status, strength, dosage form,
colors, product image, links, and current approved Regulatory text. The builder
does not use AI and does not independently approve promotional claims.

CREATE SEND FOLDER
After the email is complete, click Create Send Folder. One ZIP is downloaded
with one folder containing:
- READ_ME_FIRST.txt — three simple sending steps
- EMAIL.html — email-platform-ready HTML
- EMAIL_REFERENCE.pdf — completed visual reference
- CAMPAIGN_DETAILS.txt — subject, preheader, CTA links, audience, and plain text
- images — only the images used in that email, including local uploads

The sending partner opens READ_ME_FIRST.txt, imports EMAIL.html, uploads the
images, sends desktop and mobile tests, compares them with the PDF, and then
schedules the approved campaign.

OPEN CONTENT EDITING
- Every section can be added repeatedly, duplicated, edited, moved, hidden, or
  removed. The builder does not enforce legal or regulatory section presence.
- Visible unfinished copy, broken links, missing images, malformed structure, or
  other technical issues can still block the Send Folder because they would make
  the delivered email incomplete or unreliable.

IMPORTANT
The QA checks are deterministic production safeguards, not legal or medical
judgment. Confirm the final audience, ordering details, links, claims, current
approved PI/ISI, citations, sender identity, unsubscribe language, and physical
address through the required Regulatory/MLR and sending-platform reviews.
Render-test the final campaign in the actual sending platform and target inboxes.

INCLUDED VERIFICATION
- scripts/validate_static.js checks all starter templates, blank frameworks,
  packaged images, transparent product packshots, mobile structure, and assets.
- scripts/validate_functional.js checks control wiring, section blocks, reusable
  PNG rules, save/export integration, typography and background safeguards,
  taint-safe PDF rendering logic, and Send Folder ZIP generation.
