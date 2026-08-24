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
