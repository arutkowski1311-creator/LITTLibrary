#!/usr/bin/env python3
"""
Build the Ausable House site with real photographs.

  photos/<slot>.jpg|.png     one file per slot (slot names: see PHOTOS in index.html)
  photos/credits.json        optional: { "<slot>": {"credit": "Photo: …", "license": "CC BY 4.0", "alt": "…"} }

  python3 build.py            -> dist/index.html  (photos embedded as data URIs; publish this as the artifact)
  python3 build.py --link     -> dist/index.html  (photos referenced as photos/<slot>.jpg; copy dist/ + photos/ to GitHub Pages)

Images are resized to fit 1800px on the long edge and re-encoded as JPEG (quality 80).
The hero slot is allowed 2200px. Nothing else in index.html is touched.
"""
import base64, io, json, os, re, shutil, sys
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "index.html")
PHOTOS = os.path.join(HERE, "photos")
DIST = os.path.join(HERE, "dist")
LINK = "--link" in sys.argv
MAXPX = {"hero": 2200, "river": 2000, "notch": 2000}

def encode(path, slot):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    m = MAXPX.get(slot, 1800)
    im.thumbnail((m, m), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=80, optimize=True, progressive=True)
    return buf.getvalue(), im.size

def main():
    html = open(SRC, encoding="utf-8").read()
    credits = {}
    cpath = os.path.join(PHOTOS, "credits.json")
    if os.path.exists(cpath):
        credits = json.load(open(cpath, encoding="utf-8"))
    slots = re.search(r"var PHOTOS = \{(.*?)\n\};", html, re.S).group(1)
    known = re.findall(r'^\s*"([^"]+)":', slots, re.M)
    photo_map, total = {}, 0
    os.makedirs(DIST, exist_ok=True)
    if LINK:
        os.makedirs(os.path.join(DIST, "photos"), exist_ok=True)
    for slot in known:
        for ext in (".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"):
            p = os.path.join(PHOTOS, slot + ext)
            if os.path.exists(p):
                data, size = encode(p, slot)
                total += len(data)
                meta = dict(credits.get(slot, {}))
                if LINK:
                    out = os.path.join(DIST, "photos", slot + ".jpg")
                    open(out, "wb").write(data)
                    meta["src"] = "photos/" + slot + ".jpg"
                else:
                    meta["src"] = "data:image/jpeg;base64," + base64.b64encode(data).decode("ascii")
                photo_map[slot] = meta
                print(f"  {slot:12s} {size[0]}x{size[1]}  {len(data)/1024:6.0f} KB  {os.path.basename(p)}")
                break
    missing = [s for s in known if s not in photo_map]
    # concierge data: refresh the in-page block in the source file too, so index.html is never stale
    cpath = os.path.join(HERE, "..", "concierge", "places.json")
    if os.path.exists(cpath):
        cjson = json.dumps(json.load(open(cpath, encoding="utf-8")), ensure_ascii=False).replace("</", "<\\/")
        html = re.sub(r'<script id="concierge" type="application/json">.*?</script>',
                      lambda m: '<script id="concierge" type="application/json">' + cjson + '</script>', html, count=1, flags=re.S)
        open(SRC, "w", encoding="utf-8").write(html)
        print(f"concierge: {len(json.loads(cjson)['places'])} places embedded")
    # network properties: merge properties/*.json (status live or pending-review) into the page
    pdir = os.path.join(HERE, "..", "network", "properties")
    if os.path.isdir(pdir):
        props = []
        for fn in sorted(os.listdir(pdir)):
            if fn.endswith(".json"):
                props.append(json.load(open(os.path.join(pdir, fn), encoding="utf-8")))
        pjson = json.dumps(props, ensure_ascii=False).replace("</", "<\\/")
        html = re.sub(r'<script id="properties" type="application/json">.*?</script>',
                      lambda m: '<script id="properties" type="application/json">' + pjson + '</script>', html, count=1, flags=re.S)
        open(SRC, "w", encoding="utf-8").write(html)
        print(f"properties: {len(props)} embedded")
    out = html.replace('<script id="photoMap" type="application/json">{}</script>',
                       '<script id="photoMap" type="application/json">' + json.dumps(photo_map).replace("</", "<\\/") + '</script>', 1)
    open(os.path.join(DIST, "index.html"), "w", encoding="utf-8").write(out)
    print(f"\n{len(photo_map)} photographs placed, {total/1024/1024:.1f} MB of image data; page {len(out)/1024/1024:.1f} MB")
    if missing:
        print(f"{len(missing)} slots still empty: " + ", ".join(missing))
    print("wrote", os.path.join(DIST, "index.html"))

if __name__ == "__main__":
    main()
