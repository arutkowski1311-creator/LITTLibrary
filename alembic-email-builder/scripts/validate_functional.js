const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.txt'), 'utf8');
const errors = [];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) errors.push(message);
}

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Function not found: ${name}`);
  const brace = app.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = brace; i < app.length; i += 1) {
    const char = app[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return app.slice(start, i + 1);
    }
  }
  throw new Error(`Unbalanced function: ${name}`);
}

function evaluateFunctions(names, extras = '', returnNames = names) {
  const source = `${extras}\n${names.map(functionSource).join('\n')}\nresult={${returnNames.join(',')}};`;
  const sandbox = { Blob, TextEncoder, TextDecoder, Uint8Array, Date, atob, btoa, result: null };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.result;
}

function balanced(html, tag) {
  const open = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
  const close = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
  return open === close;
}

global.window = {};
for (const file of ['assets.js', 'asset_data.js', 'ciprofloxacin_assets.js', 'templates.js', 'pharmacy_template.js', 'ciprofloxacin_templates.js', 'product_profiles.js', 'blank_email.js']) {
  require(path.join(root, file));
}

const requiredStaticIds = [
  'homeBtn','saveBtn','saveAsBtn','resetBtn','projectBtn','importBtn','packageBtn',
  'templateSelect','audienceSelect','subjectInput','preheaderInput','assetSearch',
  'assetCategory','addAssetBtn','assetGrid','runQaBtn','qaPackageBtn','emailFrame',
  'projectFile','modalOverlay','modalBody','modalActions','startOverlay'
];
for (const id of requiredStaticIds) assert(index.includes(`id="${id}"`), `Missing required UI control #${id}`);

const selectorIds = [...app.matchAll(/\$\('#([A-Za-z][\w:-]*)'\)/g)].map(match => match[1]);
const markup = `${index}\n${app}`;
for (const id of new Set(selectorIds)) assert(new RegExp(`id=["']${id}["']`).test(markup), `JavaScript references undefined control #${id}`);

assert(/v7\.2/.test(index) && /ALEMBIC EMAIL BUILDER 7\.2/.test(readme), 'Version labels are inconsistent');
assert((css.match(/{/g) || []).length === (css.match(/}/g) || []).length, 'CSS braces are unbalanced');
assert(/@media\(max-width:560px\)/.test(css), 'Small-screen builder layout rule is missing');
assert(/data-mode="mobile"/.test(index) && /value="375"/.test(index) && /value="430"/.test(index), 'Mobile preview controls are incomplete');

