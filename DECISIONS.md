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

## 2026-09-05 · Worklist: pagination → infinite scroll — BUILT + DEPLOYED

- **Discussion (Rohan):** drop the pagination on the main worklist; load rows lazily as you scroll.
- **Change:** removed the Prev/Next/page-number bar and the "N / page" selector (and the now-dead
  `wlSetPage`/`wlSetPer`). The list renders `full.slice(0, state.wlShown)` with `WL_PAGE = 20`; a
  `#wl-more` sentinel triggers `wlLoadMore()` (append another `WL_PAGE`) via an `IntersectionObserver`
  re-attached each render (`wlObserveMore()`, called at the end of `render()`), plus a `window` scroll
  listener as a fallback. `wlShown` resets to `WL_PAGE` on any tab/status/date/sort change.
- **Verified:** pagination controls gone; `wlLoadMore` appends and clears the sentinel; observer is
  created and observing. The auto-fire couldn't be exercised in the preview pane because it reports
  `innerHeight: 0` (nothing can "intersect" a zero-height viewport) — an environment limitation, not a
  code issue; the scroll-listener fallback covers such webviews and real browsers fire the IO normally.
  With the ~10-candidate demo set, the first batch holds everything so no sentinel appears. Harness green.

## 2026-09-05 · Consent-first upload flow + quality as a hard gate — BUILT + DEPLOYED

- **Discussion (manager, via Rohan):** the old flow ran the photo quality check the instant a photo was
  selected — i.e. it processed the image *before* the recruiter confirmed consent — and the quality
  result was only a soft warning you could run past. Manager wanted consent taken **first**, then the
  quality check, and quality to actually gate: pass → proceed automatically, fail → make them re-upload.
- **Wireframed with Rohan before building** (several `show_widget` rounds). Layout settled: photo left
  (stretched); right column = file name (top), the two consent checkboxes (centred against the photo),
  and **Change photo / Submit** side by side pinned to the bottom + the helper line. The file name has
  no icon; the old top-right "Use a different photo" button is removed (its job is the bottom Change
  photo). Rohan confirmed all four behaviour points before the go.
