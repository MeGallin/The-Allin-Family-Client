# Household Jobs (local implementation, 27 October 2026)

Household Jobs is an always-available built-in family tool, like Shopping List and
Polls: Widget Library → Household Jobs → Open, or
`/my-space?view=family&tool=jobs`. It does not install individual copies or change
the calendar, global navigation or the My Space tabs. Home includes the read-only
shared summary described below.

## Behaviour and permissions

- Family is shared with signed-in family members. Mine contains only the caller's
  private jobs; administrators have no bypass. Privacy scope is fixed on creation.
- A title is required (120 characters). Note (2000), area (80), target day and
  assignee are optional. Target days are planning cues, never deadlines; past
  dates do not cause an overdue state, sorting, penalties or automatic completion.
- Any member can claim an unassigned open family job. Creator/admin manages
  editing, assignment and removal. Creator/admin or current assignee can complete
  or reopen. Private jobs remain assigned to their owner.
- One-off completion moves a job to Completed & removed jobs. Weekly/monthly
  completion records an occurrence and leaves the next occurrence open. Weekly
  adds seven calendar days; monthly clamps to the destination month (31 Jan →
  28 Feb → 28 Mar). No target day remains Flexible through repeats. No scheduler
  or background writes are needed. Reopen reverses the most recent un-reopened
  completion, restores that occurrence's target day, and retains both events.
- Details show attributed creation/edit/claim/assignment/completion/reopen/removal
  history using current nicknames. Completion targets are retained. Deleted jobs
  remain accessible in the scope's retained history; future occurrences stop.
- Remove uses the common confirmation and 20-second Undo queue, not a second
  deletion mechanism. The queue is local to the active authenticated session,
  matching existing domains; version checks protect changed jobs at execution.
- The three summary figures are scoped: open, planned today, retained completions
  in the current London Monday–Sunday week. Reopened occurrences are excluded.

## Shared order and recovery

Family has one persisted order shared by everyone; Mine has an owner-private
order. Dates never override the chosen order. Pointer/touch grip previews only
change local presentation. A drop sends one complete-list request; pointer cancel
or Escape sends none. Grip Up/Down or detail Move up/Move down sends one request
per completed keyboard/button move. Boundary moves do not send writes.

A database lock serialises complete-list validation, membership changes and
reorders. The latest successful new request wins. A stale membership list returns
409 and refreshes; concurrent claims/edits use per-job version checks. Reorders
change positions without unnecessarily invalidating open job editors. Polling
refreshes mounted foreground clients every 15 seconds and on focus/reconnect;
polling pauses during writes. Mount refreshes authoritative state.

Saving/saved/error feedback is announced. Failed moves discard the preview and
show cached authoritative order. A lost network response, timeout or server failure is explicitly uncertain. The
matching scope's pointer/grip-key/detail move controls remain disabled until a
successful authoritative GET reconciles it. Failed refreshes retain the guard,
including across widget unmount/remount. Other scopes remain usable; mutation
acknowledgements/cache upserts cannot clear the guard. A successful complete
snapshot GET covers both scopes, shows server order and re-enables their controls.
Definitive validation/permission rejections roll back without an ambiguity guard. Add/edit and state-action retries keep their in-memory
request keys for unchanged requests. Durable server receipts prevent duplicate
accepted writes; retrying an old accepted reorder cannot replay it over a newer
order. Full reload does not retain in-memory drafts/uncertain requests.

## Architecture, privacy and release boundary

Uses the existing Redux/RTK Query store, timeout/write/CSRF transport, shared write
lifecycle, Modal, draft guard, ContentSurface, widget shelf/catalogue and removal
adapters. Colocated CSS uses Nimbus typography, spacing, control, colour and radius
tokens. No new dependency, external service or generated asset.

API migration `025_household_jobs.sql` is additive: jobs, private domain history,
request receipts and one shared ordering lock. Authenticated GET `/household-jobs`
returns shared jobs plus only the caller's Mine jobs and their retained history.
POST `/household-jobs/{add,edit,claim,assign,complete,reopen,remove,reorder}` uses
CSRF and UUID request keys; item writes also require exact `id`/`version`.
The server derives ownership from session, validates active assignees and all
reorder IDs. Private content/history never enters generic family/admin activity,
usage or reporting. This release adds no central admin job report; shared history
is available to authorised family members in the widget.

