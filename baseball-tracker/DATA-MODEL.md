# Situational Stat Engine — Event Sourcing

This is the part that makes the tool worth building. A normal scorebook stores
outcomes ("3-for-4"). We store **events with full context**, then *derive*
everything — scoreboard, box score, and deep player stats — from that one log.

## The principle: capture once, slice infinitely

The game is an **append-only log of events**. Every pitch and every batted ball
is one immutable event that records the **complete game state at that moment**:
inning, outs, count, who's on which base, and the score. Nothing is
hand-maintained downstream.

```
        ┌──────────────── the ONE source of truth ────────────────┐
        │   event log:  pitch, pitch, batted_ball, pitch, ...      │
        │   each stamped with {inning, outs, count, runners, score}│
        └──────────────────────────┬──────────────────────────────┘
                                    │  projections (pure functions of the log)
        ┌───────────────┬───────────┴────────────┬──────────────────┐
   ▼ Scoreboard     ▼ Box score            ▼ Player stat DB     ▼ Video clips
   R H E, inning,   per-player game line   career + situational  each event →
   count, runners   (derived, live)        splits                short clip
```

Because the base/out/score state lives **on every event**, you never re-enter
it. The engine carries state forward: after a play it computes outs recorded,
runners advanced, runs, RBI, and the *new* state — which becomes the context
for the next event. The scorer confirms/adjusts rather than re-typing.

## What "the level of detail is crucial" means concretely

Your example at-bat, fully decomposed, is in
[`example-atbat.json`](./example-atbat.json). Every batted ball — **including
outs** — carries:

| Field | Example values | Why it matters |
|---|---|---|
| `hardness` | soft, medium, hard, **scorched** | contact quality proxy for exit velo |
| `launch` | ground, **line**, fly, popup, **blooper** | trajectory |
| `spray_zone` | LF, LCF, **CF**, RCF, RF (+ IF slices) | direction |
| `depth` | infield, **shallow**, medium, deep, wall | "shallow blooper beyond SS" |
| `fielder` | SS, RF, ... | who made the play |
| `caught` | true/false | "rocket he **caught**" = hard-hit **out** |
| **state** | outs, count, `runners{1B,2B,3B}`, score | **the situation** |
| `result` | single … flyout, RBI, runs scored | outcome |

So "a rocket to the right fielder he caught with the bases loaded and two outs"
is one event: `hardness:scorched, launch:line, spray_zone:RF, depth:medium,
fielder:RF, caught:true, state:{outs:2, runners:{1B,2B,3B}}, result:flyout`.
That single row feeds a dozen different stats.

## Stats you get for free (derived, not entered)

**Standard box-score line** — AB, H, 2B/3B/HR, R, RBI, BB, K, AVG/OBP/SLG.

**Contact-quality / "expected" stats** — the payoff of tagging every ball:
- **Hard-hit %** (hard+scorched / balls in play)
- **Hard-hit-out rate** — the "he crushed it right at someone" / bad-luck signal
- Contact-quality distribution, avg per game/season
- **Spray & depth charts** — pull/oppo tendencies, "lives in the RCF gap"

**Situational splits** — because every event carries base/out/score state:
- With **RISP**, **bases loaded**, runners on / bases empty
- By **outs** (0/1/2), by **count** (ahead/behind/2-strike/first-pitch)
- By **inning / late-and-close**, by **score margin**

**Pitcher parity — same richness from the defensive side:**
- Velo, pitch type, location (strike-zone grid + chase) per pitch
- **Hard-contact-allowed %**, weak-contact %, whiff %, chase %
- Splits by count, by base-out state, by times-through-order
- Pitch mix and usage tendencies

All of the above are `GROUP BY` queries over the same event log — add a new
split later without recapturing a single game.

## Feeding your app "behind the scenes"

You already have the PoE cameras streaming into your app. Add three pieces:

1. **Scorer input surface** — a fast, keyboard-first tagging panel (the
   [prototype](./prototype.html) is the first cut). One person watches the
   synced angles and taps each pitch/ball; the engine fills the rest. This can
   be embedded in your app or run as a companion on a tablet in the press box.
2. **Event + stats service (the backend)** — receives events, appends them to
   the log, runs the projections, persists to the stat DB. One endpoint in,
   projections out.
3. **Realtime channel** — the service pushes state changes over **WebSocket/SSE**;
   your app's scoreboard and box score subscribe and re-render live. No polling.

```
 PoE cams ─▶ your app (streams) ─▶ scorer taps events ─▶ /events API
                    ▲                                        │ append + project
                    │            WebSocket/SSE  ◀────────────┘
              scoreboard + box score render live      stat DB (event log + splits)
```

"Behind the scenes" = the **stat computation is automatic**; the only human
input is the fast tap on each pitch/ball, which in the assisted phase is
unavoidable and, conveniently, also produces the labels that train the CV
automation (DESIGN §6, Phase 4) to eventually remove even that tap.

## Why event sourcing specifically

- **Auditable & correctable** — mis-tagged a play? Fix the one event and every
  stat recomputes. No divergent totals to reconcile.
- **Replayable** — reconstruct the scoreboard at any moment ("what did it look
  like in the 5th?").
- **Future-proof** — a stat you didn't think of today is just a new query over
  data you already have.
- **CV-ready** — when automation lands, model outputs append to the *same* log
  in the *same* shape; nothing downstream changes.
