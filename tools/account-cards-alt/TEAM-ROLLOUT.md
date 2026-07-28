# Team rollout — Account Report Cards for the whole team

The tool is built in two halves:

- **The engine** — `account-cards.html` / `account-cards-standalone.html`. It's
  data-agnostic: it renders whatever dataset it's given and never contains a
  specific territory. This one file is what every rep uses.
- **The data** — one `account-cards.json` per territory. Each rep loads their own.

So making it a team tool is: give everyone the engine, and give each rep a clean
way to produce their `account-cards.json`.

## For a rep — three steps

1. **Get the intake workbook.** Open `territory_template.xlsx` (generate a fresh
   one any time with `python3 build_from_template.py --make-template`). Fill it in:
   one row per account on **Accounts**, then add your **Surgeons**, **Referrers**
   and **Reservoirs** (linked by the account `acronym`). Hover any column header
   for help; blanks are fine.
2. **Build your dataset.** Run:
   ```
   python3 build_from_template.py my_territory.xlsx
   ```
   → writes `my_territory.account-cards.json`.
3. **Open the tool and load it.** Open `account-cards-standalone.html`, click
   **“Load my data,”** pick your `.json`. Your cards render immediately — health
   grade, business charts, reservoirs, physician universe, SWOT and strategy.
   Everything is editable; **Export edits** saves your changes to a file.

No install beyond Python + `openpyxl` (`pip install openpyxl`). Works offline;
**Print / PDF** gives the two-page card per account.

## What the self-serve build gives you vs. what's added centrally

The workbook → JSON path computes everything data-driven from your inputs:
**health score, business KPIs, full-year projection, per-indication addressable
reservoirs, ranked LITT-naïve candidates (with the "why"), and seeded SWOT +
strategy plays** — all editable.

The **deep-dive research appendix** (KOL papers sorted by LITT-affinity, training
pedigree, NeuroBlate-vs-Visualase house) needs claims data + live web research, so
it's added **centrally per territory** — hand over your filled workbook and the
enriched dossiers get merged in. Until then, each physician still shows the
data-driven candidacy plus PubMed/profile drill-down links and an editable
field-notes line.

## Distribution options

| Model | How | Best when |
| --- | --- | --- |
| **Shared file** (recommended) | Put `account-cards-standalone.html` + the template + this guide on the team drive (SharePoint/Teams). Each rep loads their own data. | Simplest; no hosting; offline; prints. |
| **Hosted page** | Host the engine internally; serve each rep their `account-cards.json`. | You want one always-current link per rep. |
| **Via Claude Code** | Run the pipeline in this repo per territory. | You want to regenerate/enrich centrally and push updates. |

## Rebuilding the engine itself

The engine is generated from source; if you change the layout or scoring:
```
python3 ../physician-profiles/build_account_cards.py   # NE reference dataset
python3 ../physician-profiles/build_account_html.py     # engine HTML (all variants)
```
The rep-facing converter (`build_from_template.py`) is self-contained and does not
depend on the NE physician dataset, so it travels with just this folder.
