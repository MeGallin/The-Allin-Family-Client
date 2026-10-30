# Since your last visit

Local implementation, 30 October 2026. Not released. Parent accepted the empty
disclosure state in the internal local browser under Gary/Dad at desktop1368×790
and actual mobile IAB355×767. Opening the overlay preserves the Days Ahead position
and keeps its heading visible. Populated rows/long lists, other themes/zoom and
multi-account/concurrency remain unverified. No tests were added or run.

Home places a compact disclosure tag immediately below PageHeader and before
Days Ahead/WeekPlanner. It has no standalone collapsed card. Real eligible activity
shows an accented “N new updates” count; a successful empty result keeps a quiet
“Since your last visit · You’re all caught up” tag. Both states toggle an animated
overlaid detail surface beneath the tag; empty details say “You’re all caught up.” No activity is
fabricated to demonstrate the disclosure.

The tag is a native button with aria-expanded/aria-controls. Collapsed details are
inert and aria-hidden. A local CSS grid/fade transition and chevron rotation reuse
Nimbus motion tokens and disable transitions for reduced motion. Details are
absolutely positioned beneath the tag, above the following Home content, so opening
never pushes Days Ahead down. Width follows the available Home content up to the
shared content-width; compact --space-3 padding overrides the full dashboard-panel
inset. The text-only caught-up surface uses --space-1 vertical padding, keeping
the heading visible at narrow widths without reducing text or action targets. The raised surface is capped at 50dvh with internal scrolling
and contained overscroll. Ancestor Home/layout sources have no overflow clipping.
The existing account popover layer and raised shadow guide overlay layering.
Escape closes and returns focus to the tag; clicking outside or tabbing outside
closes it without moving focus away from the user's destination. The shared
Accordion uses internally owned native details without an animated close API, so
this presentation uses a small local disclosure instead of changing shared
consumers. Icon, FriendlyTime, LoadingState, content-surface and global keyboard
focus/control styles remain shared. Nimbus typography, spacing, colours, pill
radius and minimum target height are retained. Days Ahead and Family Index source
and styling are unchanged.

Loading/error/offline status remains visible on the collapsed tag, including
cached-data refresh failure/offline conditions alongside the update count.
Expanded details retain error/retry and offline feedback. Calendar/shopping counts
move inside the disclosure. Expanded rows show source, current actor nickname (normal
family-name fallback), concise change, item title, relative time and a source
link. Calendar links reuse the saved event's own ID/date and the existing exact
selection route. Removed events open that route's unavailable explanation.
Shopping links open the complete shared list, including picked-up items; they
do not claim to select an individual item or resurrect a removed item.

Only the latest other-person change per record since the reviewed position is
shown, newest first. Counts mean these condensed item updates, not every audit
event. Own changes, personal notes and all other widget/private activity are
excluded. Shared calendar notes and raw audit before/after payloads are never
returned by the recap endpoint. This is an MVP for the app's existing single
family membership model, not a new multi-household permission model.

## Data flow and acknowledgement

GET `/home-recap` requires an active authenticated family account. First use
initialises the account's server cursor at the current committed eligible audit
boundary and returns no backlog. Later visits, navigation and disclosure never
advance it. Results include an owner ID and a string `throughId`; owner-keyed RTK
Query also validates the returned owner. The query shares account/logout cache
reset, refetches on mount/focus/reconnect, and polls every 30 seconds while focused.
Reads and writes have the existing 15-second timeout; offline review is disabled.

POST `/home-recap/review` requires the existing CSRF guard and the exact displayed
`throughId`. The server permits only an account's offered range, advances its
reviewed position monotonically and accepts repeated/older acknowledgements
without moving backwards. No request can clear through a newly calculated MAX.
Events committed after the displayed boundary survive review, including changes
to a record that already appeared. The mutation refreshes the recap; uncertain
writes retain explicit error feedback and can be retried safely. A disappearing
focused review control returns keyboard focus to the existing disclosure
button only while restoration is still pending. Blurring the review action or
clicking outside cancels that pending restoration, so a delayed response cannot
pull focus away from a subsequently chosen control.

The API reuses existing transactional `activity_events`, which already covers
successful calendar/shopping adds, edits, checks and removals and avoids duplicate
create retries. Migration 026 adds only `home_recap_clock` (one serialisation row)
and `home_recap_reviews` (one row per participating user). Eligible activity
inserts lock the clock before allocating their audit ID, held through domain
commit. Snapshot creation locks the same row before reading its boundary. This
prevents an uncommitted lower audit ID from arriving behind a reviewed cursor.
No new event log, private-payload capture, provider, dependency or backfill.

## Release and outstanding acceptance

Apply reviewed migration 026 before the API runtime, then the client. All three
are required; calendar/shopping audit writes now require the clock table.
Production migration needs its separate authorisation and established verified
backup/rehearsal process. Existing family records/audit history are retained.

Required parent browser matrix: desktop plus actual CSS390/320, Light/Dark;
first-use/empty tag collapsed/expanded, calendar only, shopping only, mixed/repeated updates, long title
and nickname, collapsed/expanded, loading, offline, read/ack failure/retry,
source links and unavailable records, keyboard disclosure/links/review/focus
return; outside click/Tab-away/Escape dismissal; animation and reduced motion. Measure Days Ahead top before/after opening, verify overlay layering, rounded/shadow edges, narrow-width fit and long-list internal scrolling. Confirm calendar cards/scrolling, Family at a glance and Family Index
remain intact. Functional acceptance additionally needs two-account own-action
exclusion, cross-device cursor persistence, first-use boundary, repeated/stale
acknowledgements and a concurrent later save remaining unread. Those checks have
not been executed in this scope.

## Final parent acceptance checkpoint — empty overlay

Parent browser acceptance after the compact empty inset:

- Desktop1368×790: Days Ahead top y=335.94 before and after opening; panel
  y=267.39–299.59.
- Actual mobile IAB355×767: panel y=298.37–330.57; Days Ahead heading
  y=335.55–358.95, visible, with no horizontal overflow.
- Escape closes and returns focus to the trigger. No browser console errors.

These are parent-observed measurements, not Cody browser checks. Populated rows
and long-list scrolling, other themes/zoom and multi-account/concurrency remain
unverified. The build already passed after the final CSS change; this checkpoint
changes documentation only. No additional build/tests or release actions.
