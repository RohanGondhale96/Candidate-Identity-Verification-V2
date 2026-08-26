# Notes for the team

Context and intentional decisions behind the Verify Identity prototype, so nothing here
looks like an accident.

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
