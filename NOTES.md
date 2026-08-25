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

- The report shows a **Match / Review / No match** banner: best-match + "matched N of M",
  never an average.
  - **Match** — every photo passed its bar.
  - **Review** — some passed, some didn't (e.g. one low reference photo).
  - **No match** — nothing passed.
- **Source-aware match bars:** application/interview photos pass at **80%+**; identity
  documents pass at **60%+** (they're older/lower-resolution). Change these in the
  `photoBar()` function.

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
  8 · strongest 96%"*) right above Accept/Reject — so the conclusion is in view at the moment
  of deciding, without scrolling back up. Not a bug; it's deliberate.
- The "by A. Sharma" name and timestamps are **hard-coded placeholders** — in production
  they'd come from the logged-in user and server clock.

## Landing screen — tabbed worklist

- Two tabs: **Joining today** (default) and **Checks you ran today**.
- **Joining today** is a worklist: candidates split into **To verify** (with a Verify action)
  and **Done**. Each row shows a status badge reflecting the furthest state reached —
  *To verify* → the *verdict* (Match/Review/No match) → the *decision* (Accepted/Rejected).
- **Checks you ran today** = "Your checks today" (your run history) + a **Shared with you**
  section.
- Kept small for the demo; at real-company volume this is where you'd add filtering / paging.

## What is mocked / in-session only (needs a backend)

Nothing here persists to a server — it lives in the browser session and resets on reload:

- **Decisions** (Accept/Reject) and their audit trail — stored in-session on the check record.
- **Share report** and the **"Shared with you"** list — the shared row (Vikram Singh, "from
  Priya Nair") is hard-coded illustrative data; clicking it just shows a toast. Real sharing
  needs users, notifications, and shared state.
- **Run history** ("Checks you ran today") — resets on reload.

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
