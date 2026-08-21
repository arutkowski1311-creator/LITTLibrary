const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
global.window = {};
for (const file of ['assets.js', 'asset_data.js', 'ciprofloxacin_assets.js', 'templates.js', 'pharmacy_template.js', 'ciprofloxacin_templates.js', 'product_profiles.js', 'blank_email.js']) {
  require(path.join(root, file));
}

const errors = [];
const assets = new Map((window.PIVYA_ASSETS || []).map(asset => [asset.src, asset]));
const data = window.PIVYA_ASSET_DATA || {};
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

for (const asset of assets.values()) {
  const filePath = path.join(root, asset.src);
  if (!fs.existsSync(filePath)) errors.push(`Missing asset file: ${asset.src}`);
  else {
    const png = fs.readFileSync(filePath);
    if (!/\.png$/i.test(asset.src) || png.toString('ascii', 1, 4) !== 'PNG') errors.push(`${asset.src}: every Asset Library file must be PNG`);
    if (png.readUInt32BE(16) !== asset.width || png.readUInt32BE(20) !== asset.height) errors.push(`Asset dimension metadata mismatch: ${asset.src}`);
    if (fs.statSync(filePath).size !== asset.bytes) errors.push(`Asset byte metadata mismatch: ${asset.src}`);
    if (asset.bytes > 200 * 1024) errors.push(`${asset.src}: optimized Asset Library file exceeds 200 KB`);
  }
  if (!data[asset.src]) errors.push(`Missing embedded asset data: ${asset.src}`);
  else if (Buffer.from(data[asset.src], 'base64').length !== asset.bytes) errors.push(`Embedded asset byte mismatch: ${asset.src}`);
}

for (const src of ['assets/brand/alembic-logo.png', 'assets/product/pivya-packshot.png', 'assets/product/ciprofloxacin-otic-packshot.png']) {
  const png = fs.readFileSync(path.join(root, src));
  const hasAlpha = [4, 6].includes(png[25]) || png.includes(Buffer.from('tRNS'));
  if (!hasAlpha) errors.push(`${src}: transparent cutout must include a true PNG alpha channel`);
}
if (!appSource.includes('function compactTemplateSpacing') || !appSource.includes("compactRowSpacing(row);row.dataset.builderCustomLabel")) {
  errors.push('Compact starter and added-section spacing safeguards are missing');
}
for (const safeguard of [
  "DB_VERSION=2",
  "db.createObjectStore('assets'",
  'function optimizeAssetPng',
  "category==='Product'&&!hasTransparency",
  'function customAssetsForHTML',
  'function applyElementBackground',
  'data-type-preset="heading"',
  'data-section-shape="capsule"',
  'function buildDeploymentPayload'
]) if (!appSource.includes(safeguard)) errors.push(`v7.2 safeguard missing: ${safeguard}`);
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/v7\.2/.test(indexSource) || !/id="addAssetBtn"/.test(indexSource)) errors.push('v7.2 interface markers are missing');

function count(html, tag, closing = false) {
  return (html.match(new RegExp(`<${closing ? '\\/' : ''}${tag}\\b`, 'gi')) || []).length;
}

function validateEmail(name, html) {
  if (!/^<!doctype html>/i.test(html)) errors.push(`${name}: missing doctype`);
  if (!/class="shell"[^>]*width="600"|width="600"[^>]*class="shell"/i.test(html)) errors.push(`${name}: missing 600px shell`);
  if (!/@media\s+screen/i.test(html)) errors.push(`${name}: missing mobile media query`);
  if (!/IMPORTANT SAFETY INFORMATION/i.test(html)) errors.push(`${name}: missing ISI heading`);
  if (!/INDICATION/i.test(html)) errors.push(`${name}: missing indication`);
  for (const tag of ['table', 'tr', 'td']) {
    const open = count(html, tag), close = count(html, tag, true);
    if (open !== close) errors.push(`${name}: unbalanced ${tag} tags (${open}/${close})`);
  }
  const local = [...html.matchAll(/<img[^>]+src="(assets\/[^"]+)"/gi)].map(match => match[1]);
  for (const src of local) if (!assets.has(src)) errors.push(`${name}: unregistered local image ${src}`);
  const missingAlt = [...html.matchAll(/<img\b[^>]*>/gi)].filter(match => !/\balt="[^"]+"/i.test(match[0]));
  if (missingAlt.length) errors.push(`${name}: ${missingAlt.length} image(s) missing alt text`);
}

for (const template of window.PIVYA_TEMPLATES || []) validateEmail(template.id, template.html);
for (const profile of window.ALEMBIC_PRODUCT_PROFILES || []) validateEmail(`blank-${profile.id}`, window.ALEMBIC_BUILD_BLANK_EMAIL(profile));

if ((window.PIVYA_TEMPLATES || []).length !== 9) errors.push(`Expected 9 starter templates; found ${(window.PIVYA_TEMPLATES || []).length}`);
const cipro = (window.PIVYA_TEMPLATES || []).filter(template => template.product === 'ciprofloxacin');
for (const template of cipro) {
  if (/\bNDC\b/i.test(template.html)) errors.push(`${template.id}: NDC remains in partner-populated ordering block`);
  if ((template.html.match(/\[\[INSERT INFORMATION\]\]/g) || []).length !== 4) errors.push(`${template.id}: ordering placeholders are incomplete`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`PASS: 9 starter templates, 2 blank product frameworks, and ${assets.size} packaged assets validated.`);
