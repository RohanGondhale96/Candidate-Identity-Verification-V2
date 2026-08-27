# Notes for the team

Context and intentional decisions behind the Verify Identity prototype, so nothing here
looks like an accident.

> See `DECISIONS.md` for the chronological log — the research and discussions that led to each
> change. This file is the current state; that one is the story.

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
  Couldn't compare**. The raw % is kept, but only in the **expanded row** (small, grey), for
  support, tuning, and disputes. It is never the headline.
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

## Per-photo review — structured reason codes

- Open a **Needs review** or **Not a match** row to see the two photos side by side, the raw
  similarity %, "Interviewed by …", and **four reason codes** (radio-style, pick one):
  *Same person · poor photo quality* / *Same person · appearance changed* / *Different person* /
  *Can't tell*. See `reasonCodes()` / `resolveRow()`.
- **Structured codes, not a free-text note** — on purpose. Free text is unsearchable, useless in
  a dispute, and recruiters type "ok" in it. Codes give a dataset on *why* the model was
  uncertain, which is how thresholds get tuned in v2. Collected structurally from day one.
- Codes are **non-binding on the verdict** (the human still owns the overall call) but they
  **change the row badge** to a single combined state: *Reviewed · same person* (green) or
  *Reviewed · different person* (red). One badge carries both the model finding and the human
  answer — never two competing badges.
- **Escalation:** each interviewer row has an **"Ask &lt;name&gt; to confirm"** button. After a
  retake still fails, the person who sat with the candidate for 45 minutes is better evidence
  than any score, and the tool already knows who that is. (Mocked — toast only, no real message.)

## Recruiter decision — Confirm / Can't confirm

- The two actions are **Confirm identity** and **Can't confirm identity**. Deliberately **not
  Accept/Reject**: this screen verifies identity, it does not make an employment decision, and
  "reject" reads as rejecting the person. "Can't confirm" describes the recruiter's actual
  authority and carries **no fraud allegation** — fraud is a conclusion reached after an
  investigation, downstream of this screen. Never label anything "potential fraud / mismatch"
  against a named person; legal would strike it, and it lives in the record permanently.
- **"Can't confirm" = flag for review.** In production it routes to a configured escalation
  owner (hiring manager + HR/TA ops, per-org) with a link to the frozen report, and gives the
  recruiter a non-accusatory script for the person in the room; onboarding continues in parallel,
  the flag does **not** hard-block day one. A flag is a **review trigger, not an adverse
  decision**. (Destination is mocked here.)
- **No gating.** Both buttons are always enabled — the human can always decide, including
  deciding the tool is wrong. Blocking would trap a recruiter who genuinely can't tell with a
  person sitting in front of her. Instead: confirming while rows are still unreviewed **requires
  a note**, and the record permanently reads *"Confirmed with N rows unreviewed"* (audit fact,
  nobody skips twice). A note is also required to flag.
- **Layout is evidence → verdict → decision** (scored rows, then the banner, then the decision).
- The "by A. Sharma" name and timestamps are **hard-coded placeholders** — in production they'd
  come from the logged-in user and server clock.

## Landing screen — tabbed worklist

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
- **"Ask &lt;interviewer&gt; to confirm"** — toast only, no real message sent.
- **"Can't confirm" flag destination** — no real escalation owner is notified yet.
- **Share report** — in-page only (no real recipients/notifications). Currently hidden behind
  `SHOW_REPORT_ACTIONS`. (The earlier "Shared with you" mock list was removed.)
- **Run history** ("Checks you ran today") — resets on reload.

## Copy / microcopy

- The UI copy went through a light "humanize" pass — plainer, more direct, active voice.
  Notable wording: the search intro ("Compare the person who showed up today…"), the empty /
  no-round notes say what to do ("Ask your RippleHire admin to add one"), the decision hint
  ("Suggested: Confirm / Can't confirm", "Your call"), and the report footer.
