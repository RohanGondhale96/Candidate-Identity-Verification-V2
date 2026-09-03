# Notes for the team

Context and intentional decisions behind the Verify Identity prototype, so nothing here
looks like an accident.

> See `DECISIONS.md` for the chronological log — the research and discussions that led to each
> change. This file is the current state; that one is the story.

## v2 card-style UI (implemented in source; light mode)

The three screens (worklist → setup → report) were redesigned into a card-style system and
implemented directly in `verify-identity.html` (the source that builds `index.html`). Light
mode only for now — dark mode / the nav sun-moon toggle are deferred (the standalone R&D mocks
carry the dark theme). What changed:

- **Shared visual tokens** aligned to the mocks: cool-grey ground `#EEF1F5`; every `.rh-card` at
  16px radius with the soft lifted shadow (`0 1px 2px … , 0 8px 22px …`) and `#E5E9F0` border;
  nav slimmed to 54px on `#0C1016`; the thinner 3px multi-stop rainbow bar.

- **Report** is a per-round **card feed** (`reportFeed` / `reportCard`): a candidate header
  card, a "Photo taken today" card, an **All rounds / Needs review toggle** (`state.reportView`,
  `setReportView`), then one card per round grouped by type. Matched / Couldn't-compare rounds
  are calm collapsible strips; Needs-review / Not-a-match are full cards. Thumbnails show only
  when a card is collapsed; a collapsed flagged card keeps its verdict in the header chip.
  Verdict actions sit side by side with semantic icons. The **Submit report** control is a bar
  **docked at the end of the report** (a normal card after the last round — it was a sticky
  floating bar, un-floated 2026-09-02 as distracting);
  once a report is submitted it becomes a normal "Report submitted" confirmation card instead.
  The bar shows the **count breakdown** ("N still need your review" while pending, the resolved
  tally once done) beside the button. The overall **verdict pill was removed from the bar**
  (2026-09-02, manager) — per-round status pills still convey Match/Needs review/etc, and the
  post-submit confirmation card shows the final status. The old standalone verdict banner card was
  also removed earlier.
  **Guide-review (soft gate):** while any flagged round is unreviewed the bar's primary action is
  **"Review flagged (N)"** (`jumpToFlagged` — smooth-scrolls to the next round still needing a
  verdict) and **"Submit anyway"** is a quiet secondary; once all flagged rounds have a verdict the
  bar flips to a single confident **"Submit report"**. While anything is pending the verdict pill
  reads **"Not reviewed"** (amber) with a short "N still need your review" line — the real verdict
  (Verified / Needs review / Not verified) and the full breakdown only appear once every flagged
  round has a verdict. Submission is NOT hard-blocked — "Submit
  anyway" still works, and the submit dialog then requires the "I've reviewed all the comparisons"
  checkbox + a note for unreviewed rounds (soft-mandatory, recruiter judgment + audit trail).
- **No repeated caption:** the reference photo's overlay no longer repeats the round label/date
  (those live in the card header); it shows only what the header doesn't — "Interviewed by {name}"
  (or "Identity document" / "On-file photo") + how old the photo is ("74 days earlier").
