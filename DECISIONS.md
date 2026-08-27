# Decision & research log

A running history of **why** this product looks the way it does: the research we ran, the
discussions we had, and the changes that followed from them. Newest first.

**How this differs from the other docs:**
- `NOTES.md` = the *current* state and settled rationale (what's true now).
- `git log` = *what* changed, commit by commit.
- **This file** = the *narrative*: the trigger for a discussion, any research that informed it,
  what we decided, and which change (or none yet) came out of it.

**Entry format:** date · title · **Discussion** (what prompted it) · **Research** (if any, with
sources) · **Decision** · **Change** (commit refs, or "not yet built"). Status tags: **[agreed]**
settled · **[rec]** recommended, awaiting sign-off · **[open]** undecided.

---

## 2026-08-27 · Status filter: chips → dropdown (tidier, UX trade accepted) — BUILT

- **Discussion:** user asked why status isn't a dropdown like date/sort, defaulting to All or
  Needs attention. I flagged the trade — chips keep every count on screen (an earlier explicit
  requirement), a dropdown hides them behind a click; date/sort are view controls so dropdowns fit
  them, but status counts are the workload itself. Recommended keeping chips + All default.
- **Decision:** user chose the **tidier dropdown**, explicitly accepting the UX trade. Compromise
  built: status is a dropdown with the **count inside each option** ("Needs attention (8)"), so
  counts are one click away rather than gone. Default stays **All** (the attention block already
  pins the urgent work on top; defaulting to Needs-attention risks an empty screen on quiet days).
- **Also:** default page size dropped 25 → **10** so pagination shows immediately (10/25/50).
- **Change:** built + verified (harness green, live DOM check). Committed.

## 2026-08-27 · Worklist rebuild + banner rename — BUILT

- **Discussion:** user said "go ahead and build it, rename the banner too."
- **Change (built, not yet committed at time of writing):**
  - Landing rebuilt as a **single worklist** (tabs removed): status filter chips with
    date-scoped counts (Needs-attention ignores the date filter), inline date/sort controls +
    Mine-only, a pinned **Needs your attention** block (overdue + run-but-undecided; oldest-first;
    never paginates; ignores date filter; hidden on any single-status/attention chip; attributed
    per-row `⋯` dismissal + Dismiss-all confirm), grouped list with a **Coming up** section for
    inert future joiners, pagination (25/50/100, resets on filter/sort change), and **URL state**
    (`?f/?d/?s/?mine/?p`, `?candidateId` when a check is open) so the Back button restores the view.
  - **~60 seeded demo candidates** (`buildSeeds()`) so counts/overdue/pagination are real; fixed
    demo "today" = 15 Aug 2026. Seeds have no photos (clicking opens the check page); Rahul/Arjun/
    Meera remain the interactive three.
  - **Banner renamed** to **Verified / Needs review / Not verified** (`reportSummary` titles);
    human-vouched stays neutral grey (not green) to keep model-vs-human legible.
  - Verified by the render harness (**47 assertions, 0 syntax errors**) + a live DOM pass
    (chips sum to 67, attention 3, pagination inside Confirmed pages to "26–44 of 44", open→URL→
    Back all correct, dismissal records reason/who/when, Coming-up group renders).
- NOTES.md §A and §D moved to BUILT; §E now lists only the quality-gate model as pending.

## 2026-08-27 · Worklist rebuild — SIGNED OFF (build next)

- **Discussion:** walked the six open questions on the worklist rebuild wireframe; user answered
  all six and added requirements + five wireframe fixes.
- **Decision [agreed]:**
  1. Chip counts follow date range + Mine scope; **Needs attention ignores the date filter** and
     the block header states *"Includes N outside your selected dates."*
  2. Attention block hidden on any single-status filter **and** on the Needs-attention chip.
  3. Seed ~30–40 demo candidates: all four states, varied dates, ≥2 overdue (≈3d amber / ≈11d red),
     one overdue-because-undecided, one future joiner, one no-photos; enough **Confirmed** that a
     single status pages.
  4. Build real **URL routing** (list⇄check, filter/sort/page in URL) — losing your place on every
     candidate makes a 30-a-day list unusable.
  5. Keep the **"Find a candidate"** search (not just an escape hatch — it's how you reach people
     who aren't where the system says they are, the whole premise).
  6. Rename page to **"Identity checks"**.
- **Wireframe fixes applied:** dismiss demoted to a `⋯` menu + row chevron (primary action = open
  check); dismissal **requires reason + records who/when**, Dismiss-all gets a confirm step; pills
  **all filled**; chips on **one row**; date/sort dropdowns **inline auto-width**.
- **Build note:** sort dropdown drives the **main list only**; the attention block is always
  oldest-first as its own rule.
- **Parked [open]:** attention block mine-only for now; **row ownership/assignment out of scope**
  and is the prerequisite for a shared team attention queue.
- **Change:** corrected wireframe produced; NOTES.md §D moved to signed-off. Code not built yet.

## 2026-08-27 · Start keeping this research + discussion log

- **Discussion:** the team asked that we document not just decisions but the research behind them
  and the causal link between discussions and changes, so the *why* survives conversation
  compaction — not just the *what* in NOTES.md and git.
- **Change:** added this file; began logging retroactively from the recent reasoning-heavy work.
  Going forward, every research pass / discussion / decision gets an entry here in the same batch
  as any code change.

## 2026-08-27 · Overall verdict logic + legal posture — DISCUSSED, NOT BUILT

- **Discussion:** when rows disagree (e.g. 9 match, 1 not-a-match after a recruiter override),
  what is the *overall* status? Should any single not-a-match fail the whole check? Show an
  overall %? Should the *system* state the verdict while the recruiter only submits?
- **Research (web):**
  - **GDPR Art 22 + CJEU *SCHUFA* (2023):** a human who only records/forwards the model's output
    is a rubber stamp — the decision still counts as "solely automated" and is unlawful for
    significant-effect decisions. → the recruiter *must* keep genuine override power.
  - **EU AI Act:** biometric **verification** ("confirm a person is who they claim to be") is
    **exempt** from the high-risk track (which took full effect Aug 2026); identification /
    database search is not. → stay verification-only.
  - **NIST FRVT:** multi-reference verification **fuses** evidence (best-match / quality-weighted);
    unanimity is not required. False non-match rates **vary by sex and country of birth** →
    auto-rejection has a discrimination tail.
  - **Jumio / Onfido:** system renders yes/no, but "caution/maybe" is **routed to human review**,
    never auto-failed. Auto-rejecting bad photos is treated as a defect.
  - **iPhone Face ID:** 1:1 live 3D at ~1-in-1,000,000 FMR — good *principle* (high bar + liveness
    on controlled input), bad *model* to copy for messy multi-reference unanimity.
  - **India DPDP Act 2023:** facial images = sensitive personal data; consent + notice + purpose
    limitation + retention schedule required.
  - Sources: ICO Art 22 guidance; secureprivacy.ai (SCHUFA); IAPP + artificialintelligenceact.eu
    + id-pal (AI Act verification exemption); NIST FRVT program + IR 8429; asisonline (demographics);
    jumio.com/features; law.asia + ksandk.com (DPDP); didit.me (Face ID).
- **Decision:**
  - **[rec]** Overall status is **system-computed**, three tiers **Verified / Needs review /
    Not verified**; **no %**.
  - **[rec]** Turns on **confident contradiction, not the count** — one high-confidence not-a-match
    holds "Needs review" until a human resolves it; low-confidence dissenters fold into Verified.
    **No unanimity requirement.**
  - **[agreed]** The tool **never auto-rejects**; recruiter keeps per-row override; employment
    decision is downstream and human. Stay verification-only. Add a retention schedule.
  - Not legal advice — run past counsel before shipping a decision flow.
- **Change:** none yet (awaiting sign-off). Captured in NOTES.md §A/§B.

## 2026-08-27 · AI quality gate + per-row review model — DISCUSSED, NOT BUILT

- **Discussion:** the AI should first judge whether the source photo is even usable (blur, not
  facing camera, looking away, group photo, headgear), surface *why* alongside a Needs-review tag,
  and give the recruiter structured actions with an audit trail of both the AI tag and the human's.
- **Reframes that came out of the discussion:**
  - **[rec]** Row state = **(confidence × similarity)** — low confidence (quality) → Needs review
    regardless of score; high confidence + low similarity → Not a match; no face → Couldn't compare.
  - **[agreed]** **Headgear → facial-occlusion rule.** Never ask the AI to classify "religious vs
    non-religious" headwear (unreliable + discrimination/DPDP risk); flag only when the *face* is
    occluded. Religious headwear that leaves the face clear passes.
  - **[agreed]** **No-photo / no-face is NOT "Not a match"** — stays "Couldn't compare" (data
    problem, not an accusation).
  - **[rec]** Quality check in two places: **source pre-flight** at upload (soft warn, retake / run
    anyway) + **per-evidence** after run.
  - **[rec]** Recruiter actions **replace the four reason codes from `261c9e9`**: Same person /
    Not a match / Ignore this photo (+reason). "Can't tell" dropped.
  - **[agreed]** Store **both layers** per row for audit: AI tag + reason + raw scores, and
    recruiter action + reason + who + when.
- **Change:** none yet (awaiting sign-off). Captured in NOTES.md §C.

## 2026-08-27 · Landing worklist rebuild — DISCUSSED, WIREFRAME ONLY

- **Discussion driver:** the stale-joining-date failure — a candidate's date changes, nobody
  updates the system, and on the real day his row doesn't appear anywhere, so he joins unverified.
  Same failure as the real client case. The worklist must make an overdue, unverified person
  impossible to lose.
- **Decision [rec]:** kill the tabs → one list; four states (To verify / Awaiting decision /
  Confirmed / Can't confirm); status filter chips with counts; a pinned **"Needs your attention"**
  block that **never paginates, ignores the date filter, persists until verified or dismissed, is
  hidden on single-status filter, and has per-row attributable dismissal**; pagination + URL state
  so Back returns to the view; future joiners inert.
- **Open:** **[open]** attention block mine-only vs shared team queue; **[open, out of scope]** row
  ownership/assignment doesn't exist and is the prerequisite for a shared queue.
- **Change:** interactive wireframe produced for review; no code. Captured in NOTES.md §D.

## 2026-08-26 · Per-photo review redesign — BUILT (`261c9e9`)

- **Discussion (three rounds):** (1) the per-photo **%** was confusing and eight identical scores
  became eight identical green pills that "look perfect while telling us nothing"; (2) the banner
  had to **react** as rows were reviewed but **never turn green off human vouching**; Confirm must
  **not be gated**; the verbs must not read as a fraud accusation; **one badge per row**, not two;
  (3) the AI should carry quality reasons.
- **Research / finding:** investigated the **92%/96% bug** — traced it to Gemini returning
  near-constant scores per *image type*, not per face. `gemini-2.5-flash` is not a face-recognition
  model; it confabulates a plausible number, and temperature 0 makes it identical across similar
  inputs. → don't build pills on top of it.
- **Decision & change (built):** state pills **Match / Needs review / Not a match / Couldn't
  compare**; source-aware bars **85 / 65** with review floors 50 / 40; `reportSummary()` state
  machine (reacts to review, neutral "Reviewed" never green off vouching, mismatch stays red,
  inconclusive never red); reason codes; **Confirm / Can't confirm** (no gate; note required when
  confirming with unreviewed rows → recorded permanently); escalation **"Ask <interviewer> to
  confirm"**; drop the Captured/Similarity column headers, date under the name, +10% thumbnails,
  jump strip; **`USE_LIVE_SCORING` flag (default false)** with seeded demo scores — real embedding
  engine (Rekognition / Azure / ArcFace) is the v2 workstream. Verified by a 34-assertion render
  harness + syntax gate before push.

## 2026-08-24 – 2026-08-25 · Prototype build-out — BUILT (`9b7541b` … `41796d0`)

Compact rollup (full detail in NOTES.md + git):

- **Shipped:** hosting on Vercel with a serverless key **proxy** (key never in repo/browser); real
  Gemini compare fired in parallel; source-aware verdict banner + grouped sources (interview vs
  documents); unified on-file photos into one idle→running→done table; recruiter Accept/Reject →
  tabbed worklist with **consistent badges across both tabs**; banner moved **below the evidence**
  (evidence → verdict → decision); decision **completes the check** (soft-mandatory — undecided
  stays in "To verify"); removed "Shared with you"; humanize copy pass; dropped "strongest match
  %"; **segmented** tab style (an underline variant was tried and reverted); feature flags
  (`SHOW_STAGE_BADGE`, `SHOW_REPORT_ACTIONS`).
- **Gotchas discovered (the hard way):** embedded images truncated at 256KB caused the "cropping"
  *and* Gemini 400s; `thinkingConfig.thinkingBudget:0` is required or MAX_TOKENS eats the JSON;
  client-side downscale ≤1280px fixed mobile HTTP 413; apostrophes in single-quoted JS copy must be
  escaped (an unescaped one shipped a blank page once) → every push is now gated on a syntax check
  plus a headless render harness.
