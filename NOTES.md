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
- A **reason is required when rejecting** (optional note on accept). Once decided, the bar
  collapses to a record: *"Accepted/Rejected by A. Sharma · &lt;when&gt; · &lt;note&gt;"* with a
  **Change** link (logged). The decision is separate from the verdict — you can accept a
  Review or reject a Match.
- The verdict appears in **two places on purpose**: the big banner at the top of the report
  (headline first), and a **compact recap chip** inside the decision bar (e.g. *"Match · 8 of
  8"*) right above Accept/Reject — so the conclusion is in view at the moment of deciding,
  without scrolling back up. Not a bug; it's deliberate.
- The "by A. Sharma" name and timestamps are **hard-coded placeholders** — in production
  they'd come from the logged-in user and server clock.

## Landing screen — tabbed worklist

- Two tabs: **Joining today** (default) and **Checks you ran today**.
- **Joining today** is a worklist: candidates split into **To verify** and **Done** (sentence-
  case group headers). Each row shows a status badge reflecting the furthest state reached —
  *To verify* → the *verdict* (Match/Review/No match) → the *decision* (Accepted/Rejected).
  The whole row is clickable (To-verify → starts the check, Done → opens the report); there's
  no separate "Verify" button — it was redundant with the clickable row.
- **Checks you ran today** = "Your checks today" (your run history) + a **Shared with you**
  section.
- **Tab style** is the **segmented control** (the beige pill with a white active tab), kept on
  purpose — an underline-tab variant was tried and reverted. Don't "fix" it back to underline.
- Kept small for the demo; at real-company volume this is where you'd add filtering / paging.

## What is mocked / in-session only (needs a backend)

Nothing here persists to a server — it lives in the browser session and resets on reload:

- **Decisions** (Accept/Reject) and their audit trail — stored in-session on the check record.
- **Share report** and the **"Shared with you"** list — the shared row (Vikram Singh, "from
  Priya Nair") is hard-coded illustrative data; clicking it just shows a toast. Real sharing
  needs users, notifications, and shared state.
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