Migration025 was applied only to the isolated local development database through
`C:/xampp/php/php.exe bin/migrate.php --local`. No production migration, import,
push, package upload or deployment is included.

## Verification and remaining gates

Focused client tests cover keyboard single-save ordering, failed-save rollback,
optional dates/private form copy and draft protection. Existing removal/store
integration tests are included in the scoped run. API tests use a disposable local
database/account, verify cleanup, and cover privacy, permissions, stale claims,
recurrence/history, validation, CSRF, immutable retries and separate-process
claim/order concurrency. See the workspace Cody handoff for exact commands and
results. Functional checks do not replace parent browser/visual acceptance.

Parent review matrix: desktop plus actual CSS 390/320 widths; Light/Dark; empty,
ordinary and long content; Family/Mine; optional/past target days; weekly/monthly;
add/edit/stale draft, claim, assignment, complete/reopen, archived history,
20-second Undo/removal, pointer/touch/keyboard reorder and rollback. Check focus,
clipping, keyboard discoverability, modal contained scrolling and close/focus/body
scroll restoration. Physical touch hardware and formal assistive-technology
coverage must not be inferred from automated or emulated checks.

### HJ-01 recovery follow-up (27 October 2026)

Independent Reviewee finding HJ-01 identified that uncertainty text alone allowed
a fresh reorder from old cached order. Feature-owned Redux recovery flags now
guard UI and action paths. The query lifecycle clears flags only after fulfilled
GET data marked by the real query function; artificial mutation cache upserts
carry no such marker. Focused regression reproduces accepted-response-loss, failed
GET, all move controls, scope isolation, mutation cache updates, remount and
successful reconciliation before a subsequent move. See the scoped Cody repair
handoff for executed results; parent visual acceptance remains separate.

### Date-control input follow-up (27 October 2026)

The composer listens directly to native date `input` as well as `change`, so a
filled date control updates the draft before saving even when React change
tracking suppresses its synthetic change event. Focused regression verifies
non-empty create/edit request payloads, saved target labels, remount and clearing
back to Flexible. API date validation/persistence and optional-date semantics are
unchanged; see the workspace date-input repair handoff for evidence and limits.

### Pointer-capture follow-up (27 October 2026)

Pointer drag capture belongs to the stable jobs-list container. The grip/card
moves in the DOM during previews; retaining capture on that moved node could
cancel an otherwise valid drag. The list now handles matching-pointer movement,
release and cancellation. Genuine capture loss/cancel or Escape restores the
saved presentation without a write; successful release persists one full order.
The parent owns real-browser acceptance of this path.

If busy/offline/recovery prevents saving between drag preview and release, the
preview is discarded and the saved order is shown; no write is sent. Releasing
without a changed order reports Order unchanged and sends no write. On Household
Jobs only, at viewport widths up to360px the page's Widget Store action stacks
below the full-width header text, preserving the existing Nimbus title size and
preventing the action from forcing a mid-word title break.

## Home at a glance (27 October 2026)

Home's existing Around the Family / Family Index now includes one Household Jobs
row after Shopping. It uses the same getJobs owner-keyed RTK cache and foreground
refresh policy as other Home sources. It projects Family records only, excluding
Mine before deriving any title/date/count. Shared open count includes flexible and
past-target jobs; today means the London calendar day. Done this week counts
retained, un-reopened shared occurrences from London's current Monday through now,
including archived shared-job history.

The next target is the earliest open shared target from today onward; it never
reorders the widget. With no upcoming date, the row describes flexible planning;
with no open jobs it states that explicitly. Loading/failure/offline states do not
show misleading zeros or private information. A separate common retry control is
available for online failures; offline feedback asks the user to reconnect and
shows no retry for an unstarted query. Reconnection starts the query through the
normal subscription lifecycle. One row link opens the existing jobs widget for actions.
The Home header, calendar and other row layouts are unchanged. No extra API or
database surface, dependency or styling was added. Parent browser acceptance is
separate from focused functional tests.
