#!/usr/bin/env python3
"""Rebuild the offline single-file dashboards from database.json and physicians.json.

Embeds database.json as window.__DB__ and the physicians.json roster as window.__PHYS__ into
index.html and physician.html, writing lit-library-standalone.html and physician-standalone.html.
Run after any change to the data or to the two dashboards:  python3 scripts/build_standalone.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BUILDS = {
    "index.html": "lit-library-standalone.html",
    "physician.html": "physician-standalone.html",
}


def main():
    db = json.loads((ROOT / "database.json").read_text(encoding="utf-8"))
    embed = ["<script>window.__DB__ = " + json.dumps(db, indent=2, ensure_ascii=False) + ";</script>"]
    phys_path = ROOT / "physicians.json"
    phys = []
    if phys_path.exists():
        phys = json.loads(phys_path.read_text(encoding="utf-8")).get("physicians", [])
        embed.append("<script>window.__PHYS__ = " + json.dumps(phys, ensure_ascii=False) + ";</script>")
    for src, out in BUILDS.items():
        lines = (ROOT / src).read_text(encoding="utf-8").split("\n")
        # The data goes just before the dashboard's main <script> block (the only bare "<script>" line).
        at = lines.index("<script>")
        built = "\n".join(lines[:at] + embed + lines[at:])
        (ROOT / out).write_text(built, encoding="utf-8")
        print(f"{out}: {len(db['items'])} items, {len(phys)} physicians embedded")


if __name__ == "__main__":
    main()
