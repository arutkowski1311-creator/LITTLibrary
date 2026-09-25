# Content

Review-ready social posts drafted by the Content Creation Engine
([`../docs/content-creation-engine.md`](../docs/content-creation-engine.md)) from the verified
evidence in [`../database.json`](../database.json). Nothing here is posted automatically.

| File | What it is |
| --- | --- |
| `<date>-batch.md` | One run's drafts, grouped by channel (personal LinkedIn, Epilepsy Collab, Brain Tumor Collab) |
| `ledger.json` | Every drafted post and its status (`drafted → approved → posted`, or `dropped`); stops reruns from re-posting the same finding on the same channel |
| `calendar.json` | Upcoming society meetings and awareness days to plan posts around |
| `collab-growth-playbook.md` | Positioning, launch plan, meeting promotion, ad copy, targeting, and KPIs for both Collabs |

## Batches

| Date | Library scan window | Personal | Epilepsy Collab | Brain Tumor Collab | File |
| --- | --- | ---: | ---: | ---: | --- |

## Workflow

1. `/content-engine` (or `/content-engine full`) — refreshes the library if the last scan is
   more than 14 days old, then drafts a batch. `/content-engine draft tumor` drafts Brain Tumor
   Collab posts only from the current library.
2. Review the batch: pick hook A or B, edit to your voice, then post (or load into a scheduler).
3. Tell Claude what went out ("posted li-01 and ep-02 today, here are the links") so the ledger
   is marked `posted`. Add engagement notes when you have them; they steer later batches.
