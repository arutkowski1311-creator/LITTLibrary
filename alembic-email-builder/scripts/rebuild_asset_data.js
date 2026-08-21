const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
global.window = {};
require(path.join(root, 'assets.js'));

const catalog = window.PIVYA_ASSETS || [];
for (const asset of catalog) {
  const pngPath = asset.src.replace(/\.jpe?g$/i, '.png');
  if (fs.existsSync(path.join(root, pngPath))) asset.src = pngPath;
  const bytes = fs.readFileSync(path.join(root, asset.src));
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${asset.src} is not a PNG`);
  asset.width = bytes.readUInt32BE(16);
  asset.height = bytes.readUInt32BE(20);
  asset.bytes = bytes.length;
}
fs.writeFileSync(path.join(root, 'assets.js'), `window.PIVYA_ASSETS = ${JSON.stringify(catalog, null, 2)};\n`);

global.window = {};
delete require.cache[require.resolve(path.join(root, 'assets.js'))];
require(path.join(root, 'assets.js'));
require(path.join(root, 'ciprofloxacin_assets.js'));

for (const asset of window.PIVYA_ASSETS || []) {
  const bytes = fs.readFileSync(path.join(root, asset.src));
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${asset.src} is not a PNG`);
  asset.width = bytes.readUInt32BE(16);
  asset.height = bytes.readUInt32BE(20);
  asset.bytes = bytes.length;
}

const data = {};
for (const asset of window.PIVYA_ASSETS || []) {
  data[asset.src] = fs.readFileSync(path.join(root, asset.src)).toString('base64');
}

const output = `window.PIVYA_ASSET_DATA = ${JSON.stringify(data, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'asset_data.js'), output);
const fields = ['id','name','category','role','audience','recommendedPlacement','recommendedWidth','src','alt','width','height','bytes','tags'];
const csvValue = value => {
  const text = String(value == null ? '' : value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csv = '\uFEFF' + [fields.join(','), ...(window.PIVYA_ASSETS || []).map(asset => fields.map(field => csvValue(asset[field])).join(','))].join('\r\n') + '\r\n';
fs.writeFileSync(path.join(root, 'ASSET_LIBRARY_CATALOG.csv'), csv);
console.log(`Rebuilt asset_data.js from ${Object.keys(data).length} files.`);
