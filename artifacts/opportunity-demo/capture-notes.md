# Opportunity demo — capture notes and handoff

Status date: 2026-09-21

## Summary

The **Remotion production phase was completed**. The **Playwright capture phase was
not run** — this environment has no browser automation and no authenticated
SimpleCRM/Claude session. Scenes 3–6 are built, registered, renderable and driven
by a single data source, but that data source currently holds **placeholder
values**, not a real CRM capture.

Nothing in this repo should be presented as a real SimpleCRM result until the
capture pack below is produced and swapped in.

## What was actually done

- Built `OpportunityPromptScene` (270f), `OpportunityInsightsScene` (420f),
  `OpportunityQuestionsScene` (240f), `ClosingScene` (120f).
- Registered all four plus a `FullVideo` master assembly
  (1485 frames; scenes start at master frames 0, 240, 435, 705, 1125, 1365).
- Verified TypeScript compiles clean and inspected rendered stills at scene
  entry, chart reveal, tooltip, beat boundaries and ending.

## What was NOT done, and why

| Blocked step | Specific missing prerequisite |
|---|---|
| Run the approved Opportunity query in the real Claude UI | No Playwright/Puppeteer in the project, none installed globally, and no authenticated browser session is exposed to this environment |
| Capture `claude-connected-empty.png`, `claude-prompt-ready.png`, `claude-mcp-reading.png`, `claude-opportunity-answer.png`, `claude-stage-chart.png`, `claude-owner-chart.png`, `claude-top-opportunities.png` | Same as above |
| Produce `opportunity-data.json` with `dataMode: "crm_capture"` | Requires the real query result; the SimpleCRM MCP connector for this account is **not authorized in this session** and its OAuth flow cannot run non-interactively |
| Validate stage/owner/top-3 totals against retrieved records | No retrieved records exist yet |

## Placeholder / substitution inventory

Everything below must be replaced or re-confirmed before the video ships.

1. **All CRM values** — `src/data/opportunityData.ts` is marked
   `dataMode: "illustrative_demo"` and contains the production brief's planning
   example (12 opportunities, $240,000, September 2026, owners Priya Shah /
   Rahul Mehta / Neha Rao). These are **fabricated planning numbers**. They are
   internally consistent (stage values and owner values each sum to the stated
   total; stage counts sum to the stated opportunity count), but they describe
   no real account. Replace the file's contents with the captured export.
2. **Opening UI plate** — Scene 3 now uses the real user-supplied
   `claude-prompt-send.png` (1917×908) as its single base plate for the whole
   scene, which also avoids a greeting mismatch ("Evening" vs "Good morning")
   between plates.
3. **Typed question** — rendered as live text into the measured composer
   region (box x 740–1539, y 408–592; interior `#20201F`). The real typed
   text is masked and retyped so it can animate; wrapping therefore reflects
   our type (Montserrat 19/28) rather than the product's.
4. **Send control** — RESOLVED. Pixel-measured from `claude-prompt-send.png`:
   the real coral Send button occupies x 1491–1528, y 544–582 (centre
   1510, 563), fill `#C6613F`. The cursor now clicks that exact control, and
   the button is masked out until typing begins, matching the product's
   behaviour of only showing Send once the composer has text.
5. **Tool-activity beat** — no authentic retrieval capture exists, so Scene 3
   uses a "Reading opportunity data…" caption in our own type treatment. No
   native tool response or permission dialog is imitated.
6. **Answer summary + all charts** — authored graphics presented on a
   *minimal reconstruction* of Claude's dark surface (`ClaudeSurface`: page
   background, response mark, quiet composer) so the charts read as part of
   the product rather than a separate light slide. This is an authored
   approximation built from measured colours — it is **not** a screenshot of
   Claude's real response UI, and the numbers in it are only as truthful as
   the data module. Replace with real captures where possible.

## Data contract expected from the capture run

Replace `src/data/opportunityData.ts` with the captured values, keeping the same
shape, and set `dataMode: "crm_capture"`. The scenes read every number from that
one module (KPIs, bar geometry, tooltip, donut arcs, table rows), so a correct
swap updates the whole video with no layout edits.

Re-verify after swapping:

- Stage values sum to total pipeline value; stage counts sum to opportunity count.
- Owner values (including any grouped/unassigned remainder) sum to the same total.
- Top opportunities are in descending amount order.
- The period label matches the resolved reporting window, and currency is stated.
- If the real result has many owners, the donut should be switched to horizontal
  owner bars (as the brief instructs) rather than crowding the arc.

## Known composition conflict to resolve

`src/Composition.tsx` currently registers `IntroScene` and `ConnectorScene` at
**fps 60** and `FullVideo` at **fps 40** (edited outside this work). The brief
specifies **30 fps throughout**, and every scene's frame timing — including the
1485-frame / 49.5s master total — assumes 30. At 60/40 fps those scenes play
1.3–2× faster than designed. The four new scenes are registered at 30 fps.
Recommend setting all compositions back to `fps={FPS}` (30).