const blockIds = [...app.matchAll(/\{id:'([^']+)',icon:/g)].map(match => match[1]);
const blockMap = app.slice(app.indexOf('function blockHTML('), app.indexOf('function assetAllowedForCurrentProduct'));
for (const id of blockIds) assert(new RegExp(`\\b${id}:\\s*\``).test(blockMap), `Add-section block has no HTML implementation: ${id}`);

for (const id of ['alembicHeader','greenBand','blueBand','legalName','hero','imageCaption','patientProfile','twoColumnBuilder','threeColumnBuilder','genericOrdering','genericSavings','indication','isi','piCta','references','legalFooter']) {
  assert(blockIds.includes(id), `Reusable standard section is missing: ${id}`);
}
assert(/standardPositionedBlocks=new Set\(\['alembicHeader','greenBand','blueBand','legalName','indication','isi','piCta','references','legalFooter'\]\)/.test(app), 'Standard section placement list is incomplete');
assert(!/is already in this email/.test(app), 'A section is still blocked from being added more than once');
assert(/function standardInsertReference/.test(app) && /function standardBlockRow/.test(app), 'Standard section placement logic is missing');
assert(/block-group-title/.test(app) && /\.block-group-title/.test(css), 'Grouped section-library navigation is missing');
assert(/function imageLinkAnchor/.test(app) && /function setImageLink/.test(app) && /id="imageHrefEdit"/.test(app), 'Clickable-image editing is incomplete');
assert(/data-builder-columns="2"/.test(app) && /data-builder-columns="3"/.test(app), 'Flexible two- and three-column blocks are incomplete');
assert(/function normalizeEqualCardColumns/.test(app) && /tableLayout='fixed'/.test(app) && /33\.333%/.test(app), 'Equal-width three-card normalization is incomplete');
assert(/function columnControls/.test(app) && /function bindColumnControls/.test(app) && /function applyColumnBackground/.test(app), 'Independent column background controls are incomplete');
assert((blockMap.match(/data-builder-column=/g) || []).length >= 5, 'Flexible column blocks do not expose every column');
assert((blockMap.match(/<v:roundrect/g) || []).length >= 5, 'Flexible column CTA buttons lack Outlook VML fallbacks');
const { blockHTML } = evaluateFunctions(['blockHTML'], `
  const state={audience:'Pharmacy'};
  function currentProduct(){return 'pivya'}
  function currentEntry(){return {profileId:'pivya'}}
  function profileById(){return {primaryColor:'#249647',secondaryColor:'#0878C9',indication:'Approved indication',isi:'Approved safety information',footer:'Approved footer',piUrl:'https://example.com/pi'}}
  function optionalLegalNameRow(){return '<tr data-regulatory-legal-name="PIVYA"><td>Product name</td></tr>'}
  function escapeHTML(value){return String(value==null?'':value)}
  function escapeAttr(value){return String(value==null?'':value)}
`);
for (const id of blockIds) {
  const html = blockHTML(id);
  assert(/^<tr\b/i.test(html), `${id}: reusable block does not begin with a table row`);
  for (const tag of ['table','tr','td']) assert(balanced(html, tag), `${id}: reusable block has unbalanced ${tag}`);
}

const templates = window.PIVYA_TEMPLATES || [];
const profiles = window.ALEMBIC_PRODUCT_PROFILES || [];
assert(templates.length === 9, `Expected 9 starter templates; found ${templates.length}`);
assert(profiles.length === 2, `Expected 2 built-in product profiles; found ${profiles.length}`);
for (const template of templates) {
  assert(/^<!doctype html>/i.test(template.html), `${template.id}: missing doctype`);
  assert(/class="shell"[^>]*width="600"|width="600"[^>]*class="shell"/i.test(template.html), `${template.id}: 600px shell missing`);
  assert(/@media\s+screen/i.test(template.html), `${template.id}: responsive CSS missing`);
  for (const tag of ['table','tr','td']) assert(balanced(template.html, tag), `${template.id}: unbalanced ${tag}`);
}
for (const profile of profiles) {
  const html = window.ALEMBIC_BUILD_BLANK_EMAIL(profile);
  assert(/data-builder-placeholder-image/.test(html), `${profile.id}: blank framework image placeholder missing`);
  assert(/IMPORTANT SAFETY INFORMATION/i.test(html) && /INDICATION/i.test(html), `${profile.id}: protected regulatory sections missing`);
  for (const tag of ['table','tr','td']) assert(balanced(html, tag), `${profile.id}: blank framework has unbalanced ${tag}`);
}

const workflowMarkers = [
  "DB_VERSION=2",
  "createObjectStore('assets'",
  'function optimizeAssetPng',
  "category==='Product'&&!hasTransparency",
  'function deleteCustomAsset',
  'function customAssetsForHTML',
  'assets:customAssetsForHTML',
  'delete el.dataset.builderAssetId',
  'function referencedAssetUsage',
  'function buildDeploymentPayload',
  'function exportDeploymentPackage',
  'function optionalLegalNameRow',
  'function normalizeOptionalLegalName',
  'function normalizeAccidentalTextBackgrounds',
  'function normalizeCompactOrderingRows',
  'EMAIL_REFERENCE.pdf',
  'READ_ME_FIRST.txt',
  'CAMPAIGN_DETAILS.txt',
  'data-type-preset="heading"',
  'data-bg-shape="pill"',
  'data-section-shape="capsule"',
  'function applyElementBackground',
  'function applySectionBackground'
];
for (const marker of workflowMarkers) assert(app.includes(marker), `Workflow safeguard missing: ${marker}`);

assert(/accept="image\/png"/.test(index + app), 'Reusable asset PNG restriction is missing');
assert(/maxW=1200,maxH=1600/.test(app), 'Asset dimension limits are missing');
assert(/750\*1024/.test(app), 'Asset byte-size optimization target is missing');
assert(/recommendedWidth=Math\.max\(80,Math\.min\(600/.test(app), 'Recommended display-width guard is missing');
assert(/rgbaWithoutFallback/.test(app) && /Typography compatibility/.test(app), 'Style compatibility QA is incomplete');
assert(!/drawImage\(img\b/.test(app), 'PDF renderer can draw live image nodes and may taint the canvas');
assert(/bitmapFromEmailImage/.test(app) && /createImageBitmap\(new Blob/.test(app), 'Safe PDF bitmap pipeline is missing');
assert(/bytes>=90\*1024\?'warn':'pass','HTML weight'/.test(app), 'HTML clipping risk must warn without blocking the Send Folder');
assert(!/bytes>=102\*1024\?'error'/.test(app), 'HTML clipping risk still blocks the Send Folder');
assert(/badResolved\.length\?'warn'/.test(app), 'Unfinished production image hosting must warn without blocking the Send Folder');
assert(/Production hosting is not required to create the Send Folder/.test(app), 'Send Folder hosting guidance is missing');
assert(/Product legal name \(optional\)/.test(app), 'Optional legal-name block is missing from the Add workflow');
assert(!/row\.hasAttribute\('data-regulatory-legal-name'\)\|\|row\.hasAttribute\('data-regulatory-section'\)/.test(app), 'Optional legal-name block is still treated as a locked regulatory section');
assert(!/Regulatory product naming/.test(app) && !/Important Safety Information',text\.includes/.test(app), 'Preflight still assesses required regulatory content');
assert(/data-builder-legal-name-compact="true"/.test(app) && /padding:6px 28px 8px/.test(app), 'Compact two-line legal-name styling is missing');
assert(/Text background \/ pill/.test(app) && /data-bg-shape="none">No fill/.test(app), 'Clear no-fill text background control is missing');
assert(/hasBg\?1:0/.test(app), 'Text elements still default to an unintended background fill');
assert(/tightenOrderingRow/.test(app) && /builderCompactContent/.test(app), 'Compact ordering/CIN normalization is missing');

const { colorValue, blendWhite, safeImageName, decodeDataImage } = evaluateFunctions(
  ['colorValue','hexRgb','blendWhite','safeImageName','decodeDataImage','base64Bytes'],
  '',
  ['colorValue','blendWhite','safeImageName','decodeDataImage']
);
assert(colorValue('rgb(36, 150, 71)') === '#249647', 'RGB-to-hex conversion failed');
assert(blendWhite('#249647', 0.5) === '#92CBA3', 'Email-safe background tint conversion failed');
const usedNames = new Set(['asset.png']);
assert(safeImageName('asset.png', 'fallback', 'png', usedNames) === 'asset-2.png', 'Duplicate image filename protection failed');
const decoded = decodeDataImage('data:image/png;base64,iVBORw0KGgo=');
assert(decoded && decoded.ext === 'png' && decoded.bytes.length === 8, 'Embedded PNG decoding failed');

const zipStart = app.indexOf('function base64Bytes(');
const zipEnd = app.indexOf('function strBytes(');
const zipSource = `${app.slice(zipStart, zipEnd)}\nresult={makeZip};`;
const zipSandbox = { Blob, TextEncoder, Uint8Array, Date, atob, result: null };
vm.createContext(zipSandbox);
vm.runInContext(zipSource, zipSandbox);

(async () => {
  const zip = zipSandbox.result.makeZip([
    { name: 'TEST_SEND_FOLDER/EMAIL.html', data: '<!doctype html><p>Test</p>' },
    { name: 'TEST_SEND_FOLDER/images/product.png', data: new Uint8Array([137,80,78,71]) },
    { name: 'TEST_SEND_FOLDER/READ_ME_FIRST.txt', data: 'Three simple steps' },
    { name: 'TEST_SEND_FOLDER/EMAIL_REFERENCE.pdf', data: new Uint8Array([37,80,68,70]) }
  ]);
  const bytes = new Uint8Array(await zip.arrayBuffer());
  const text = new TextDecoder().decode(bytes);
  assert(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04, 'ZIP local header is invalid');
  assert(text.includes('EMAIL.html') && text.includes('product.png') && text.includes('EMAIL_REFERENCE.pdf'), 'ZIP omits required Send Folder files');
  assert(bytes.includes(0x50) && text.includes('READ_ME_FIRST.txt'), 'ZIP central content is incomplete');

  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`PASS: ${checks} functional contract checks completed.`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
