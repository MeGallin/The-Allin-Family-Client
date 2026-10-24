# Dinner Spinner: behaviour and edge-case checklist

## Product rules

- Spin privately, keep or spin again, then publish only the result you want to share.
- Repeated random results are possible. Each current meal has an equal chance; duplicate names are rejected after whitespace, case and Unicode-equivalent comparison.
- Separate publication slots: Breakfast, Lunch, Dinner and Other, for each installation and date.
- No response keeps the published choice in place; no agreement is invented. An alternative request flags review and never silently spins or changes a meal.
- Publishing dates: last seven calendar days (today plus six previous days) through one year ahead. Actual eaten status cannot be set for a future date.
- Widget calendar days follow Europe/London in every viewer timezone. Publication bounds/defaults, diary days, upcoming selection, Today/Tomorrow labels and eaten controls share this contract; date-key arithmetic is safe across clock changes. Open publish bounds follow the shared clock without resetting the selected draft date. Non-widget calendar events retain their existing timezone rules.
- Retained publication links target My widgets when the installation is now personal and Family widgets when it is family-visible, preserving the exact installation/result IDs. Personal retained results do not enable replies or eaten writes.
- Eaten status is explicit and audited. Correcting it restores reply/replacement controls. Old publications and replies remain in history.
- Keep use easy: no points for spinning, no required votes, no leaderboard. Home has an optional shared three-day milestone inside the expanded diary. A date counts once regardless of meals, installations or repeated clicks; correcting records updates the count. This is a view of the current rolling diary, not a permanent award or competitive score.

## Coverage matrix

| Area | Edge cases and response | Evidence |
| --- | --- | --- |
| Input | Empty, whitespace, invisible names, control and direction characters, malformed types, Unicode, emoji, punctuation, literal HTML/SQL text, length boundaries | Client validation tests; adversarial API tests; Gary/Dad browser form walkthrough |
| Fair choices | 2–12 meals, duplicate case/spacing/invisible separators/composed accents, last-two removal, foreign/duplicate meal IDs, bulk omission | Validation/API tests; server uses prepared Unicode comparison |
| Spin | Rapid double clicks, failed/rejected request, retained last confirmed result and retry key, repeated random result, reduced motion, empty wheel, absent SVG measurement | Spinner/wheel client tests and normal browser walkthrough |
| Recovery | Offline read feedback, reconnect, 15-second timeout, cancellation, honest uncertain-save message, check-saved-changes action | Connection and request-timeout tests; shared write/session tests |
| Editing | Owner only, stale versions, conflicting saves, renamed/deleted meals, rename-away-and-back, removed or personal installation | API tests; trial stores meal version (migration 021) |
| Publishing | Private trial ownership, UUID retry, no duplicate publication, date/slot independence, existing-meal replacement, stale baseline | API and published-result tests; previous Gary/Dad lunch/dinner walkthrough |
| Responses | Optional, explicit actors, no fake agreement, stale reply/replaced result, completed meal controls | Decision, component and API tests |
| Eaten | Actor/time from session, replay preserves timestamp, correction, future-date rejection, stale changes, locked replies/replacements | API tests and Gary/Dad refresh walkthrough |
| Links | Removed/hidden/personal widget does not silently open another; replaced meal requires review | Browser walkthrough and published-result test |
| Diary | All 14 lunch/dinner slots across seven days, older/future exclusions, October clock change, current vs replaced history, exact deep links | API/helper/component tests |
| Milestones | One count per date, duplicate installations/meals do not inflate progress, correction reduces it, no private spins or votes used | Meal-diary helper test |
| Permissions | Anonymous/CSRF denial, other member/admin cannot read personal widgets or another actor’s trials, owner-only settings, per-user hiding | API suite |
| Capacity | 30 active installations, safe retry at limit, removal frees a place, histories bounded in reads | API suite |
| Existing app | Header/layout/navigation, dashboard priorities, auth/session boundaries, Undo and draft protection | Full client regression suite; Gary/Dad mobile/desktop checks |

## Repeatable commands

From the client repository:

- `npm test` — complete client regression suite.
- `npm run test:widgets` — widget client checks plus isolated database checks.
- `npm run build` — TypeScript and production build.

The API tests create and remove the dedicated regression database, restricted user and sessions. They never use the live family database or real family accounts. Browser checks use Gary/Dad locally; temporary drafts are discarded and example installations removed through the normal Undo flow.

## Latest review: 24 October 2026

168 client tests and 16 database-backed widget tests passed. Production build and PHP syntax checks passed. Existing real family dinner and account data retained; no live deployment performed.

Fixes from this review include visible/focused field errors, consistent Unicode duplicate handling, request deadlines/offline feedback, safe spin failure recovery, stale-trial version checks, explicit missing-link recovery, practical dates and a cooperative milestone with no repeat-click rewards.

Migration 021 adds the meal revision to trial spins. Existing trials that still match an active meal are backfilled with its current revision; the original revision cannot be reconstructed for historical pre-migration spins. New spins retain the exact revision. Production must use the backed-up database-release workflow for migrations 018–021 before the corresponding API/client are deployed.

The later approved Wheel & Table presentation and mixed 12-colour wheel palette supersede the earlier deferred-redesign note. This checklist records specific historical tested boundaries and should grow with new bugs; a passing suite is not a claim that every conceivable future failure has been proved impossible.

## Scoped source review repairs: 24 October 2026

DS-001 consolidates the London widget calendar contract; DS-002 repairs retained personal
diary destinations; DS-003 changes the existing API successful-publication fixture default
to the runtime London day using its existing helper. Deliberately invalid dates are retained.
Reviewee's independent follow-up marks all three resolved by source inspection, with
no further repair requested in scope. This does not establish runtime acceptance.
No tests were added or executed for these repairs. Prior passing results above predate
these changes. Cross-zone, midnight/DST and privacy-transition browser/runtime checks
remain proposed verification requiring separate authorisation.

## Widget Store presentation acceptance (local implementation)

The Widget Library uses the approved storefront design. Category/search controls,
feature artwork, app identities and detail galleries are catalogue presentation,
not another implementation of Shopping List, Polls or Dinner Spinner.

For later authorised QA, check: keyboard category/search/detail/close navigation;
mobile feature/proposed/gallery horizontal scrolling; built-in Open preserving the
same data sources; Dinner installed status and exact Personal/Family Open targets;
additional installation through the unchanged composer; Proposed apps without an
install action; existing My/Family draft protection and Undo. Also check unavailable
installation status during loading/offline/failure, rather than a false Available
claim. Preview artwork is visibly illustrative and contains no real family data.

These are acceptance notes, not executed test results. No tests were added or run
for the implementation-only request.

### Executed authorised Store QA

The subsequent QA request authorised tests and local browser writes. Added 14
mocked store regressions; focused 25/4 passed. Default full run was 186 passed and
one unchanged WeekAhead five-second timeout under load; isolated WeekAhead 11/11
and full constrained run `npx vitest run --maxWorkers=1` passed 187/45 in 194.33s.
No timeout or production behaviour was weakened.

Parent verified local real Personal/Family install/persistence/privacy of placement,
exact Open and additional installation, three tabs, built-ins, search/categories/
reset, Proposed, Escape focus and mobile feature/gallery scrolling. Both temporary
installations 4/5 completed normal delayed soft removal; original widget 1 and its
meals/publication remained unchanged. Final mobile document 347px/viewport 355px,
console warnings/errors empty; screenshot workspace work/widget-store-qa-20261024/
mobile-clean.png. No cross-account/concurrent-user or production QA claim.
