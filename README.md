# Candidate Identity Verification (V2)

Joining-day face verification. A recruiter uploads a photo of the person who
turned up to join, and it is compared against every photo captured during the candidate's
application and interviews. Each photo is scored independently by **Google Gemini**
(`gemini-2.5-flash`); scores are never averaged.

This is a standalone demo page:

- **`index.html`** — the whole UI (self-contained, candidate photos embedded). Calls
  `/api/compare` for each comparison.
- **`api/compare.js`** — a Vercel serverless function that calls Gemini. The API key is read
  from the **`GEMINI_API_KEY`** environment variable, so it is **never** committed to the repo
  or exposed in the browser.

## Deploy on Vercel

1. Import this repo into Vercel (**Add New… → Project →** pick this repo → **Deploy**).
2. In **Project → Settings → Environment Variables**, add:
   - `GEMINI_API_KEY` = *your Google Gemini API key*
   - Apply to **Production**, **Preview**, and **Development**.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the function picks up the variable.
4. Open the deployment URL.

## Using it

- Search a candidate, or deep-link directly:
  - Rahul Deshmukh — `/?candidateId=RH48213`
  - Arjun Reddy — `/?candidateId=RH47980`
- Upload a joining-day photo, tick the consent box, and click **Run verification**.
- All on-file photos are compared in **parallel**. Similarity bands: **> 80 % green**,
  **50–80 % amber**, **< 50 % red**.
- To demo a genuine non-match, open one candidate and upload the *other* person's photo.

## Local development

```bash
npm i -g vercel
vercel dev            # runs index.html AND /api/compare locally
```

Create a local `.env` with `GEMINI_API_KEY=…` first. A plain static file server will serve
the page but cannot run `/api/compare`.

## Notes

- Model: `gemini-2.5-flash`, `temperature: 0`, thinking disabled, strict-JSON output.
- Keep uploaded photos under ~3 MB — Vercel's serverless request body limit is 4.5 MB and each
  request carries two images.
- The verdict (`same_person` + similarity band) is the signal to trust; the exact percentage is
  the model's own estimate.
