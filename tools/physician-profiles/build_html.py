#!/usr/bin/env python3
"""Regenerate standalone + artifact HTML from template + JSON.
Standalone = full template + embedded JSON (opens by double-click).
Artifact  = style + body-inner + embedded JSON, outer skeleton & web fonts
            stripped (claude.ai wraps it in <!doctype><html><head><body>)."""
import json, os

REPO = "/home/user/LITTLibrary"
tpl = open(os.path.join(REPO, "physician-profiles.html")).read()
raw = open(os.path.join(REPO, "physician-profiles.json")).read()
# validate JSON
json.loads(raw)

embed = "<script>window.__EMBED__=" + raw + ";</script>\n"

# ---- standalone: inject embed right before <body> ----
assert tpl.count("<body>") == 1
standalone = tpl.replace("<body>", embed + "<body>", 1)
open(os.path.join(REPO, "physician-profiles-standalone.html"), "w").write(standalone)

# ---- artifact: <style>..</style> + embed + body-inner (no skeleton, no fonts) ----
s0 = tpl.index("<style>")
s1 = tpl.index("</style>") + len("</style>")
style_block = tpl[s0:s1]
b0 = tpl.index("<body>") + len("<body>")
b1 = tpl.index("</body>")
body_inner = tpl[b0:b1].strip("\n")
artifact = style_block + "\n" + embed + body_inner + "\n"
open(os.path.join(REPO, "physician-profiles-artifact.html"), "w").write(artifact)

print("standalone bytes:", len(standalone))
print("artifact bytes  :", len(artifact))
print("artifact starts:", artifact[:20].replace("\n", " "))
print("artifact ends  :", artifact[-20:].replace("\n", " "))
