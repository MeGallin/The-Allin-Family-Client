# Focus Timer v1 — local implementation

Focus Desk lives at `/my-space?view=widgets&tool=focus`, with one personal installation
available to each family account through Widget Store → Tools. It never installs
for the family or appears on their shared shelf. Home and the Nimbus shell are
unchanged. Uninstalled users can inspect the real ready layout and open Install;
its empty history is actual server data, not a sample timer session.

Focus/Short break/Long break default to 25/5/15 minutes. Focus presets 15/25/50 and
break presets 5/15 plus whole-minute custom durations support Focus 5–180 and
break 1–60 minutes. Labels are optional, private plain text up to 80 characters.
Starting a session remembers the chosen phase's duration default. Settings/history
survive removal/reinstall; no old timer automatically restarts.

The server owns UTC millisecond intervals/deadlines and caps elapsed running time
at the target, excluding pauses. One session is current per owner across devices.
Navigation, hiding a tab or signing out is not Pause. Local visible-workspace
one-second repaint derives from the last server anchor plus monotonic elapsed time;
the app's global 30 second date clock is unchanged. Focus/reconnect/polling refetch
authoritative state after suspension. Offline is clearly an estimate; no offline
mutation queue or invented saved finish. Quiet v1 requests no sound, notification,
Push, permission, external service/key or new dependency, and promises no alarm
when the browser is closed or a device sleeps.

Precision Glass replaces the progress ring with a colocated native SVG hourglass.
The exact accessible numeric countdown stays below the glass. The graphic consumes
the same accepted elapsed/monotonic anchor, updates SVG sand geometry directly in
requestAnimationFrame and never updates React state, fetches or writes per frame.
Both sand areas follow the actual curved glass walls, inset slightly for the glass
edge, with horizontal settled surfaces instead of isolated triangles. A precomputed
area lookup from the same Bezier contour transfers equal sand area between the
chambers in proportion to actual timer progress; a fine thread and small falling grains run
only during the running interval. Pause and refreshed paused snapshots keep their
precise accepted sand position; the end remains empty above/full below until an
explicit next action. No looping loader or automatic next-session flip occurs.
Ready rests with the glass turned180degrees and sand visually at the bottom.
Start/Resume turn it upright over650ms; Pause turns it back and holds the accepted
fraction. Both orientation and gravity-aware sand settlement use one ref-only
requestAnimationFrame clock/easing value, including interrupted/reversed turns.
Settlement moves equal-volume intervals through the curved chamber's cumulative
area coordinates, so the paused sand rests against its visual floor and each
chamber's amount remains conserved even during the turn. The exact timer keeps
running during Start/Resume; animation never delays or resets its clock. The shadow
stays beneath the glass. Natural expiry stays upright with the lower chamber full;
explicit Finish/Done/Reset keep their existing meaning and return to Ready rather
than creating a new resumable Stop state. Initial/restored states render directly
in their accepted orientation/fill before paint. Reduced motion snaps both together.
Hidden tabs and offscreen glass cancel frame work and catch up from the anchor on
return. Unmount disconnects the observer, frame/timer and preference/visibility
listeners. Reduced motion hides the stream/grains and uses static one-second sand
snapshots, stopping at completion. Browser sleep/resynchronisation limits remain
the same as the numeric timer. No new dependency or API/database change is needed.

Pause at/past the deadline remains elapsed, not resumable zero. Early Finish is
guarded and distinct from a full finish. Reset discards the current session.
At time reached, Start 5 minute break / Start 25 minute focus is an explicit atomic
close/start transition; Done for now only closes. There is no automatic next phase.
Every meaningful transition checks monotonic installation version, generation and
exact current-session ID under an owner lock. Durable immutable receipts use owner/
domain/UUID scope and a hash of the complete payload/action. Changed reuse fails.
Historical acknowledgement never replaces current RTK Query state; a fresh snapshot
is required. Explicit unresolved state preserves the exact pending request through
in-app Refresh. Memory-only keys/drafts do not survive a full browser reload or
discarded navigation; accepted server state does.

The existing shared 20 second delayed-removal Undo is reused through a small adapter.
The clock continues during Undo. Actual removal checks the captured revision and
generation/session ID, archives a running/paused session as discarded or already
elapsed as elapsed/removed, clears current pointer and soft-removes availability.
No removed/unconfirmed session gets finish credit; a different device's meaningful
change cancels stale removal. Private history is retained and reinstall is ready.

The quiet seven-day disclosure uses all accepted terminal rows within seven London
calendar days, independently of the bounded 200 recent list. UTC hour aggregates are
mapped to London dates in PHP, avoiding a hosting MySQL timezone-table requirement.
The seven-day strip/totals count only explicit completed/early finishes, separate
Focus and Break time, and count full sessions only for target-reached Focus. Values
are whole timed minutes, not measured attention. History labels early/discarded/
elapsed-removed records accurately; the grouping date is explicit finish date.

Labels, phase, duration, sessions and history stay owner-only with no administrator
bypass. Admin activity has generic install/remove metadata only under separate
`focus_timer`, avoiding family widget ETag changes. Existing generic Widgets-section
usage/navigation metadata still exists; it does not include the focus tool query,
labels or private timer payloads. Do not describe all navigation or installation
existence as invisible.

Local additive migration 024 creates three small tables: installation/defaults/
current pointer, private session history, durable receipts. It was applied after
local environment/loopback/023 prerequisite/pending 024-only checks and a private
backup. Future production release requires the established fresh verified-backup/
restore/rehearsal workflow and migration 024, then coordinated API/client upload.
The current PHP-only runtime packaging automatically includes `src/focus-timer.php`;
SQL/private backups are excluded. Existing Daily Word assets/notices are unchanged.

Functional QA was subsequently authorised on 25 October 2026. Repeatable coverage is
in `src/features/focus-timer/focus-timer-actions.test.ts` (actual Redux/query/removal
boundaries) and `src/components/focus-timer/FocusTimerWorkspace.test.tsx` (mounted
controls, drafts, deadline receipt feedback, uncertain retry and acknowledgement
refresh locking). Positive sub-minute history is shown as `<1 timed min`; aggregate
whole-minute totals retain the approved rules.

API `node --test tests/focus-timer.test.mjs` uses a uniquely marked, disposable local
DB/account and synthetic identities, never Gary's game or another real family user.
Its internal optional function-time parameter is not exposed through HTTP. Tests
cover precise/capped time, paused spans, actual parallel writers, durable receipts,
privacy/CSRF, removal/generation and London DST/>200-row summaries. The fixture
verifies removal of its disposable database, account, sessions and photos.

The parent separately performs real-duration local Gary/Dad browser QA. A private
full database backup and empty owner baseline precede those writes. Named cleanup
archives the QA rows before restoring only Gary's new Focus tables/audit to that
baseline after normal removal; no other family content is restored or deleted.
Exact executed results and limits are recorded in workspace
`reports/cody/2026-10-25-focus-timer-qa.md`. This remains local work: no commit, push,
staging, deployment or production migration is authorised by this QA phase.

Subsequent release authorisation25October2026 permits both repository commits/pushes
and separate standard client/API package builds. Parent owns production backup,
scratch restore/rehearsal, additive024 migration/verification, upload and live QA.
Those steps remain pending until separately recorded; earlier QA-only restrictions
describe that historical phase. The final local visual review intentionally leaves
Gary's personal Focus installed Ready25:00; do not run old QA cleanup on it.
