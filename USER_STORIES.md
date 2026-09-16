# Joining-Day Identity Verification — User Stories

> A breakdown of the project into one epic and its child stories, grouped by feature.
> Each story uses **As a / I want / so that** with acceptance criteria. **Status** reflects the
> current prototype (Done = built in the prototype, In progress, To do).

---

## Epic

**EPIC — Joining-Day Identity Verification**

**As a** recruiter / recruiting operations team
**I want** to confirm that the person who reports on their joining day is the same person who was interviewed and hired
**so that** we catch impersonation and proxy-joining before onboarding, with a recorded, auditable verdict.

**Summary:** On a candidate's joining day, the recruiter uploads a joining-day photo. The system checks its
quality, then compares it against the candidate's on-file photos (application, interview rounds, identity
documents) using face recognition. The recruiter reviews each comparison, can override the system's call,
and submits a final verdict (Match / Not a match). The result is visible on the candidate's profile and in a
completed report.

**Feature groups (candidate sub-epics):**
1. Verification worklist
2. Running the identity check
3. Reviewing comparisons and recording a verdict
4. Completed report
5. Collaboration and sharing
6. Product integration and entry points
7. Admin configuration
8. Cross-cutting (statuses, mobile, accessibility)

---

## 1. Verification worklist

**IV-1 · See candidates that need an identity check — Status: Done**
- **As a** recruiter **I want** a list of candidates grouped by status (Pending, In progress, Completed) **so that** I know what needs my attention.
- Acceptance:
  - Three status cards with live counts: Pending, In progress, Completed.
  - Clicking a card filters the list to that status.
  - Each row shows photo, name, RHID, role, and a status pill.

**IV-2 · Filter open work by timing — Status: Done**
- **As a** recruiter **I want** to filter the open list by All / Today / Upcoming / Delayed **so that** I can focus on who is joining today or who is overdue.
- Acceptance:
  - Segment group with counts, scoped to the selected status.
  - "Today" = joining today; "Upcoming" = future joiners; "Delayed" = joining date passed and not yet done.
  - Timing filter shows only for Pending / In progress.

**IV-3 · Filter completed work by outcome — Status: Done**
- **As a** recruiter **I want** to filter Completed by Match / Not a match **so that** I can find flagged results quickly.
- Acceptance:
  - When Completed is selected, the segment group switches to All / Match / Not a match with counts.

**IV-4 · See delayed candidates clearly — Status: Done**
- **As a** recruiter **I want** overdue candidates flagged as "Delayed" **so that** I don't miss checks whose joining date has passed.
- Acceptance:
  - A "Delayed" pill on the row (in addition to the status pill) when overdue.
  - A "Delayed" segment isolates overdue candidates within a status.

**IV-5 · Search for any hired candidate — Status: Done**
- **As a** recruiter **I want** to search by name, RHID, or email **so that** I can open anyone who's been hired, even if they're not on today's list.
- Acceptance:
  - Search box with a results dropdown (min 2 characters).
  - Search is global (not limited to the current filter); opening a result clears the active filter.

**IV-6 · Rename a status label — Status: Done (naming: "Pending")**
- **As a** product team **I want** the first status labelled clearly **so that** the queue reads as a state alongside In progress / Completed.
- Note: "To verify" was renamed to **Pending**; the final name is open to revisit.

**IV-32 · Export the filtered candidate list to Excel — Status: To do**
- **As a** recruiter **I want** to download the current worklist as an Excel sheet **so that** I can share it, report on it, or work offline.
- Acceptance:
  - An "Export to Excel" (download) button on the worklist.
  - The export respects the **active filters** — status card (Pending / In progress / Completed), the segment filter (Today / Upcoming / Delayed, or Match / Not a match), and the search term — i.e. exactly the rows currently shown.
  - Columns include at least: name, RHID, role, joining date, status, delayed flag, and (for completed) the outcome. Final columns to be confirmed.
  - The download is an .xlsx file.

---

## 2. Running the identity check

**IV-7 · Upload a joining-day photo — Status: Done**
- **As a** recruiter **I want** to upload (or capture) the joining-day photo **so that** it can be compared to on-file photos.
- Acceptance:
  - Upload from device; take-photo option on mobile.
  - The uploaded photo previews before running.

**IV-8 · Give consent and attestation before running — Status: Done**
- **As a** recruiter **I want** to confirm consent and attest the photo is of the person who reported to join **so that** we have a lawful, accountable basis for the check.
- Acceptance:
  - Two required checkboxes (consent to use the photo; attestation it was taken on the joining day of the person who reported).
  - No image processing happens before consent is given; **Submit** is disabled until both are ticked.

**IV-9 · Quality pre-check the photo — Status: Done**
- **As a** recruiter **I want** the photo checked for quality before comparison **so that** blurry / no-face / multi-face photos don't produce misleading results.
- Acceptance:
  - On submit, a quality check runs first (sharpness, brightness, facing, single clear face).
  - On pass, comparison runs automatically; on fail, a blocking message asks for a new photo (hard gate).