- **Copy:** "Face-match score" (was "Model similarity"); "Match line · 85/65%" (was "Photos/
  Documents match at N%"); "Why this needs a look:" / "Why this may not match:" (was "Likely
  cause…"); the action prompt is "Is this the same person?"; recorded verdicts read "Same
  person, confirmed by review" / "Marked not a match" / "Photo ignored …".
- **Setup:** the pre-run preview chip reads **"Not matched yet"**; the documents group is
  labelled "scored more leniently (older, lower-quality scans)".
- **Worklist:** **two tabs** — **To verify** (active: to-verify + in-review, with "Coming up" at the
  bottom) and **Completed** (verified / not verified / needs review), each with a count
  (`state.wlTab`, `isCompleted`, `setWlTab`). Rows use the **candidate's photo** as the avatar
  (`candAvatar`, initials fallback); coming-up rows keep the calendar glyph. Overdue candidates fold
  into the To-verify tab (sorted to top, red/amber "expected · N days ago") — no separate attention
  block. Filters (Status / Dates / Sort) are tidied and the **Status dropdown is scoped to the
  current tab**. Kebab: "Change joining date" + "Not joining" (overdue/upcoming). Mobile row
  sub-lines wrap (`.wl-sub`). Search hint reworded.
- **Upload / verification animation — AI-scan motif:** the joining-day photo gets a face-scan
  overlay (corner reticle, faint grid, vignette, sweeping laser line) and the loader is a
  radar-sweep (cyan conic sweep + pulsing core), shown during **both** the quality pre-flight and
  Run verification (row thumbnails get a matching cyan scan-sweep). The card heading is a stable
  **"Upload joining day photo"**; the transient status ("Checking your photo…" / "Running
  verification…", each with the radar) lives in the **right column beside the photo**, not in the
  heading — so no heading ever contradicts the status line. `prefers-reduced-motion` disables the
  sweeping motion.
- **Upload/setup card layout (redesigned 2026-09-03, manager):** header row is heading + hint on the
  left with **"Use a different photo"** docked **top-right, in line with the heading** (shown only
  once a photo is loaded and not mid-run). Once a photo is chosen the body is a **two-column row** —
  the 150×186 photo on the left, the **two consent/attestation checkboxes on the right** — with a
  full-width **Run verification** below. Removed: the "Ready to compare" sub-heading, the "Every
  photo on file is compared separately. Scores are never averaged." line, and the green "Photo looks
  good to compare." confirmation (a good photo now just shows the checkboxes directly). The
  **poor-quality amber warning is kept**, sitting above the checkboxes in the right column. On mobile
  the row wraps (checkboxes drop below the photo). During the quality pre-flight or a run the right
  column shows the radar status instead of the checkboxes and the Run button is hidden.
- **Scroll-on-complete:** when the verification run finishes, the page eases (a
  `requestAnimationFrame` tween, `smoothScrollToEl`) up to the top of the report (`#rpt-top`,
  the "Photo taken today" card) after a ~240ms beat, so it doesn't snap you mid-report onto a
  flagged round — you glide to the top and read down. (Native `behavior:'smooth'` is unreliable in
  some webviews, hence the manual tween.)
- The `~52`-assertion harness (`verify_report.js`) still passes — all logic functions are
  unchanged; only render/markup/copy moved.
- **Revert baseline:** `D:\Codebase\identity-verify-rnd\snapshot-2026-08-31\v1-original-ui\`
  holds the pre-v2 source ("v1"). Standalone R&D mocks + this whole design system live in
  `…\v2-card-ui\` with a README.

## Mobile (≤560px)

The v2 report adapts on narrow screens: the flagged-round **action buttons** stack one-per-row
(`.rpt-acts`); the **floating Submit bar** stacks (verdict pill + breakdown on top, full-width
Submit below, `.rpt-subbar`); the **two compare photos** stack full-width at a 1/1 crop for face
scrutiny (`.rpt-panes` / `.rpt-pane`). Candidate cards render "—" for missing Email/Phone. Worklist
role text truncates with "…" in tight rows (accepted).

## Accessibility (WCAG 2.1 AA — partial, 2026-09-03)

A focused a11y pass has been done; **not fully AA yet** — known gaps listed at the end.
- **Keyboard:** clickable `role="button"` divs (candidate rows) are activated by Enter/Space via a
  global `keydown` listener in `init()`. Native buttons/selects/inputs work as usual.
- **Focus:** global `:focus-visible` outline (2px `#0076FB`) on all interactive elements.
- **Contrast (text):** muted greys are AA-passing — `#667085` (was `#8A94A4`, now 4.97:1) and
  `#6E6E6E` (was `#9a9a9a`, 5.10:1). Status uses dot **+** label (not colour alone).
- **Motion:** `prefers-reduced-motion` disables all CSS animation/transition and makes the
  completion-scroll jump instead of animate.
- **ARIA:** the segmented controls (worklist tabs, report All/Needs-review) use the toggle-button
  pattern — `aria-pressed` + a `role="group"` label. Icon-only buttons have `aria-label`;
  `<html lang="en">` is set.
- **KNOWN GAPS (not yet addressed):** brand blue `#0076FB` white-on-blue button + blue-as-text are
  ~4.21:1 (kept per brand decision); non-text/border contrast (1.4.11) — some `#C6C6C6`/`#A5A5A5`
  borders < 3:1; no full ARIA tab pattern (arrow-key nav); most section titles are styled `<div>`s
  rather than real headings.

## Hidden behind feature flags (in `index.html`)

These are built and working but intentionally hidden for now. To bring one back, flip its
flag to `true` in `index.html` (search for the flag name) and redeploy.

| Flag | Default | What it controls |
|------|---------|------------------|
| `SHOW_STAGE_BADGE` | `false` | The candidate "stage" pill (e.g. "Onboarding") on the candidate card. |
| `SHOW_REPORT_ACTIONS` | `false` | The **Download PDF** and **Share report** buttons in the report header. |

Notes on those:
- **Download PDF** (`downloadPdf`) is currently a stub — it just shows a toast. A real PDF
  export still needs to be built before this is switched on.
- **Share report** (`openShare` + the share dialog) is fully functional (in-page only, no
  backend) and can be switched on any time.

## Per-photo state — pills, not percentages

- Each photo row shows **one badge**, not a number: **Match / Needs review / Not a match /
  Couldn't compare**. As of 2026-09-02 the raw **% is not shown anywhere** in the report (the
  "Face-match score" bar / match-line was removed from the expanded card, and the "N% · matches"
  from the compact rows, on the manager's call) — the badge carries the state; the recruiter judges
  from the two photos + the "Why this needs a look" cause. The score still exists in the data
  (`r.score`) for tuning/disputes, just not surfaced.
- **Source-aware thresholds** (in `photoBar()` / `reviewFloor()`):
  - Photos (application/interview): Match **≥85**, Needs review **50–84**, Not a match **<50**.
  - Identity documents: Match **≥65**, Needs review **40–64**, Not a match **<40** (older,
    lower-resolution, so a lower bar).
- **"Couldn't compare"** is a distinct fourth state (no face detected, glare, unreadable scan).
  It is **grey, never red** — a bad scan must not look like a genuine mismatch — and it is
  **excluded from the denominator** (`reportSummary` counts it separately: "N documents couldn't
  be read"). It never gates anything. The row prints the reason ("No face detected in this
  document"). See `photoState()`.

## Overall verdict banner — reports state, never a fresh verdict

`reportSummary()` drives the banner. Its job is to **report the current state, not invent a new
verdict**, and to keep **model-matched vs human-vouched legible forever** (never collapse them
into one number). Tiers:

- **Match** (green) — every comparable photo matched *by the model*, nothing flagged. Unread
  documents don't stop this; the banner just footnotes "· N document couldn't be read".
- **Needs review** (amber) — open review rows, or anything a human marked **Can't tell**.
- **Possible mismatch** (red) — any **Not a match** still open, or anything a human marked
  **Different person**. Suggests *Can't confirm*.
- **Reviewed by A. Sharma** (neutral grey, **not green**) — every flagged row was resolved
  positively by a human ("N matched · M confirmed by your review"). Deliberately **not green**:
  green would launder human judgment into a machine match, so someone reading the report next
  month can still tell which rows the model matched and which a person vouched for.
- **Couldn't run the check** (neutral) — nothing comparable (no photos, or all unreadable). Not
  a pass, not a fail; never red — the candidate did nothing wrong, our intake did.

The banner **reacts** as the recruiter records reasons (amber/red → neutral once resolved), but
never flips to a clean "Match" off human vouching.

## Report row layout

- No column headers at all (the old **Captured** / **Similarity** labels are gone). Each row is:
  thumbnail (~10% larger than before), then **name with the captured date/time directly under
  it**, then the single state badge, then a chevron.
- The **interviewer's name is not on the row** — it moved into the expanded panel (see below),
  because on a fail the person who ran that round is who you'd call, and that belongs next to the
  comparison, not cluttering the list.

## Per-photo review — the expanded row (redesigned 2026-08-28)

- **Flagged rows are open by default.** Unresolved **Needs review** / **Not a match** rows expand
  automatically (the accordion allows multiple open at once, `effectiveOpen()` / `openRows`), so the
  work needing the recruiter's judgment is front and centre. **Match** and **Couldn't-compare** rows
  stay collapsed. Recording a verdict (Same person / Not a match / Ignore) **leaves the row open**
  (showing the recorded action + audit) — no abrupt auto-collapse; the recruiter collapses it by
  clicking the row. (Changed 2026-08-28 — auto-collapse-on-resolve felt jarring.)

Each expanded row (`reasonCodes()` + the expanded panel in `render()`) shows:

- **Two photos side by side, captions overlaid on each** (bottom, over a dark scrim): **reference
  on the left**, **"Photo taken today" on the right** (deliberately swapped). The reference caption
  carries a **relative age** ("02 Jun 2026 · 74 days earlier", `reportRelAge()` vs the demo today).
- A **model-similarity bar** (`similarityBar()`): the score filled in, coloured by state
  (green/amber/red), with the **match threshold marked** — "Photos match at 85%" / "Documents match
  at 65%".
- A full-sentence **likely-cause callout**, labelled **"Likely cause for review:"** or
  **"Likely cause for not match:"** by state. The sentence is seeded per flagged photo (`cause`
  field), falling back to the short `aiReason()`; the live version comes from the model.
- **"Interviewed by &lt;name&gt;"** as context (an "Ask … to confirm" button was prototyped here
  and removed).
- **Three action cards** under "WHAT DID YOU FIND?": **Same person** / **Not a match** / **Ignore
  this photo** (a no-match row drops the redundant "Not a match" card). No "reason required" label.
- **Same person** applies immediately (toggle). **Not a match** and **Ignore** open a **reason
  popup** (`openReasonModal` → `confirmReason`): pick a reason (Not-a-match: *Clearly a different
  person / Facial features don't match / Other*; Ignore: the six `IGNORE_REASONS` **plus Other**) +
  a note, Confirm needs a reason, Cancel leaves the row unresolved. **Picking "Other" makes the
  note mandatory** — Confirm is blocked with an inline error until it's filled (otherwise the note
  is optional).
- **"Ignore this photo" = exclude that whole comparison from the verdict.** Ignoring the Round 2
  photo drops Round 2 out of the calculation; the identity confirmation is computed over the
  remaining rounds only. The row stays visible with an **"Ignored"** badge + reason (audit), the
  banner notes "N ignored", and the denominator drops (5 of 7 → 5 of 6). If every row is ignored →
  "Couldn't run the check".
- Actions are **non-binding on the verdict**; they change the row to a single combined badge
  (*Reviewed · same person* green / *Reviewed · different person* red / *Ignored* grey).
- Once reviewed, the three action cards collapse into a **clean one-line record** (changed
  2026-08-28) — a coloured dot + *"Same person, confirmed by review · time"* (or *"Not a match,
  &lt;reason&gt; · time"* / *"Ignored · &lt;reason&gt; · time"*, note beneath) + a **Change** link
  that re-shows the cards. The AI's original finding stays visible just above in the **likely-cause
  callout**, so the model-vs-human context isn't lost even though the line is clean. The full record
  (AI tag + scores + human action + reason + note + who/when) is still kept in the row data for the
  audit trail. **Structured reasons, not free text** — searchable, defensible, tuning data for v2.

## The end of the report — Submit (recruiter does not confirm/deny identity) — changed 2026-08-28

- **The recruiter does not personally confirm or deny the candidate's identity.** The *system*
  carries the verdict (the Verified / Needs review / Not verified banner); the recruiter's real
  input is the **per-row review** (Same person / Not a match / Ignore, each with a reason), and at
  the end they **Submit the report**. Earlier this was a Confirm identity / Can't-confirm decision;
  that was pulled back to a plain **Submit** on the user's call — the recruiter shouldn't be the one
  declaring an identity confirmed or denied.
- **Still legally sound.** The concern behind the old Confirm/Can't-confirm was GDPR Art 22 /
  SCHUFA (a human who merely rubber-stamps an automated output is still "solely automated"). Here
  the human genuinely shapes the outcome via the per-row review, so it isn't a rubber stamp — and
  submitting **never auto-executes an adverse action**; the hire/no-hire call stays downstream.
- **Submit takes a confirmation.** Clicking **Submit report** opens a popup requiring a **mandatory
  checkbox — "I've reviewed all the comparisons for this candidate before submitting"** — plus an
  optional note (**required if any comparison is still unreviewed**, and the popup says how many).
  Submit is disabled until the checkbox is ticked. The record reads *"Report submitted by A. Sharma
  · time"* with the system status chip and, if any, "N unreviewed". Reopen re-opens it.
- No "fraud"/"reject" language anywhere; the escalation is carried by the **status itself** (a
  submitted "Not verified" / "Needs review" report *is* the flag; a real routing/queue is future).
- **Layout is evidence → verdict → submit** (scored rows, then the banner, then Submit).
- The "by A. Sharma" name and timestamps are **hard-coded placeholders**.

## Landing screen — tabbed worklist (SUPERSEDED — see the "Landing worklist rebuild" section)

> This describes the original tabbed landing, which was **replaced** by the single-list worklist
> (§ "D. Landing worklist rebuild"). Kept for history only.

- Two tabs: **Joining today** (default) and **Checks you ran today**.
- **Joining today** is a worklist: candidates split into **To verify** and **Done** (sentence-
  case group headers). A candidate is only **Done once a recruiter has decided** (Confirmed /
  Can't confirm). Running the check alone does **not** move them off the list. Row badge by state:
  **To verify** (never run) → **Decision pending** (run, but no decision yet — stays in
  the To-verify group) → **Confirmed / Can't confirm** (decided → Done).
- The whole row is clickable, no separate "Verify" button: a never-run row starts a fresh
  check; a row that's already been run reopens its report (to decide or review).
- **Checks you ran today** = "Your checks today" (your run history). (A "Shared with you"
  section was prototyped and removed — bring it back only with a real backend.)
- **Badge is consistent across both tabs** (`entryBadge`): a run-but-undecided check shows
  **Decision pending** in *both* the worklist and the checks list; a decided one shows
  **Confirmed / Can't confirm** in both. The raw verdict (Match/Review/No match) lives in the
  report, not in the list badges.
- **Tab style** is the **segmented control** (the beige pill with a white active tab), kept on
  purpose — an underline-tab variant was tried and reverted. Don't "fix" it back to underline.
- Kept small for the demo; at real-company volume this is where you'd add filtering / paging.

## What is mocked / in-session only (needs a backend)

Nothing here persists to a server — it lives in the browser session and resets on reload:

- **Decisions** (Confirm/Can't confirm), reason codes, and their audit trail — stored in-session
  on the check record.
- **Per-photo scores** — seeded, not from a live model (see the scoring-engine note above).
- **"Can't confirm" flag destination** — no real escalation owner is notified yet.
- **Share report** — in-page only (no real recipients/notifications). Currently hidden behind
  `SHOW_REPORT_ACTIONS`. (The earlier "Shared with you" mock list was removed.)
- **Run history** ("Checks you ran today") — resets on reload.

## Copy / microcopy

- The UI copy went through a light "humanize" pass — plainer, more direct, active voice.
  Notable wording: the search intro ("Compare the person who showed up today…"), the empty /
  no-round notes say what to do ("Ask your RippleHire admin to add one"), the decision hint
  ("Suggested: Confirm / Can't confirm", "Your call"), and the report footer.
- The **consent + attestation lines** are kept precise on purpose — consent copy favours clarity
  over brevity. Current wording (reworded 2026-09-03): "I have obtained consent from the candidate
  to use this photo for identity verification." and "This photo was taken on the joining date, of the
  person who reported to join."
- **Editing copy — watch the quotes.** Most strings are built as single-quoted JavaScript, so
  any apostrophe inside copy must be escaped: write `candidate\'s`, not `candidate's`. An
  unescaped apostrophe breaks the whole script (blank page). After changing copy, sanity-check
  by loading the page or running the render smoke-test in the scratchpad.

## Sample identity documents

- The Aadhaar / PAN / driving-licence entries are **composited SAMPLE mock cards**, not real
  documents. Each carries a "SAMPLE · FOR DEMO ONLY" watermark and the candidate's own face
  in the photo box (so the face match still works for the demo).
- In the real product these would come from the candidate-portal document uploads, and the
  face would be detected/cropped from the actual document image.

## Scoring engine — known bug, and why the demo is seeded

- **Gemini is not a face-recognition model.** With live scoring on, `gemini-2.5-flash` returned
  a near-constant score per image *type* — every interview ~92, every document ~96 — regardless
  of the actual faces. It ignores the "use non-round, non-repeating numbers" instruction, which
  is the tell that the number is a confabulation, not a measurement. Eight identical scores that
  turn into eight green pills look perfect while telling you nothing.
- **So the demo does not score with Gemini.** `USE_LIVE_SCORING` (top of the app script) defaults
  to **`false`**: the report is driven by **seeded per-photo scores** that have real spread, so
  the four states, reason codes, and banner logic are all demonstrable. Rahul (`RH48213`) is the
  mixed showcase (a review, a no-match, an unreadable PAN); Arjun (`RH47980`) is a clean all-match.
- Flip `USE_LIVE_SCORING` to `true` to call Gemini again (`api/compare.js`, key from the
  **`GEMINI_API_KEY`** Vercel env var, never in the repo/browser; joining photo downscaled
  ≤1280px before upload). But **don't ship pills on top of it** — the real fix is a genuine face
  **embedding** engine that returns a true per-pair distance: AWS Rekognition `CompareFaces`,
  Azure Face `verify`, or the ArcFace/Facenet path in the DeepFace POC. That's the v2 workstream.
- Gemini stays useful for one thing it's actually good at: the **"Couldn't compare"** check (is
  there a usable face at all). Split architecture for v2 — embedding model for the score, vision
  model for the quality gate.

## Demo tips

- Deep links: `/?candidateId=RH48213` (Rahul), `/?candidateId=RH47980` (Arjun).
- Scores are **seeded** (see the scoring-engine note): **Rahul (`RH48213`)** shows all four
  states in one report — a **Needs review** (Round 2), a **Not a match** (driving licence), and
  an unreadable **PAN** ("Couldn't compare"). **Arjun (`RH47980`)** is a clean all-**Match**.
- Open the **Needs review** / **Not a match** rows to compare side by side and record a reason
  code — watch the banner move from red to neutral (never to green) as you resolve them.
- Full loop to demo: **Joining today** → open a candidate → upload a photo → run → resolve the
  flagged rows → **Confirm** or **Can't confirm** → go back; the candidate moves to **Done** with
  the decision badge, and also appears under **Checks you ran today**.

---

# Design decisions in progress — DISCUSSED, NOT YET BUILT

Everything above describes what is actually in the code. Everything **below** is design
discussion that has **not been built** — do not read it as current behaviour. Status per item:
**[agreed]** settled in discussion · **[rec]** my recommendation, awaiting sign-off · **[open]**
undecided.

## A. Overall verdict — vocabulary and logic

- **[BUILT 2026-08-27]** The banner tiers are now **Verified / Needs review / Not verified** —
  reads as the status of the *check*, not a judgment of the *person* (same reason we dropped
  "reject"). Note: a human-vouched result still shows **Verified** but in **neutral grey, not
  green** (green is reserved for a pure model match) — so model-matched vs human-vouched stays
  legible. "Couldn't run the check" (nothing comparable) is a separate neutral state.
- **[agreed]** The overall status is **computed by the system** from the resolved per-row states —
  the recruiter never types the verdict. Not a single **%** (vague, blends heterogeneous
  references and unreliable scores).
- **[rec]** Status turns on **confident contradiction, not the count.** A single *high-confidence*
  "not a match" holds the status at **Needs review** until a human resolves that row; a
  *low-confidence* dissenter (old/poor reference) folds into **Verified**. **No unanimity
  requirement** — multi-reference verification fuses evidence (NIST FRVT); requiring every
  reference to agree would false-reject legitimate hires, and error rates skew by demographic.
  (This is already how `reportSummary()` behaves; the change is mainly the tier names.)

## B. Legal / compliance posture (India + EU)

- **[agreed]** The tool **must never auto-reject** a candidate. It outputs *status + "reviewed by
  [name]"*; the hire/no-hire decision is a separate, human, downstream call.
- **[agreed]** The recruiter **must keep genuine override authority.** GDPR Art 22 + the CJEU
  *SCHUFA* ruling: a human who merely records/forwards the system's output is a rubber stamp, and
  the decision still counts as "solely automated" — unlawful for decisions with significant
  effect. So "the recruiter just submits" is only safe *because* they can override per row.
- **[agreed]** Stay **verification-only** (1:1 "is this the same person"), never database search
  / identification — this keeps the EU AI Act's **verification-purpose exemption** from the
  high-risk track (high-risk obligations took full effect Aug 2026).
- **[rec]** Add a **retention schedule** for the joining-day photo and keep purpose limited to
  this check (India DPDP Act 2023: biometric = sensitive personal data; consent + notice +
  purpose limitation + retention). Consent line already exists.
- **Not legal advice** — run the final decision flow past counsel before shipping anything that
  can affect employment. Key sources: GDPR Art 22 / SCHUFA; EU AI Act Annex III verification
  exemption; NIST FRVT demographic report (IR 8429); India DPDP Act 2023.

## C. AI quality gate + per-row review (report surface) — BUILT 2026-08-27 (five questions locked)

All five locked; seeded quality flags approved for the prototype.

- **Confidence gates the score** (`photoState`): a poor-quality photo (`quality:'poor'`) is
  **Needs review** whatever the number says; high confidence + high similarity → **Match**; high
  confidence + low similarity → **Not a match**; no usable face → **Couldn't compare**. A number
  you can't trust never reads as a match or a mismatch.
- The **AI reason is surfaced** (`aiReason`): shown under the row for Needs-review ("Not facing
  the camera", "Borderline similarity") and inside the expanded panel ("AI flagged this: …").
- **Headgear → facial-occlusion rule.** The AI must **never** classify "religious vs
  non-religious" headwear (technically unreliable, discrimination/DPDP risk). Flag only when the
  **face itself is occluded**. (Enforced at the seeding/spec level — reasons are occlusion-based,
  never garment-type.)
- **No-photo / no-face is NOT "Not a match"** — stays **Couldn't compare** (a data problem, not an
  accusation). "Not a match" means only: confidently a different person.
- **Recruiter actions replaced the four reason codes** from `261c9e9`: on **Needs review** →
  `Same person` / `Not a match` / `Ignore this photo (+reason)`; on **Not a match** →
  `Same person` / `Ignore this photo (+reason)`. "Can't tell" dropped. Mapping: Same person =
  positive vouch, Not a match = negative, **Ignore = excluded from the denominator** (like
  Couldn't-compare; noted in the banner sub as "N ignored"). Ignore reasons: not this candidate /
  too blurry-dark-lowres / face not visible / too old / document unreadable / duplicate.
- **Audit stores both layers** per row: AI tag + reason + score, and the recruiter's action +
  reason + note + who + when. The expanded panel shows a clean one-line record (dot + *"Same
  person, confirmed by review · time"* etc.) with the AI's finding still in the likely-cause callout
  above; the full both-layers record is retained in the row data.
- **Per-evidence quality is seeded** (`quality`/`qreason` per on-file photo, like the scores under
  `USE_LIVE_SCORING`) so the states/reasons are demonstrable.
- **Source-photo pre-flight (#4) is LIVE, via Gemini** (`USE_LIVE_QUALITY = true`, on by default).
  When the recruiter adds the joining-day photo, `geminiQuality()` (→ `api/quality.js` serverless,
  same key-safe proxy as compare) checks it and returns `{usable, reason, message}`. Quality /
  occlusion / face-presence are describable attributes Gemini genuinely does well — unlike the
  similarity *number*, which it fakes — so this one runs for real. The prompt judges **facial
  occlusion only, never headwear type/religion**. The result is a **soft** banner: "Photo looks
  good" / "…may be hard to compare — retake, or run anyway" / "Checking photo…" — it never blocks
  Run verification (a call failure falls back to usable, so it can't trap the recruiter). Flip
  `USE_LIVE_QUALITY` off to mock it (assumed-pass).
- **The consent + attestation checkboxes and Run verification appear only once the quality check
  has finished** (pass *or* fail) — while it's running, just the goo loader shows. On a fail they
  still appear (soft: run anyway); hiding them on fail would be a hard block, which we don't do.
- **Provenance attestation checkbox** (a second checkbox, distinct from the consent one) gates Run
  verification: *"I confirm this photo was taken today, on the joining day, of the person who
  reported to join — not a stored, downloaded, or supplied image."* Unlike the quality warning,
  this is a **hard gate** (Run stays disabled until both consent and attestation are ticked) — it's
  a deliberate statement of authenticity. Stored on the check record and shown in the report header
  ("Attested as a joining-day photo…") for audit.

## D. Landing worklist rebuild (driver: stale joining-date → unverified joiner) — BUILT 2026-08-27

Driver: a candidate's joining date changes, nobody updates the system, and on the real day the row
doesn't surface anywhere → the person joins **unverified**. The worklist must make an overdue,
unverified person impossible to lose. All items **[agreed]** unless marked otherwise.

- Kill the tabs → **one list**. Five row states (updated 2026-08-28 with the Submit model):
  **To verify** / **In review** (amber, check run but not submitted) / **Verified** (green) /
  **Needs review** (amber) / **Not verified** (red) — the last three come from the submitted
  report's system status. Pills are all
  **filled** — colour carries the meaning, no outlined/filled mix.
- Status is a **dropdown** (not chips), sitting inline with the date-range and sort dropdowns — a
  tidier, consistent control row. The per-status **counts are kept inside each option** ("Needs
  attention (8)", "To verify (21)"). This is a deliberate UX trade: chips showed every count at a
  glance, the dropdown hides them behind one click; the tidier look was chosen over the
  always-visible dashboard (2026-08-27, with the trade acknowledged).
- **No Mine-only toggle** — removed 2026-08-27. There's no ownership concept yet, so the list shows
  **all** candidates; a per-recruiter scope only becomes meaningful once row assignment exists.
- **Counts follow the active date range** — EXCEPT **Needs attention, which
  ignores the date filter entirely** (that is its safety property; it must never be filtered away).
  Because the attention count can then exceed what's visible in the range, the block header says so:
  *"Includes N outside your selected dates."*
- The main list **groups by date within the range** (a "Joining today" group, then a dimmed
  "Coming up") — so "Joining today" is a group header, not the whole list.
- Pinned **"Needs your attention"** block for overdue checks (joining date passed and check
  unfinished — both *no check run* and *run-but-undecided*): **never paginates, ignores the date
  filter, persists until verified or dismissed, always sorted oldest-first (NOT wired to the sort
  dropdown), hidden whenever a single status OR the Needs-attention chip is selected** (rows would
  otherwise show twice). Age line amber, **red past ~7 days**.
- **Dismissal is demoted** (a **vertical kebab `⋮`** on the row, not a full-weight button — the
  row's primary action is opening the check, with a chevron). The kebab menu has two items, each
  opening a **popup**: **Not joining** → a comment dialog (optional note) → dismisses the row;
  **Joining date changed** → the same date-picker dialog as the list kebab (new date + optional
  comment), which updates the joining date (moving them out of attention when the new date isn't
  overdue). An outside-click closes the menu. The bulk **Dismiss all** was **removed** (2026-08-27)
  — dismissal is per-row and attributed, never a one-tap way to empty the safety block.
- Main list flat; header + work summary phrased as remaining work ("6 to verify, 1 in review"),
  never "0 done". Rows show **just name + RHID · role** (the old submission/status sub-line was
  removed 2026-08-28 — the status pill on the right already carries it). **Future joiners** are
  inert (dimmed name, no status pill, no chevron, neutral "Joining Mon 18 Aug").
- Rows carry a **kebab `⋮`** with **"Change joining date"** (opens a date-picker dialog with a new
  date + optional comment; e.g. a candidate calls to reschedule) — shown on **To verify / Not
  verified / Coming-up** rows, where a date change is most likely. Distinct from the attention-block
  kebab (menu keys are `l`+id vs `a`+id so the same candidate in both places doesn't open both
  menus). Changing the date updates `joiningISO`/`joining` and re-sorts/re-buckets the row
  (in-session only).
- **Row alignment:** the status pill sits in a **fixed-width slot** (right-aligned) and the kebab
  in a reserved fixed slot (empty when a row has no kebab), so every pill and every kebab lines up
  in its own column regardless of pill width or kebab presence. **The row chevron was removed**
  (2026-08-28) and the status + kebab now sit at the right edge — the whole row is still clickable
  to open the check.
- **Pagination** (10 per page by default, 10/25/50 options, resets to page 1 on any filter/sort
  change) + **URL state** (filter/sort/page) so opening a check and hitting Back returns to the view.
- Keep the **candidate search** ("Find a candidate", onboarding/hired rounds scope note) — demoted
  but important: it's how you reach someone who isn't where the system says they are, which is the
  whole point of the redesign.
- Page renamed to **"Identity checks"** (plural — it's a list now).
- **Demo data:** seed ~30–40 candidates covering all four states, varied joining dates, ≥2 overdue
  at different ages (one ~3d amber, one ~11d red), one overdue-because-undecided, one future joiner,
  one with no photos on file, and enough **Confirmed** that filtering to it pages (pagination must
  be demonstrable inside a single status, not just on All). Labelled as demo data.
- **[open]** With Mine-only removed, the worklist (and the attention block) now shows **everyone's**
  candidates. Once row ownership exists, the real question returns: should a recruiter see only her
  own overdue rows, or the whole team's? (A shared view risks "someone else has it"; a scoped view
  risks the silent gap.) Parked until assignment is built.
- **[open, out of scope]** **Row ownership / assignment does not exist today** — it is the
  prerequisite for a shared team attention queue. Noted so it isn't lost; not in this change.
- **Demo limitation:** a small set — **7 seeded candidates + the 3 real ones = 10 total** (in
  `buildSeeds()`), covering every state, the attention block, and a "Coming up" future joiner
  (kept small on purpose, so it fits one page — pagination still works but won't trigger here).
  **Every candidate now has an on-file photo except Meera** (kept deliberately empty as the
  "no photos on file" case). Each of the 7 seeds has **one AI-generated application headshot**
  (distinct synthetic person, matched to the name), embedded via `_inject2.js` under keys `s1`–`s7`
  and given a seeded score so its report works if opened. Rahul (`c1`) and Arjun (`c2`) keep their
  fuller real sets (application + interview + documents). The **"Needs your attention" block holds
  exactly three** (per the demo): **Rahul** (12 days overdue "To verify", a real interactive
  candidate — top of the block and page 1), **Priya** (3 days), and **Imran** (2 days, "In review").
  Arjun and Vikram sit at "joining today" so they stay in the list but out of attention. Clicking
  Rahul runs the real check. Meera is a future joiner with no photos (the empty-
  state case; reach her via search or `?candidateId=RH48466`). URL routing (`?f`/`?d`/`?s`/`?p`,
  and `?candidateId` when a check is open) drives filter/sort/page and the Back button.

## E. Status

§A (banner rename), §D (worklist), and §C (quality gate + per-row review, incl. the live source
pre-flight and the attestation checkbox) are all **built**. Still pending a real model/engine, not
sign-off:
- the **real scoring engine** (Rekognition / Azure Face / ArcFace) behind `USE_LIVE_SCORING` — the
  similarity number is still seeded; Gemini can't measure it. (The quality pre-flight already runs
  live because that task suits Gemini.)
- **row ownership / assignment** (prerequisite for a per-recruiter or shared attention queue).