- **New flow:** pick photo (no processing) → tick both consent boxes → **Submit** (`submitPhoto()`,
  disabled until both ticked) runs the **quality check** → **pass = comparison runs automatically**;
  **fail = red blocking error** ("This photo isn't clear enough to run the check. <reason> Please upload
  a different photo.") with Submit disabled until a different photo is chosen. Quality-service error =
  treated as pass (don't trap the recruiter). `handleFile` no longer calls the quality check and now
  stores the file name; `checkQuality()` was replaced by `submitPhoto()` (chains quality → `run()`).
- **Net changes vs before:** quality moved from on-select to on-Submit; quality went soft → **hard
  gate**; consent now strictly precedes any image processing; button labels "Use a different photo" /
  "Run verification" → **Change photo** / **Submit**. Verified all states in-browser (chosen / Submit
  enable-on-consent / checking / pass-auto-run / fail-blocked). Harness green.

## 2026-09-04 · Merge "Coming up" into the To-verify list — BUILT + DEPLOYED

- **Discussion (manager, via Rohan):** the separate "COMING UP" section in the To-verify tab (calendar
  glyph, dimmed rows, "Joining Sun 16 Aug" on the right, not clickable) broke the consistency of the
  list. Treat upcoming candidates the same as everyone else: photo thumbnail, an "upcoming" cue next
  to the name, and keep them on the **To verify** status (don't invent a new status — they stay in the
  To verify tab).
- **Decisions (asked Rohan before building):** (1) joining date → **moved into the grey sub-line**
  ("RHID · Job · Joining 16 Aug"), with the normal **To verify** pill on the right; (2) ordering →
  **at the bottom** (overdue top, then today's/past, then upcoming last under the default sort).
- **Change:** dropped the "Coming up" header and the dimmed non-clickable future-row branch; upcoming
  rows now use the **same clickable row template** as every other candidate — `candAvatar` thumbnail
  (photo, initials fallback), name with a small blue **"Upcoming"** tag (`#EAF2FE`/`#185FA5`), joining
  date in the sub-line, `wlPill('toverify')`. Sorting already put `isFuture` last under the default
  "Oldest first"; on explicit Newest/Name sorts they intermix but the tag keeps them identifiable.
- **Judgment call flagged to Rohan:** made upcoming rows **clickable** (they were not before), to honor
  "treat them the same as the rest" — even though it lets a recruiter open a not-yet-joined candidate.
  Easy to gate back to non-clickable if that's not wanted. Verified in-browser (tag colour, thumbnails,
  sub-line, clickable, bottom placement, no header). Harness green.
- **Follow-up (same day) — what the click opens for a future joiner:** Rohan resolved the clickability
  question in favour of opening the profile *with a guard rail*. A future candidate's detail view shows
  the header (email / phone / joining date) and the on-file application/interview/document photos, but
  the **joining-day upload + Run is replaced by a blue "Joining day hasn't arrived yet" notice** (gated
  on `isFuture(c)`) — so no upload or comparison is possible before they join. The idle on-file list
  header drops "Comparing against" (→ "N photos on file") for future joiners. Verified in-browser for a
  future candidate (notice shown, no upload card, no Run button, on-file photos still listed) and a
  non-future candidate (upload card intact). Harness green.
- **Clarified with Rohan — no-photos rows stay clickable:** the earlier offer to gate future rows back
  to non-clickable was rejected. Rohan's point: it would feel broken not to be able to open an upcoming
  candidate, and we should instead **show a clear "no photos available" message** on the profile.
  Reworded the empty state so it plainly reads "No photos on file for this profile" and is state-aware
  — for a future joiner it names the joining date and explains a check can run once photos are on file
  and they've joined. Verified for Meera (future, 0 photos): row clickable, profile opens, clear note
  shown. Harness green.

## 2026-09-04 · Copy pass — plainer, less "AI-written" reason prose — BUILT + DEPLOYED

- **Discussion (Rohan):** run the product copy through a humanize pass so it doesn't read as
  AI-generated.
- **Finding:** most of the product copy was already plain and human (no "delve/leverage/robust/
  seamless" vocabulary, no importance puffery, no chatbot artifacts). The real tells were in the
  **reason/explanation prose** — clinical phrasing ("facial geometry", "facial landmarks", "clear the
  match threshold for this source"), a four-item feature list, and formulaic em dashes.
- **Change:** rewrote `matchReason()` and `cantReason()` into plain, committed sentences that match
  the voice of the existing flagged-row causes (lowercase continuations after the "Why…" label; e.g.
  "the eyes, nose and jaw all line up with today's photo, with nothing that looks off"). Also plainer
  three seeded flagged-row `cause` strings: dropped "which lowers confidence in the match" and the
  vague "across several features" for direct wording ("clearly different from today's photo"; "they
  look like different people"). No AI-vocabulary or puffery elsewhere needed changing — deliberately
  did **not** churn copy that was already fine. Harness green.

## 2026-09-04 · Show a reason on Match and Couldn't-compare rows — BUILT + DEPLOYED

- **Discussion (manager, via Rohan):** the report only explained the *flagged* rows ("Why this needs
  a look"). Two gaps: a **Match** row gave no reason *why* it matched, and a **Couldn't-compare** row
  buried its reason as tiny grey text appended to the date. Both should tell the recruiter why.
- **Decision / Change:** added a shared tinted-callout helper `reasonNote(tone,label,text)` and two
  reason sources — `matchReason(r)` (positive, seeded by score band for the demo) and `cantReason(r)`
  (from `r.err`, expanded into plain language). In `reportCard`: a **Match** row expanded now ends
  with a **green "Why this is a match:"** note under the two photos; a **Couldn't-compare** row shows
  an **always-visible neutral "Why we couldn't compare:"** note (the row isn't expandable — there's
  nothing to compare — so the reason is shown directly), and its date sub-line was cleaned up (the
  reason moved out of it). Live wording will come from the model, same as the flagged-row `causeText`.
- **Same-day back-and-forth on where the match reason sits (settled = inside/on-expand):** it shipped
  on-expand-only → then "show without expanding" → then Rohan settled on **keeping it inside the
  expanded card, as it was originally**. Final state: the **match** reason shows only when the row is
  expanded (matches are common/many, so the collapsed feed stays short and the "Match" badge speaks at
  a glance); the **couldn't-compare** reason stays **always-visible** (rare, no other detail).
- Verified both notes' text + computed colours in-browser (match `#E7F4EC`/`#1a6b34`, cant
  `#F1F2F4`/`#5A6473`). Harness green.

## 2026-09-03 · "Ignore" verdict → "Can't confirm / Set aside" — BUILT + DEPLOYED

- **Discussion (manager, via Rohan):** the flagged-photo verdict button read **"Ignore this photo /
  Reference can't be used"** — too narrow. It needs to also serve the common case where the recruiter
  **can't call it match or no-match, doesn't want to discard the evidence, and wants to keep it out
  of the score** — not because the reference is unusable, but because they simply can't confirm.
- **Decision point (asked Rohan):** should this "can't confirm" outcome **(A)** set the photo aside
  from the score (today's `excluded` behavior, recruiter can still submit) or **(B)** hold the whole
  verdict open at "Needs review / Can't confirm" until resolved (a distinct outcome needing its own
  4th button)? **Rohan chose (A) — set aside from the score.** So we keep the existing `excluded`
  semantics and just broaden one button; no new logic path, still 3 actions.
- **Change:** button relabelled **"Can't confirm" / "Set aside — leave out of the score"** (both
  action-card variants). Downstream copy followed: badge **"Ignored" → "Set aside"**; banner extra
  **"N ignored" → "N set aside"**; recorded-row lead **"Photo ignored" → "Set aside — couldn't
  confirm"**; reason-popup title **"Why ignore this photo?" → "Why set this photo aside?"**; and the
  reason list now leads with **"Can't tell — too close to call"** (the can't-confirm reason) ahead of
  the unusable-reference reasons. The underlying `codeOutcome`/`reportSummary` math is unchanged —
  `ignore` still maps to `excluded` and drops out of the denominator. Harness assertions updated
  (`set aside` strings). Verified button + recorded state + summary math + reason popup in-browser.

## 2026-09-03 · Upload/setup card redesign — BUILT + DEPLOYED

- **Discussion (manager, via Rohan):** the upload/setup card felt cluttered and slightly
  contradictory. Asks: (1) move **"Use a different photo"** to the **top-right corner, in line with
  the "Upload joining day photo" heading**; (2) **remove** the "Ready to compare" sub-heading and the
  "Every photo on file is compared separately. Scores are never averaged." line; (3) **don't** show a
  green "Photo looks good to compare." confirmation — if the photo is good, show the checkboxes
  directly; (4) move the **consent checkboxes to the right of the photo** (into the space the
  "Ready to compare" block used to occupy); (5) **keep the poor-quality warning**.
- **Process:** built a wireframe first (`show_widget`), Rohan approved ("Yes build it, keep the
  poor-quality warning").
- **Decision / Change:** header is now a flex row — heading + hint left, "Use a different photo"
  docked top-right (only when a photo is loaded and not mid-run). Uploaded state is a two-column
  flex row: 150×186 photo left, the two consent/attestation checkboxes right, full-width Run
  verification below. Removed the two text blocks and the green confirmation. The poor-quality amber
  warning is retained, above the checkboxes. Mobile wraps the row (checkboxes below the photo).
  The heading is no longer state-aware ("Ready to compare"/"Running verification…" removed from it);
  the transient radar status ("Checking your photo…" / "Running verification…") now lives in the
  right column and the Run button hides during the pre-flight/run. Verified all three states
  (good / poor-quality / checking) + mobile stacking in-browser. Harness green.

## 2026-09-03 · Worklist overdue row: consistent RHID · Job · overdue-tag — BUILT + DEPLOYED

- **Change (manager):** overdue To-verify rows showed "Expected Mon 3 Aug · N days ago" (dropping
  the RHID · Job that non-overdue rows show) — inconsistent. Now **every** active row shows
  **RHID · Job**, and overdue ones append a colour-coded tag: **"N days ago, 3 Aug"** (short date,
  no weekday/"Expected"). Colour by lateness (unchanged thresholds): red `#D93025` when > 7 days
  overdue, amber `#8a6414` otherwise. Wraps on mobile via `.wl-sub`. Harness green.

## 2026-09-03 · Accessibility pass toward WCAG 2.1 AA — BUILT + DEPLOYED

- **Discussion:** Rohan asked whether the build is AA-compliant. Audit said no. Ran a focused pass;
  **brand blue `#0076FB` kept as-is for now** (its white-on-blue button = 4.21:1 and blue-as-text =
  4.21:1 stay just under 4.5 — a brand/DS decision, deferred).
- **Fixed:** (1) **keyboard** (2.1.1) — a global `keydown` listener makes every `role="button"` div
  (candidate rows, pick lists) activatable with Enter/Space (they had onclick but no key handler).
  (2) **text contrast** (1.4.3) — the two failing greys darkened: muted `#8A94A4`→`#667085`
  (4.97:1) and `#9a9a9a`→`#6E6E6E` (5.10:1), both pass on white and the light card/field grounds;
  same hues, minimal visual change. (3) **reduced motion** (2.3.3) — blanket
  `prefers-reduced-motion` rule kills all CSS animations/transitions, and the rAF completion-scroll
  jumps instead of animating. (4) **focus visible** (2.4.7) — global `:focus-visible` outline on all
  interactive elements incl. the custom `role=button` rows. (5) **ARIA** (4.1.2) — the segmented
  controls were `aria-selected` on plain buttons (invalid); switched to the toggle-button pattern
  (`aria-pressed`) + `role="group"` + aria-label.
- **Still open (noted, not done):** brand-blue contrast (kept per Rohan); non-text/border contrast
  (1.4.11) — some borders `#C6C6C6`/`#A5A5A5` are < 3:1 (deferred to avoid changing the just-approved
  visual weight without DS sign-off); full ARIA tab pattern w/ arrow-key nav (toggle-button pattern
  used instead, which is valid); styled-div "headings" could become real `<h#>`. Harness green.

## 2026-09-02 · Completed worklist tab shows "Reviewed" (not the verdict) — BUILT + DEPLOYED

- **Change (manager):** on the **Completed** worklist tab, don't surface Verified / Not verified —
  every completed row now shows a neutral **"Reviewed"** pill (consistent with dropping the verdict
  badge from the report). Since there's no verdict distinction to filter on, the **Status dropdown
  is hidden on the Completed tab** (Dates + Sort remain); the To-verify tab is unchanged (To verify
  / In review pills + full filters). The underlying status (verified/notverified) is still in the
  data, just not shown as a badge. Harness green.

## 2026-09-02 · Verdict-action labels made parallel — BUILT + DEPLOYED

- **Change (manager):** the "same person" action button was titled **"Same person"** / "Faces match
  despite the score" — inconsistent with **"Not a match"** / "Different person". Renamed it to
  **"Match"** / "Same person" so the first two actions read in parallel (verdict on top, person
  interpretation below). "Ignore this photo" / "Reference can't be used" unchanged; the recorded
  line + row chip still say "Same person" (the human's confirmation). Harness green.

## 2026-09-02 · Remove the % score bar + the verdict badge in the submit bar — BUILT + DEPLOYED

- **Discussion:** manager wants the **percentage removed** from the report (the "Face-match score"
  bar / Match-line on the expanded cards, and the "N% · matches" on the compact rows) and the
  **verdict badge removed from the bottom submit bar**.
- **Change:** dropped `similarityBar(r)` from `reportCard` (flagged cards now go photos → "Why this
  needs a look" cause → action buttons; no score/percentage/match-line); compact-card sub-line is
  now just the date (per-round status pill still conveys Match/Needs review/etc). Removed the
  verdict pill from `.rpt-subbar` — it now shows only the info line ("N still need your review" /
  the resolved breakdown) + the buttons. Extends the earlier "pills, not percentages" call. The
  post-submit confirmation card still shows the final status pill. Harness green.

## 2026-09-02 · Submit bar un-floated (docked) — BUILT + DEPLOYED

- **Discussion:** the sticky/floating submit bar was called out as **distracting** (it follows the
  scroll and overlaps the round content, incl. the action buttons at the bottom of the viewport).
- **Change:** dropped `position:sticky` + the blur/translucent treatment on `.rpt-subbar`; it's now
  a normal solid card docked at the **end of the report** (after the last round). All its content
  and the guide-review behaviour (Review flagged / Submit anyway → Submit report, "Not reviewed"
  pill) are unchanged — only the positioning. Supersedes the earlier "sticky floating bar" decision.
  Harness green.

## 2026-09-02 · Worklist redesign — tabs + photos + simplified (manager feedback) — BUILT + DEPLOYED

- **Discussion:** Rohan's manager reviewed the deployed v2 worklist and asked to **simplify** it —
  bring back a **tabs** split (completed candidates in their own tab, the rest in one), add
  **candidate photo thumbnails**, and **tidy the filters**. (The photos reverse Rohan's earlier
  removal — this time the manager wants them; Rohan confirmed.)
- **Decision & change:** `worklistView` rewritten to a **two-tab** layout (`state.wlTab`,
  `setWlTab`, `isCompleted`): **To verify** (active — to-verify + in-review, with **Coming up** at
  the bottom) and **Completed** (verified / not verified / needs review), each with a count. The
  separate **"Needs your attention" block was removed** — overdue candidates now fold into the
  To-verify tab, sorted to the top with their red/amber "expected · N days ago" (folded per Rohan's
  call, removes the duplicate rows). **Candidate photos back** as row avatars (`candAvatar`). Filters
  kept but **tidied** and the Status dropdown is now **scoped to the current tab** (To verify: All /
  To verify / In review · Completed: All / Verified / Not verified); dropped the redundant summary
  sub-line. Kebab gained **"Not joining"** on overdue/upcoming rows. Mobile: row sub-line **wraps**
  (`.wl-sub`) so the overdue urgency isn't truncated. `wlList` is now tab-aware; the render harness
  was updated (tab-count + tab-scoped-filter assertions) and stays green.

## 2026-09-02 · Submit bar: "Not reviewed" status + simplified — BUILT + DEPLOYED

- **Discussion:** while flagged rounds are still open the bar showed the final verdict pill ("Not
  verified") and the full 4-part breakdown — Rohan noted (a) it should read **"Not reviewed"** (it's
  pending, not a final verdict) and (b) it's too busy.
- **Change:** while `unresolved>0` the pill now reads **"Not reviewed"** (amber) and the info line is
  a short "N comparisons still need your review" (not the full breakdown). Once every flagged round
  has a verdict, the pill shows the real final verdict (Verified / Needs review / Not verified) and
  the full summary breakdown returns, with a single "Submit report". Purely a submit-bar display
  change; `reportSummary` and the submit flow are unchanged. Harness green; rebuilt + pushed.

## 2026-09-02 · De-dupe photo caption + guide-review submit bar — BUILT + DEPLOYED

- **Repeated info:** the flagged-round card showed the round label + date in the header **and**
  again overlaid on the reference photo. Fixed: the photo caption now carries only what the header
  doesn't — "Interviewed by {name}" (or "Identity document" / "On-file photo") + the relative age
  ("74 days earlier"). No repeated label/date.
- **"Floating Submit feels like the form ends there":** a persistent Submit CTA read as "you're
  done, just submit", inviting submission before reviewing the flagged rounds. Rohan picked
  **"guide review, then submit"** (over a hard block or un-floating it). Built: while any flagged
  round is unreviewed the bar's primary is **"Review flagged (N)"** (`jumpToFlagged` → smooth-scroll
  to the next unresolved round, cards now carry `id="rpt-round-i"`) with **"Submit anyway"** as a
  quiet secondary; once all are resolved the bar flips to a single primary **"Submit report"** and
  the verdict pill updates. **Kept soft, not hard-blocked** (Rohan's call): "Submit anyway" still
  works and the submit dialog then requires the review-confirmation checkbox + a note for unreviewed
  rounds — recruiter judgment + audit trail, matching the earlier soft-mandatory decision. Stacks
  on mobile (`.rpt-subbar-actions`). Harness green; rebuilt + pushed.

---

## 2026-08-31 · Mobile audit + fixes — BUILT + DEPLOYED

- **Discussion:** Rohan asked to check the v2 flow at phone width and make sure spacing/layout hold.
- **Findings & fixes:** on ≤560px — the flagged-round **action buttons** (Same person / Not a match /
  Ignore) stayed 3-across and cramped → now stack one-per-row (`.rpt-acts`); the **floating Submit
  bar** squished the breakdown beside the button → now stacks (pill + breakdown on top, full-width
  Submit below, `.rpt-subbar`); the **two compare photos** stayed side-by-side (~150px each) → now
  **stack full-width at 1/1 crop** for face scrutiny (`.rpt-panes` / `.rpt-pane`, matching the v2
  mock). Also: **empty Email/Phone** on seed candidates now render "—" (were blank); **"1 photos on
  file"** → "1 photo". Left as-is: role text truncates with "…" in tight worklist rows (standard).
  Harness green; rebuilt + pushed.

---

## 2026-08-31 · Verdict + breakdown moved into the floating Submit bar — BUILT + DEPLOYED

- **Discussion:** the Submit button floats (always reachable) but the "Not verified" banner sat at
  the very bottom of the rounds — a recruiter could submit without registering the verdict. Rohan
  called out the UX gap and chose to consolidate everything into the floating bar (accepting a
  busier bar) so the action and its rationale are co-located.
- **Decision & change:** the floating bar now leads with the **system-verdict pill** (Verified /
  Needs review / Not verified, from `SUBMIT_STATUS[tier]`) followed by the **full count breakdown**
  (`reportSummary().sub` + "· you can still submit" when unresolved), then the Submit button. The
  standalone `verdictBanner` card was removed from `reportFeed` (its content now lives in the bar;
  the submitted-state confirmation card still shows the outcome pill). Harness green; rebuilt +
  pushed.

---

## 2026-08-31 · Smooth scroll to report top on run-complete — BUILT + DEPLOYED

- **Discussion:** after Run verification the scan animation plays, then the report renders and the
  page "directly jumps" onto a Needs-review / Not-a-match round (the tall upload card above the
  report disappears, so the content snaps upward mid-report). Rohan wanted a scroll so the user
  follows what's happening instead of being teleported.
- **Decision & change:** on completion (`settleRow`, once all rows settle) a ~240ms beat then an
  eased `requestAnimationFrame` tween (`smoothScrollToEl`) glides to `#rpt-top` (the "Photo taken
  today" card at the top of the report). Used a manual rAF tween rather than native
  `behavior:'smooth'` because some webviews (incl. the in-app preview pane) no-op the native smooth
  option. Harness green; rebuilt + pushed.

---

## 2026-08-31 · Worklist avatars removed + AI-scan animation — BUILT + DEPLOYED

- **Worklist photos removed:** Rohan felt the candidate photos were too heavy for the All-
  candidates list. Reverted worklist rows (attention + list + search picker) to initials — kept it
  consistent across the whole worklist since the same people appear in both the attention block and
  the list. `candAvatar()` stays defined but unused, in case we bring photos back.
- **Upload / Run animation reworked (AI-scan motif):** Rohan wanted a "cooler, new-age AI" feel and
  a **scanning effect on the image**, plus the **same animation on Run verification**. Also flagged
  a contradiction: the heading said "Ready to compare" while the line below said "Checking photo
  quality…". Built: a **face-scan overlay** (`scanOverlay()` — corner reticle brackets, faint grid,
  vignette tint, sweeping cyan laser line) on the joining-day photo, and a **radar-sweep loader**
  (`.rh-radar` — conic sweep + pulsing core) replacing the goo blob — both shown during the quality
  pre-flight *and* the verification run; row thumbnails get a matching cyan scan-sweep. Upload
  heading is now state-aware ("Checking your photo…" / "Running verification…" / "Ready to
  compare"). Honours `prefers-reduced-motion`. Harness green; rebuilt + pushed.

---

## 2026-08-31 · Submit report → sticky floating bar — BUILT + DEPLOYED

- **Discussion:** on the live report Rohan noticed the **Submit report** control was a plain card
  at the end, not the **floating** bar from the finalized v2 mock — "i liked that floating".
- **Decision & change:** split the verdict banner and submit apart in `reportFeed`; the submit is
  now a sticky floating bar (`position:sticky; bottom:16px`, translucent white + blur, shadow) with
  the review-count helper on the left and the button on the right — it floats while scrolling the
  rounds and settles at the end. When a report is already submitted it renders the "Report
  submitted" confirmation as a normal card (no float). Harness stayed green; rebuilt + pushed.

---

## 2026-08-31 · v2 card-style UI across all three screens — BUILT + DEPLOYED (`dee44d6`)

- **Discussion:** Rohan wanted a fresh UI for the joining-day flow. We prototyped it first as
  three standalone HTML artifacts (worklist → setup → report) and iterated on the design in light
  mode until he signed off ("now it looks like v2"), then implemented it into the app. Naming
  convention agreed: **v1** = the original UI, **v2** = this redesign; "revert to v1" restores the
  pre-change source.
- **Research / prototyping:** built `build_worklist.js` / `build_setup.js` / `build_rnd.js`
  generators (reusing the app's embedded photos) → three private claude.ai artifacts. Design
  locked there: Instagram-style per-round **card feed**; matched rounds calm & collapsible, flagged
  rounds full; **thumbnails only when collapsed**; **verdict kept in the header chip** once
  recorded; **side-by-side icon action buttons**; type-grouped sections (Application & interview /
  Identity documents · scored more leniently) with **headers kept in the Needs-review view**;
  documents shown in full so the ID face is visible; **candidate-photo avatars** on the worklist;
  **All rounds / Needs review** toggle.
- **Copy pass:** "Face-match score" (was Model similarity); "Match line · 85/65%" (was
  Photos/Documents match at N%); "Why this needs a look / Why this may not match" (was Likely
  cause…); action prompt "Is this the same person?"; setup chip "Not matched yet"; docs group
  "scored more leniently (older, lower-quality scans)"; worklist hint reworded.
- **Decision & change (built + deployed):** implemented in `verify-identity.html` via a
  `reportFeed`/`reportCard` render path + `state.reportView` toggle + `candAvatar`; shared tokens
  aligned to the mocks (cool `#EEF1F5` ground, 16px cards with soft lifted shadow, slim 54px nav,
  3px rainbow). **Light mode only — dark mode + nav sun/moon toggle deferred** (the app uses
  hardcoded inline colours, so a full token rewrite is the follow-up; the artifacts keep the dark
  theme). All logic functions unchanged; the ~52-assertion render harness stayed green. Built via
  `build_repo.js` (key stripped → 0 in shipped page; Gemini calls → `/api/compare` + `/api/quality`),
  pushed to `main`, live on Vercel. Revert baseline:
  `D:\Codebase\identity-verify-rnd\snapshot-2026-08-31\` (`v1-original-ui/` + `v2-card-ui/`).

---

## 2026-08-27 · Source-photo quality pre-flight (live Gemini) + provenance attestation — BUILT

- **Discussion:** on the upload step, run a quality check on the joining-day photo; if good, the
  recruiter can proceed. And require a **second checkbox** attesting the photo is a genuine
  same-day capture of the person who joined (not a random/old/supplied image), separate from the
  existing consent checkbox.
- **Corrected a misconception:** I'd said the source pre-flight "needs the vision model" as if that
  were a new system. It isn't — **Gemini does quality/occlusion/face-presence well** (describable
  attributes); only the similarity *number* needs a real embedding engine. "Can't be seeded" just
  meant it needs a live call, and Gemini is that call. User chose to build it **live (Option A)**.
- **Built:**
  - `api/quality.js` serverless (key-safe, same proxy pattern as compare) + `geminiQuality()` in
    the source (swapped to `/api/quality` at build); `USE_LIVE_QUALITY = true`.
  - On upload, `checkQuality()` runs; a **soft** banner shows Checking / "looks good" / "may be
    hard to compare — retake or run anyway". Never blocks; a failed call falls back to usable.
    Prompt judges **facial occlusion only, never headwear type/religion**.
  - **Attestation checkbox** (second, distinct from consent) is a **hard gate**: Run verification
    stays disabled until both consent and attestation are ticked. Stored on the check record;
    shown in the report header for audit.
  - Verified: harness 52 assertions + live DOM (gating: consent-alone doesn't enable Run, both
    does; quality warning is soft) + a **real Gemini quality call** returning
    `{usable:true, reason:"ok", …}` for a good photo.
- **Now live for real** (not seeded): the quality pre-flight. Still seeded/pending: the similarity
  score (needs the embedding engine).

## 2026-08-27 · Quality gate + per-row review model — LOCKED + BUILT

- **Discussion:** user locked all five §C questions and approved seeded quality flags for the
  prototype. Decisions: (1) confidence gates the score; (2) no-photo/no-face = Couldn't compare,
  never Not-a-match; (3) headgear → facial-occlusion only, never classify religion; (4) source
  pre-flight as a soft warning; (5) replace the four reason codes with Same person / Not a match /
  Ignore(+reason).
- **Built:** `photoState` now quality-gates the score; `aiReason` surfaces the flag reason (shown
  under review rows + in the expanded panel as "AI flagged this: …"); the four reason codes are
  replaced by the action model (`resolveRow`/`setIgnoreReason`), with **Ignore excluded from the
  denominator** and a per-row **audit line** ("AI marked … → <action> by A. Sharma · time"); the
  banner recomputes from the resolved states. Seeded a poor-quality high-scoring row (Rahul Round
  3) so the "quality overrides score" case is demonstrable. Verified: harness 52 assertions, 0
  syntax errors, + live DOM pass (Round 3 → Needs review · Not facing the camera; ignore drops the
  denominator 7→6 and writes the audit line).
- **Deferred:** the **source-photo pre-flight (#4)** — can't be seeded (arbitrary upload), so it
  waits on the live vision model. Everything else in §C is built.

## 2026-08-27 · Worklist visual + interaction refinements — BUILT

Small follow-ups from the user reviewing the live build:
- Default page size 25 → **10** (pagination shows immediately; options 10/25/50).
- **Mine-only toggle and the "· yours" label removed** — no ownership concept exists yet, so the
  list shows all candidates; header reads "All candidates".
- Attention block: amber confined to the **header banner only** (card border + row dividers
  neutralised), then the header itself set to a **white background** with title `#2a2a2a` /
  subtitle `#747474` — the warning triangle is the only accent left.
- **Bulk "Dismiss all" removed** — dismissal is per-row only (attributed reason + who/when), so
  the safety block can't be emptied in one tap.

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

## 2026-08-28 · Recruiter submits (no personal confirm/deny) + submit confirmation — BUILT

- **Discussion:** user reaffirmed the original intent — the recruiter should **submit** the report,
  not personally confirm/deny the candidate's identity (which the earlier build did with Confirm /
  Can't-confirm). I flagged that the old buttons came from the GDPR Art 22 / SCHUFA concern, and
  that "just submit" stays legal because the human's real input is the per-row review (not a
  rubber-stamp) and no adverse action is auto-executed. User then added: on Submit, take a
  confirmation that they've reviewed all comparisons.
- **Built:**
  - Report decision bar → a single **Submit report** button (removed Confirm / Can't-confirm).
    The system status (Verified / Needs review / Not verified) carries the verdict.
  - **Submit confirmation popup** (`openSubmit`/`confirmSubmit`, `submitModal`): mandatory checkbox
    "I've reviewed all the comparisons…", optional note (**required if any comparison is
    unreviewed**; the popup shows how many), Submit disabled until checked. Record: *"Report
    submitted by A. Sharma · time"* + system status chip + N-unreviewed; Reopen re-opens.
  - **Worklist vocabulary reworked** to match: statuses are now **To verify / In review / Verified /
    Needs review / Not verified** (`wlStatus`/`submittedStatus`/`wlPill`, the status dropdown, seed
    remap, attention = to-verify+in-review). Submitted checks show the report's system status.
  - Verified: harness (worklist counts + submittedStatus mapping) + live DOM (submit button, modal
    gating on checkbox + note-when-unreviewed, submitted record + status chip, seed pills).

## 2026-08-28 · Flagged rows open by default (multi-open accordion) + "Other" requires a note — BUILT

- **Discussion:** user asked whether the review/no-match rows (where recruiter input is needed)
  should be open by default; agreed on **open all unresolved flagged rows, auto-collapse on resolve**.
  Also: picking **"Other"** in either reason popup must **require a note** (and Ignore gains an
  "Other" option).
- **Built:** accordion switched from single-open (`state.open`) to multi-open (`openRows` +
  `effectiveOpen()`); unresolved Needs-review / Not-a-match rows default open, match/cant stay
  collapsed, resolving a row (`resolveRow`/`confirmReason`) auto-collapses it, still toggleable.
  Reason popups: "Other" added to Ignore (7 options), and "Other" makes the note mandatory (inline
  error, blocks Confirm). Verified: harness + live DOM (default-open set correct, auto-collapse on
  resolve, match-row toggle, Other-note gate). Also confirmed the final-verdict model is as agreed
  (system status Verified/Needs review/Not verified, confident-contradiction, human decides, never
  auto-rejects) — no change, just reviewed.

## 2026-08-28 · Expanded review row redesign + reason popup — BUILT

- **Discussion:** user brought a wireframe and iterated on it in chat. Confirmed via two wireframe
  rounds (captions overlaid on the photos; panes swapped so reference is on the left).
- **Built into the report expanded panel:**
  - Photos **swapped** (reference left, today right) with **captions overlaid** on each (scrim);
    reference shows **relative age** (`reportRelAge()`).
  - **Similarity bar** (`similarityBar()`) with the source-aware **match threshold marked** (85% /
    65%), coloured by state.
  - Full-sentence **"Likely cause for review:" / "Likely cause for not match:"** callout, seeded per
    flagged photo (`cause`), `aiReason()` fallback.
  - Three **action cards** (Same person / Not a match / Ignore); "reason required" text dropped.
  - **Reason popup** for Not-a-match and Ignore (`openReasonModal`/`confirmReason`, `rmodal` state):
    reason list + optional note, Confirm gated on a reason. Same-person applies inline. Replaced the
    old inline ignore dropdown and the four radio codes.
- Verified: harness 52 assertions + live DOM (labels, bar, overlay caption, popup open→pick→confirm
  writes the badge + audit line, no-match variant). NOTES.md updated.

## 2026-08-27 · Every candidate gets a profile photo (AI-generated) except Meera — BUILT

- **Discussion:** user wanted every candidate to have some image in their profile; Meera stays
  photo-less (the "no photos on file" case). Chose Option A: generate synthetic headshots.
- **Tooling reality (worth recording):** the `baoyu-imagine` skill needs `bun`, which couldn't be
  fetched — `npx bun` fails behind the corporate TLS intercept (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`),
  and the skill has no vendored deps. Node 22 fetch hit the same wall until run with
  **`node --use-system-ca`** (uses the Windows trust store, which has the corporate root — same
  reason the browser works). OpenAI worked but the account is **out of credits**, so we generated
  via **Google Gemini image model** (`gemini-2.5-flash-image`) using the app's existing key
  (`scratchpad/gen_gemini.js`). Downscaled 1024px PNGs → ~400px JPEGs (~15 KB each) with PowerShell
  System.Drawing before embedding, so the page grew only ~110 KB total.
- **Built:** 7 distinct headshots → `D:/Codebase/Images/seed-*.jpg`, embedded by `_inject2.js` under
  `s1`–`s7`; `buildSeeds()` attaches one application photo (+ a status-aligned score) to each seed.
  Meera (`c3`) left with `photos: []`. Verified live: each seed shows its headshot in the on-file
  table; Meera shows "No photos on file"; harness still 10 candidates / 0 syntax errors.
- **Repro:** `node --use-system-ca scratchpad/gen_gemini.js "<prompt>" out.png` (GKEY=app Gemini
  key) → PowerShell resize → `_inject2.js` → `build_repo.js`.

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