**IV-10 · Compare against on-file photos — Status: Done**
- **As a** recruiter **I want** the joining-day photo compared against all on-file photos **so that** each comparison gets a face-match score and verdict.
- Acceptance:
  - Compares against application, interview-round, and identity-document photos.
  - Each comparison returns a score and an AI verdict (Match / Needs review / Not a match / Couldn't compare).

**IV-11 · See progress while the check runs — Status: Done**
- **As a** recruiter **I want** to see what's happening during the check **so that** the wait feels credible.
- Acceptance:
  - Two-step progress: "Checking photo quality" then "Comparing against photos on file".
  - Steps reflect the real quality and comparison calls; a quality failure stops at step 1.

**IV-12 · Retake with a different photo — Status: Done**
- **As a** recruiter **I want** to use a different photo if needed **so that** I can correct a bad upload.
- Acceptance:
  - "Use a different photo" deletes the current joining-day photo and result and reopens the upload.

---

## 3. Reviewing comparisons and recording a verdict

**IV-13 · Understand why a comparison is or isn't a match — Status: Done**
- **As a** recruiter **I want** a plain-language reason for each comparison **so that** I can make an informed call.
- Acceptance:
  - Matched rows show "Why this is a match"; flagged rows show "Why this needs a look / may not match"; couldn't-compare rows explain why.

**IV-14 · Review flagged comparisons — Status: Done**
- **As a** recruiter **I want** to resolve every flagged comparison (Needs review / Not a match) **so that** the report reflects my judgement.
- Acceptance:
  - Flagged rows offer Match / Not a match / Can't confirm.
  - Submit is hard-gated: it stays "Review flagged (N)" until every flagged comparison has a verdict.

**IV-15 · Override the AI verdict on any comparison — Status: Done (A1)**
- **As a** recruiter **I want** to change the verdict even on a comparison the AI called a match **so that** my judgement is final.
- Acceptance:
  - Every row has a "Change" control; on a matched row it reveals Match / Not a match.
  - The recorded verdict and the AI verdict are both kept for audit.

**IV-16 · "Can't confirm" only where it's justified — Status: Done (A2)**
- **As a** product owner **I want** "Can't confirm" available only on flagged rows **so that** recruiters can't dodge the match / not-a-match call on a confident match.
- Acceptance:
  - Confident-match rows offer only Match / Not a match (no Can't confirm).

**IV-17 · Give a reason for "Can't confirm" — Status: Done (A3)**
- **As a** recruiter **I want** to pick a reason when I set a comparison aside **so that** the report explains why.
- Acceptance:
  - Reason list narrowed to three: "The source photo is blurry", "Appearance changed (age)", "The document photo isn't clear".

**IV-18 · Verdict calculation rules — Status: Done (A4)**
- **As a** product owner **I want** a clear rule for the final verdict **so that** the outcome is consistent.
- Acceptance:
  - Any single **Not a match** → the candidate is **Not a match**.
  - A **Can't confirm** comparison is **excluded**; the verdict is computed from the remaining comparisons.
  - A **Match** counts toward the verdict.
  - Edge case (parked): all comparisons "Can't confirm" — treated as very rare, to be handled later.

**IV-19 · Confirm before submitting — Status: Done (A5)**
- **As a** recruiter **I want** a final confirmation showing every comparison **so that** I don't submit without reviewing.
- Acceptance:
  - Submit dialog shows a table of each comparison with **AI verdict vs my review**.
  - A "reviewed all comparisons" checkbox is required; an optional note is allowed; then Submit records the verdict.

---

## 4. Completed report

**IV-20 · Open a completed check as a read-only report — Status: Done (routing)**
- **As a** recruiter **I want** clicking a completed candidate to open the final report (not the upload flow) **so that** I can see the outcome.
- Acceptance:
  - A completed candidate opens directly to the submitted, read-only report.

**IV-21 · Redesigned completed report — Status: To do (C2)**
- **As a** recruiter / stakeholder **I want** a clear, summary-first completed report **so that** I can see the verdict and evidence at a glance.
- Acceptance (proposed, to refine):
  - Verdict banner (Verified · Match / Not verified · Not a match) with who submitted and when.
  - The decisive joining-day-vs-on-file photo comparison.
  - A per-comparison summary (AI verdict vs recruiter review).
  - A review trail (who reviewed, set-aside reasons, consent/attestation).
  - Read-only actions (download / share / reopen).

**IV-33 · Download the completed report — Status: To do**
- **As a** recruiter / stakeholder **I want** to download the final completed report **so that** I can save it, attach it to the candidate file, or share it offline.
- Acceptance:
  - A "Download report" button on the completed (read-only) report.
  - The file captures the report: verdict (Match / Not a match), candidate identity, who submitted and when, the per-comparison summary (AI verdict vs recruiter review), and the review trail.
  - Format is a PDF (or the org's standard report format — to confirm).
  - Only available once the check is submitted (a report only exists after submit).

---

## 5. Collaboration and sharing

**IV-22 · Share a report with a colleague — Status: Done (basic)**
- **As a** recruiter **I want** to share the report with people who have access **so that** they can review the outcome.
- Acceptance:
  - Pick recipients; they get a link; the email contains no photos or scores.

**IV-23 · Identity-check activity in the collaboration tab — Status: To do (C3)**
- **As a** hiring team member **I want** identity-check activity to appear in the candidate's collaboration tab **so that** the team stays informed.
- Decision (Q5 resolved): **system-generated events** (not free-form comments), in the same format as the existing feed (logged via `addCollaborationMsg`, a new `IDENTITY_CHECK_COMMENT` comment type). Events are logged **only after submit** (no in-progress noise; a report link only points to something that exists).
- Events:
  - **Identity check submitted: Match / Not a match** — reviewed by, count of comparisons, any set aside, consent/attestation, optional note, link to the report. (Not a match may get a visual highlight — to confirm.)
  - **Identity report reopened** — the verdict was reopened; a fresh "submitted" entry logs the new verdict on resubmit.
  - **Identity report shared** — shared with {names}; the email contains no photos or scores.
- Caveat: `getCollaborationDetails` only returns certain comment types by default, so the new type must be logged as a returned type or added to the default set.

---

## 6. Product integration and entry points

**IV-24 · Identity result on the candidate profile — Status: To do (C4)**
- **As a** hiring team member **I want** the identity result shown on the candidate's page **so that** I see it in context.
- Acceptance (proposed):
  - A bar above the candidate name showing the result; **red** when Not a match.

**IV-25 · Launch the check from the top navigation — Status: To do (D1)**
- **As a** recruiter **I want** an "Identity match" entry under the More menu **so that** I can open the verification workspace.
- Acceptance:
  - "More → Identity match" opens the verification page in a new tab.

**IV-26 · Launch the check from a hiring round — Status: To do (D2)**
- **As a** recruiter **I want** a button on the candidate page in the enabled round (e.g. Hired) **so that** I can start the check in context.
- Acceptance:
  - The button appears only in the enabled round and opens the verification page in a new tab.

---

## 7. Admin configuration

**IV-27 · Configure the feature — Status: To do (C5, needs decision)**
- **As an** admin **I want** to configure the identity-verification feature **so that** it runs the way our org needs.
- Open decision (Q6): scope — enable per round only, or also thresholds, who can run checks, consent copy, and the reason list.

---

## 8. Cross-cutting

**IV-28 · Status model and badges — Status: Done**
- **As a** recruiter **I want** consistent statuses **so that** the list is easy to read.
- Acceptance:
  - Statuses: Pending → In progress → Completed.
  - Modifiers/outcomes as separate badges: Delayed (on Pending / In progress); Match / Not a match (on Completed).
  - "Inconclusive" is not a final state (a Can't confirm is excluded and the verdict falls to the rest).

**IV-29 · Future joiners can be viewed but not run early — Status: Done**
- **As a** recruiter **I want** to open an upcoming joiner's profile but not run the check before their joining day **so that** I can prepare without acting prematurely.
- Acceptance:
  - Upcoming candidates open their profile and on-file photos; the upload is replaced by a "joining day hasn't arrived yet" notice.

**IV-30 · Works on mobile — Status: Done (list + review), ongoing**
- **As a** recruiter **I want** the screens to work on a phone **so that** I can run checks on the go.
- Acceptance:
  - Every design change must work at mobile width (list reflows; review actions and the submit table are usable).

**IV-31 · Accessible and audit-friendly — Status: Partial / ongoing**
- **As a** compliance stakeholder **I want** actions attributed and keyboard-operable **so that** the tool is auditable and accessible.
- Acceptance:
  - Verdicts record who and when; rows are keyboard-operable; focus states are visible.

---

## Open questions (for the PM to resolve)

- **Q2** — What happens if every comparison is "Can't confirm"? (Parked — very rare.)
- **Q5** — Collaboration messages: system events, free-form, or both? **Resolved:** system events only, logged after submit (see IV-23).
- **Q6** — Admin scope: per-round enable only, or thresholds / consent / reasons too? (Blocks IV-27.)
- Minor: an overall cross-status "Delayed" total (not currently surfaced); how zero-count segments should look.

---

## Suggested delivery order

1. Completed report redesign (IV-21) — the last core screen.
2. Candidate verdict bar (IV-24) and entry points (IV-25, IV-26) — integration, buildable as static mocks.
3. Collaboration (IV-23) and Admin (IV-27) — once Q5 and Q6 are decided.
