#!/usr/bin/env python3
"""Merge enrich/*.json into research_recent.jsonl and training.jsonl.
Field-level last-wins: never overwrite a non-empty value with an empty one."""
import json, glob, os

HERE = os.path.dirname(os.path.abspath(__file__))

def load_jsonl(path):
    d = {}
    if os.path.exists(path):
        for l in open(path):
            if l.strip():
                o = json.loads(l)
                d[o["name"]] = o
    return d

recent = load_jsonl(os.path.join(HERE, "research_recent.jsonl"))
train = {}
tpath = os.path.join(HERE, "training.jsonl")
if os.path.exists(tpath):
    for l in open(tpath):
        if l.strip():
            o = json.loads(l)
            train[o["name"]] = o.get("training", "")

files = sorted(glob.glob(os.path.join(HERE, "enrich", "*.json")))
print("enrich files:", [os.path.basename(f) for f in files])
n_papers = 0
for f in files:
    try:
        arr = json.load(open(f))
    except Exception as e:
        print("SKIP (bad json):", f, e); continue
    for o in arr:
        name = o["name"]
        # recent papers: only overwrite if new non-empty
        rp = o.get("recent_papers") or []
        if rp:
            recent[name] = {"name": name, "recent_papers": rp}
            n_papers += len(rp)
        # training: only overwrite if new non-empty
        tr = (o.get("training") or "").strip()
        if tr:
            train[name] = tr

# write research_recent.jsonl
with open(os.path.join(HERE, "research_recent.jsonl"), "w") as fh:
    for name in sorted(recent):
        fh.write(json.dumps(recent[name]) + "\n")

# write training.jsonl
with open(tpath, "w") as fh:
    for name in sorted(train):
        fh.write(json.dumps({"name": name, "training": train[name]}) + "\n")

print(f"recent records: {len(recent)}  | new papers this merge: {n_papers}")
print(f"training records: {len(train)}")
