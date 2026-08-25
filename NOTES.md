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

## Overall verdict logic

- The report shows a **Match / Review / No match** banner summarised only by the **count**:
  "Matched N of M photos". No single percentage — deliberately.
  - **Match** — every photo passed its bar.
  - **Review** — some passed, some didn't (e.g. one low reference photo).
  - **No match** — nothing passed.
- **Why no % in the summary:** the count *is* the aggregate. A single number was dropped on
  purpose — an average fights the "scores are never averaged" rule and mixes the 80% / 60%
  bars; "strongest match" was optimistic and arbitrary. The per-photo scores below carry the
  detail. (`overallVerdict()` still computes `best`, but nothing displays it.)
- **Source-aware match bars:** application/interview photos pass at **80%+**; identity
  documents pass at **60%+** (they're older/lower-resolution). Change these in the
  `photoBar()` function.

## Report table columns

- The scored rows are grouped (**Application & interview photos** / **Identity documents**).
  Each group header labels the columns — **Captured** and **Similarity** — rather than one
  header at the very top, so the labels stay attached to their group. Score cells are just the
  number ("92%"), no "% match" repeated per row.
- The column labels show on **desktop only**; on mobile the rows reflow (date drops under the
  name), so the labels hide — but the group titles still show.

## Recruiter Accept / Reject decision

- Below the report, the recruiter makes the final call — **Accept** or **Reject**. The
  machine only *advises* (the verdict); the human decides. The verdict subtly suggests an
  action but never auto-decides.
- **Deciding is not hard-mandatory** (no blocking modal). Instead it's enforced softly: an
  undecided check keeps the candidate in **To verify** (see the worklist), so unfinished work
  stays visible rather than being forced.
- The decided **record is neutral-styled** (white row, small coloured icon + label) on purpose
  — it sits directly under the coloured verdict banner, so a filled green/red bar there would
  clash or merge with the banner.
- A **reason is required when rejecting** (optional note on accept). Once decided, the bar
  collapses to a record: *"Accepted/Rejected by A. Sharma · &lt;when&gt; · &lt;note&gt;"* with a
  **Change** link (logged). The decision is separate from the verdict — you can accept a
  Review or reject a Match.
- **Layout is evidence → verdict → decision.** The verdict banner sits **just above the
  decision bar** (not at the top of the report): the recruiter reads the scored rows first,
  then the overall verdict, then makes the call — a natural build to the conclusion. (An
  earlier version had the banner at the top with a small recap chip in the decision bar; that
  was replaced by this single, better-placed banner.)
- The "by A. Sharma" name and timestamps are **hard-coded placeholders** — in production
  they'd come from the logged-in user and server clock.

## Landing screen — tabbed worklist

- Two tabs: **Joining today** (default) and **Checks you ran today**.
- **Joining today** is a worklist: candidates split into **To verify** and **Done** (sentence-
  case group headers). A candidate is only **Done once a recruiter has decided** (Accepted /
  Rejected). Running the check alone does **not** move them off the list. Row badge by state:
  **To verify** (never run) → **Decision pending** (run, but no Accept/Reject yet — stays in
  the To-verify group) → **Accepted / Rejected** (decided → Done).
- The whole row is clickable, no separate "Verify" button: a never-run row starts a fresh
  check; a row that's already been run reopens its report (to decide or review).
- **Checks you ran today** = "Your checks today" (your run history). (A "Shared with you"
  section was prototyped and removed — bring it back only with a real backend.)
- **Badge is consistent across both tabs** (`entryBadge`): a run-but-undecided check shows
  **Decision pending** in *both* the worklist and the checks list; a decided one shows
  **Accepted/Rejected** in both. The raw verdict (Match/Review/No match) lives in the report,
  not in the list badges.
- **Tab style** is the **segmented control** (the beige pill with a white active tab), kept on
  purpose — an underline-tab variant was tried and reverted. Don't "fix" it back to underline.
- Kept small for the demo; at real-company volume this is where you'd add filtering / paging.

## What is mocked / in-session only (needs a backend)

Nothing here persists to a server — it lives in the browser session and resets on reload:

- **Decisions** (Accept/Reject) and their audit trail — stored in-session on the check record.
- **Share report** — in-page only (no real recipients/notifications). Currently hidden behind
  `SHOW_REPORT_ACTIONS`. (The earlier "Shared with you" mock list was removed.)
- **Run history** ("Checks you ran today") — resets on reload.

## Copy / microcopy

- The UI copy went through a light "humanize" pass — plainer, more direct, active voice.
  Notable wording: the search intro ("Compare the person who showed up today…"), the empty /
  no-round notes say what to do ("Ask your RippleHire admin to add one"), the decision hint
  ("Suggested: Accept/Reject", "Mixed result — your call"), and the report footer.
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

## Face comparison

- The face match runs through the serverless function **`api/compare.js`**, which calls
  Google Gemini (`gemini-2.5-flash`). The API key is read from the **`GEMINI_API_KEY`**
  environment variable in Vercel — it is never committed to the repo or exposed in the browser.
- The uploaded joining-day photo is downscaled in the browser (≤1280px) before upload to stay
  under Vercel's request-size limit.

## Demo tips

- Deep links: `/?candidateId=RH48213` (Rahul), `/?candidateId=RH47980` (Arjun).
- To show the **Review** / **No match** states, upload a *different* person as the joining
  photo (or one candidate's photo against the other).
- Rahul's document cards use his real headshot, so a genuine Rahul joining photo matches them.
- Full loop to demo: **Joining today** → **Verify** a candidate → upload a photo → run →
  **Accept/Reject** → go back; the candidate moves to **Done** with the decision badge, and
  also appears under **Checks you ran today**.