- The **consent line** was left precise on purpose ("I have the candidate's consent to take
  and submit this photo for identity verification") — consent copy favours clarity over brevity.
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

## C. AI quality gate + per-row review (report surface)

- **[rec]** Row state = **(confidence × similarity)**, confidence gates: low confidence (quality
  problem) → **Needs review** regardless of score; high confidence + high similarity → **Match**;
  high confidence + low similarity → **Not a match**; no usable face → **Couldn't compare**.
- **[agreed]** Surface the **AI reason** with a Needs-review tag: blurry / not facing camera /
  looking away / possible group photo / face occluded — so the recruiter knows what to check.
- **[agreed]** **Headgear → facial-occlusion rule.** The AI must **never** classify "religious vs
  non-religious" headwear (technically unreliable, discrimination/DPDP risk). Flag only when the
  **face itself is occluded**, whatever is covering it. A turban/hijab/kippah that leaves the face
  clear is not flagged.
- **[agreed]** **No-photo / no-face is NOT "Not a match"** — it stays **Couldn't compare** (a data
  problem, not an accusation). "Not a match" means only: confidently a different person.
- **[rec]** Quality check runs in **two places**: the **source (joining) photo** gets a
  **pre-flight** check at upload (soft warn → retake / run anyway, never a hard block); each
  **evidence photo** is checked per-row after the run.
- **[rec]** Recruiter actions **replace the four reason codes** built in `261c9e9`:
  on **Needs review** → `Same person` / `Not a match` / `Ignore this photo (+reason)`;
  on **Not a match** → `Same person` / `Ignore this photo (+reason)`. "Can't tell" dropped
  (dead-end). Mapping: Same person = positive vouch, Not a match = negative, Ignore = excluded
  from the denominator. Ignore reasons: not this candidate / too blurry-dark-lowres / face not
  visible / too old / document unreadable / duplicate.
- **[agreed]** **Audit stores both layers** on every row, permanently: the **AI** tag + reason(s)
  + raw scores (similarity, confidence), AND the **recruiter** action + reason + who + when. The
  record reads e.g. *"AI: Needs review (not facing camera) → A. Sharma marked Same person · 10:14."*

## D. Landing worklist rebuild (driver: stale joining-date → unverified joiner) — BUILT 2026-08-27

Driver: a candidate's joining date changes, nobody updates the system, and on the real day the row
doesn't surface anywhere → the person joins **unverified**. The worklist must make an overdue,
unverified person impossible to lose. All items **[agreed]** unless marked otherwise.

- Kill the tabs → **one list**. Four row states: **To verify** / **Awaiting decision** (amber) /
  **Confirmed** / **Can't confirm**. (Splits the old overloaded "Decision pending".) Pills are all
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
- **Dismissal is demoted** (a `⋯` menu, not a full-weight button — the row's primary action is
  opening the check, with a chevron). Per-row dismissal **requires a reason** (Not joining / Date
  changed / Verified elsewhere) and **records who + when**. The bulk **Dismiss all** was
  **removed** (2026-08-27) — dismissal is per-row only, so every removal stays an individual,
  attributed decision rather than a one-tap way to empty the safety block.
- Main list flat; header + work summary phrased as remaining work ("12 to verify, 4 awaiting
  decision"), never "0 done"; reason line under each name ("1 photo needs review", "Confirmed by
  A. Sharma · 09:41", "Escalated to R. Menon · 10:12"); **future joiners inert** (no pill, no
  chevron, neutral "Joining Mon 18 Aug"); **pagination** (10 per page by default, 10/25/50 options,
  resets to page 1 on any filter/sort change) + **URL state** (filter/sort/page) so opening a check and hitting Back
  returns to the same view.
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
- **Demo limitation:** ~60 candidates are **seeded** (in `buildSeeds()`) so counts, overdue ages,
  and pagination are real. Seeds have **no on-file photos** — clicking one opens the check page
  (empty upload). Only the three interactive candidates (Rahul `c1`, Arjun `c2`, Meera `c3`) have
  real photos and a full check flow. Overdue is computed against a fixed demo "today" (15 Aug 2026,
  `WL_TODAY_MS`). URL routing (`?f`/`?d`/`?s`/`?mine`/`?p`, and `?candidateId` when a check is
  open) drives filter/sort/page and the Back button.

## E. Still awaiting sign-off before it is built

Only the **quality-gate + per-row review model (§C)** remains unconfirmed. The worklist (§D) and
the verdict-vocabulary rename (§A) are built.
