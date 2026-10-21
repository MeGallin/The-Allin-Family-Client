# The Allin Family - Client

React and TypeScript client using Vite for theallinfamily.co.uk. The PHP API has
its own repository in the sibling api folder.

## Run locally

The existing checkout has dependencies and a local environment file. Start the
API and database using the API README, then run:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173`. On a fresh checkout:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Use a Node version supported by the locked Vite release; this setup was checked
with Node 22.18.0. Vite binds to loopback and requires port 5173 to be available.

## Design system

The Nimbus-inspired theme uses dark navy surfaces, cyan actions, electric-blue
highlights and self-hosted Inter Variable. Font assets are bundled by Vite from
`@fontsource-variable/inter`; browsers do not contact an external font service.

- `src/styles/tokens.css`: semantic color, type, spacing, shape and motion tokens.
- `src/styles/fonts.css`: local font-face declarations.
- `src/styles/global.css`: base elements, controls and accessible focus defaults.
- `src/styles/patterns.css`: shared surfaces, actions and feedback patterns.
- `src/styles/index.css`: the shared style entry point.

Keep each component's stylesheet next to its TSX file. Start layouts with phone
defaults, including stacked actions and 48px controls, then enhance them with
`min-width` breakpoints. Keep colours and other shared values in tokens so future
theme changes do not require editing each component. Motion respects the user's
reduced-motion preference.

## Accounts

The client now includes sign-in, mandatory first-login password change, a protected
family home, password change and sign-out. Accounts are created by the
administrator through PHP CLI commands. There is no public registration screen
or endpoint.

## Family home and source organisation

The signed-in app has lazy routes for Home, Calendar, Memories, Lists, Personal notes and
Administration and Your profile, with a useful not-found page. Desktop navigation becomes a
labelled bottom navigation on phones. Administration currently provides a role
guard, family nickname editing and placeholder information; other account tools and statistics are future work.

Personal notes (`/notes`) is an owner-only notebook with a personalised heading
and navigation label. New note opens a lazy editor for a title, note date, optional
header/footer and a required body. Limits: title 120 characters, header/footer 500
each and body 20,000. Cards show excerpts, expandable full content and friendly/
exact creation/edit dates. Editing and confirmed deletion use version checks;
failed saves preserve the draft and focus the error. Deletion hides the note and
retains private history. All removals use the shared 30-second countdown and Undo
described below. No post-delete restore screen is provided.

The responsive pinboard uses four pastel paper colours, small stable tilts,
CSS-built thumbtacks and a defined bottom-left curl. Palette/material tokens live
in `styles/note-tokens.css`; NoteCard, NotePin and their CSS are colocated under
`components/notes`. `note-appearance.ts` derives stationery from the saved note ID,
so sorting and refreshing do not reshuffle colours. Phone cards remain straight;
keyboard focus straightens desktop cards and forced-colour mode omits decoration.

The API enforces session ownership on every note/history read and write, with no
admin bypass. Notes and their history stay out of shared family queries/feeds and
analytics. The dedicated history table stores full before/after data; the owner's
activity list receives only title/action/time summaries, not repeated full bodies.
Apply API migration 010. Notes are ordinary server-side database records protected
by account access, not an end-to-end encrypted vault.

`features/notes`, `services/notes-api.ts` and `notes-query.ts` separate private
domain types, write state and server cache/transport. Queries are keyed by account
ID and checked against the server's owner ID, and run only while Notes is open.
Polling pauses during writes/unfocused tabs; focus/reconnect refreshes update the
notebook. Session clear aborts requests and resets cached data/write feedback;
late write results have a session-generation guard. Nothing is saved in browser
storage. Search and sort use the shared ViewControls UI; private search text stays
in component memory rather than URLs/browser history.

## Shared memories

Memories and the Home preview now read saved family photos/stories from the PHP
API. A memory needs a title and a photo, story or both; stories allow 5,000
characters. The lazy composer supports a preview, photo description, replacement
and removal. Accepted photos are JPG/PNG/WebP up to 10 MB/24 megapixels; the server
validates uploads. Longer stories expand on demand. Cards show nickname-based
creator/editor attribution, relative dates, exact details and full-photo access.

Shared memory data/history lives in the existing RTK Query API cache; write status,
feedback and errors live in the `memoriesUi` slice. Files and preview object URLs
stay outside Redux and are released when their component closes. Adds reuse the
same request key when retrying an unchanged draft; version conflicts retain the
draft and require reopening the latest memory. Sign-out aborts writes and clears
the private cache; a session generation guard rejects late results.

The family can edit shared memories. Only the creator/admin can remove one, with
server enforcement and a confirmation dialog. Content/history persist in MySQL;
photos persist in private API storage and are served only to signed-in members.
Love reactions are also saved per user and appear in the administrator activity feed.
Memories refresh every 15 seconds while focused, and on focus/reconnect; failed
writes retain form values and show retryable errors. Apply API migration 009 and
configure private upload storage as described in the API README before deployment.

Members can choose a nickname under the account menu's Your profile link. Admins
can change nicknames for active family accounts under Administration. Nicknames
appear throughout family greetings, the account menu, shopping attribution/history
and memory credits/history; without one, the first name is used. Full names are
retained for account administration. Blank clears a nickname, and duplicate names
are allowed because attribution uses account IDs. Forms preserve failed drafts and
require review if someone else edited the same profile. Successful changes refresh
profile/shopping data. Other signed-in sessions pick up changes on focus or the
15-second profile refresh. Profile changes are audited by the PHP API.

Shopping is stored in the PHP/MySQL API and shared by all signed-in family members.
Important items appear first, then standard items; each group is newest first.
Shopping and calendar share `components/ui/ViewControls` and its colocated styles
for search, sorting, result counts and Reset view. Shopping additionally offers
All items, Still to get, Picked up, Important and Standard priority filters.
Its sorts include Important first (default), Newest/Oldest added, Name A–Z/Z–A
and Recently edited; choosing a sort explicitly replaces the default priority
ordering. Search matches item titles and creator/editor nicknames. The q/sort/show
URL parameters survive refresh. Filtering/sorting derives a view of the Redux
API cache without changing shared order/data; Home keeps its default preview.
No matching items has separate feedback and Reset view. Pending removal/Undo
stays global even if an item is outside the current filtered view.
The Important option is available in the add form and Edit item controls. It is
saved for all family members, with existing creator/updater attribution and
version checks. Importance changes appear in activity history. Add retries include
the flag in the draft identity. Apply API migration 008 before deployment.
Highlight colours use semantic `--color-important`, `--color-important-surface`
and `--color-important-text` tokens mapped to the existing Nimbus cyan palette.
Highlighted rows also display a star and Important text, so priority is not
communicated by colour alone. Existing items default to standard priority.
Members can add, rename, check/uncheck and remove items. Compact rows show the item
name and smaller nickname attribution. The 48px options control opens Edit name,
Item details (creator/updater and exact timestamps), or Remove. The add form sits
above the list. Recent list activity shows who made each change,
including earlier names and removed items. Removal preserves database history.
The list refreshes every 15 seconds while visible and when the tab regains focus;
members can also refresh manually. Unchecked boxes use navy surfaces with cyan
outlines and checked boxes use cyan with a dark tick, including keyboard focus
and forced-colour support. Removing an item starts a 30-second spinner/countdown
with Undo; no removal request is sent before that deadline. The pending-removals
panel stays available across signed-in routes, and multiple removals have independent
deadlines. Other members see the item until the removal is actually saved. Changes
by another member cancel a pending removal rather than deleting a changed item.
Unsent removals are cancelled on refresh, closing the tab, signing out or opening
password settings; these temporary intentions are not persisted. The actual removal
and its attribution are recorded by the API only after the timer expires.

It requires an online API; failed writes show
an error without pretending to save. Version conflicts refresh the list and ask
the member to review their change. Add retries reuse a request key.

Calendar events are saved through the PHP API and shared by all active family
members. The calendar and home Coming up panel use the same RTK Query cache.
Members can add events, edit titles/date/time/notes, and confirm removal. Compact
nickname attribution stays visible; Event details exposes exact creator/updater
timestamps and original time-zone context. Recent calendar activity records changes.
The lazy event form retains drafts on failure and offers Load latest event for
stale edits. A shared Redux write lock prevents overlapping local calendar writes;
15-second polling, focus and reconnect refresh other sessions. Server versions
prevent overwrites, and request keys prevent duplicate additions on retry. Session
reset clears calendar data with the other private API caches. Dates/times are
entered and displayed in the viewer's local time zone and saved in UTC. Notes-only
edits preserve the original instant/time-zone metadata. Nonexistent times during
daylight-saving clock changes are rejected. This covers individual timed events;
other repeat patterns, reminders and calendar-provider sync are future work. All-day events
keep their calendar date across time zones and stay in Coming up until that local
day ends. Native date/time fields also read their visible values on submission.
Repeat every year enables annual all-day birthdays. Calendar and Home derive the
next occurrence from the saved anchor and rule; the original date is preserved
when editing a projected occurrence. Editing/removal affects every year. A leap-day
birthday uses 28 February in non-leap years. Activity details include annual status.
Apply API migrations 005, 006 and 007 before using this client.

Calendar uses compact date-stamped blocks in a responsive grid. Cards grow with
their content and details; narrow screens stack them. Home retains its simpler
event list. CalendarControls provides title/creator/editor nickname search and
sorts by next occurrence, latest event date, newest/oldest addition, latest edit
or name. The derived view lives in `features/calendar/calendar-view.ts`; shared
events remain in RTK Query. Search/sort use URL parameters, survive refresh and
remain selected while opening/closing the lazy event form. Reset view restores
the default. No-match feedback differs from an empty calendar.

Friendly dates use date-fns with the en-GB locale. Shared helpers in
`src/lib/friendly-dates.ts` split longer spans into whole calendar years, months
and remaining days (for example, In 4 months and 23 days). Zero units are omitted;
shorter spans stay in days. Both countdowns and older relative timestamps use this
breakdown, calculated at local day boundaries rather than fixed 30-day months.
They also format relative activity times (just now, yesterday,
days/months ago) and calendar-day event countdowns (Today, Tomorrow, In 28 days).
Calendar and Home use the next annual occurrence for birthday countdowns. The
shared `useNow` clock has one 30-second timer for all labels, refreshes on focus
and tab visibility, and stops when no labels subscribe. Time labels have exact
timestamps available to assistive technology and hover; item/event details and
activity history retain explicit timestamps for touch users. EventCountdown has
colocated styles; shared FriendlyTime has no independent visual styling. No
stored timestamps, annual anchors, API payloads or audit data change for formatting.

Polls and votes are saved by the API; their client state uses the same shared RTK Query cache.
Memories, reactions, shopping and calendar events use the saved PHP API data.

- `src/app`: router and signed-in application composition.
- `src/pages`: lazy route views with colocated styles.
- `src/components`: reusable UI, layout, auth and family components with their CSS.
- `src/app/store.ts`: Redux Toolkit store and RTK Query middleware/listeners.
- `src/app/store-hooks.ts`: typed Redux hooks; `session-actions.ts` clears private state.
- `src/features/auth`: public signed-in profile slice.
- `src/components/profile`: reusable nickname form with colocated styles.
- `src/components/admin`: family nickname administration with colocated styles.
- `src/pages/profile`: lazy profile page with colocated styles.
- `src/features/family`: navigation and authenticated family identity.
- `src/features/polls`: saved polls, write adapters, shared deletion and polling.
- `src/features/activity`: types for the administrator activity feed.
- `src/features/memories`: memory types, write state/actions and a Redux-backed hook.
- `src/services/memories-api.ts`, `memories-query.ts`: multipart uploads, authenticated
  photo URLs and RTK Query memory data sharing the existing API cache.
- `src/features/shopping`: typed attribution, shopping UI slice and a Redux-backed hook.
- `src/services/shopping-query.ts`: RTK Query endpoints and shared shopping cache.
- `src/services/profile-api.ts`, `profile-query.ts`: profile transport and injected
  RTK Query endpoints, sharing the existing API middleware/cache.
- `src/services`: shared HTTP client and feature API calls.
- `src/hooks`, `src/types`, `src/lib`: hooks, authentication types and small helpers.

Route and dialog bundles load on demand. Images reserve their dimensions;
gallery images load lazily while the featured memory loads eagerly. Native
dialogs provide keyboard focus handling and Escape dismissal. Loading, retry,
empty and error states use shared components. Motion respects reduced motion.

Run `npm run format` to format source or `npm run format:check` to check formatting.

## State management

Use Redux Toolkit and React Redux for shared application state. Feature slices own
client state; RTK Query owns server data, caching, invalidation, polling and focus/
reconnect refreshes. Shopping has one shared query cache, with a shared write lock
and retry key in its UI slice. It waits for successful server writes and protects
against stale edits. Polling pauses while unfocused or saving and refreshes on return.
Use typed hooks from `src/app/store-hooks.ts`; do not add competing Context or
component copies of shared feature data. Keep temporary form text and dialog state
local to the component. The setup follows the [Redux TypeScript guide](https://redux.js.org/usage/usage-with-typescript)
and [RTK Query guidance](https://redux.js.org/toolkit/rtk-query/usage/polling).

Only the public account profile and serializable feature data belong in Redux.
Passwords, session cookies, CSRF tokens, File objects and browser resources are
excluded. Photo preview object URLs remain local to the composer and are revoked
when replaced or unmounted.
Sign-out/session expiry aborts pending requests and clears private caches, feature
data and feedback. A session generation guard prevents late write responses from
repopulating another session. Redux is not persisted to browser storage; the API
database remains the source of truth for persisted features. DevTools are enabled in development.

PHP verifies every private request. React receives only the signed-in user's
public profile. The session ID stays in an HttpOnly cookie; CSRF tokens are held
in memory. No passwords or authentication tokens are stored in localStorage.
A password change revokes other sessions. Initial temporary passwords remain
local to the API checkout until handed to the account owners.

## Environment

This repository has its own ignored .env, copied from the committed template.

- VITE_APP_NAME: public display name.
- VITE_API_BASE_URL: browser-facing API path, normally /api on the same origin.
- API_PROXY_TARGET: local PHP server address, normally http://127.0.0.1:8000.
  Used only by Vite's development server.

Restart Vite after changing settings. VITE_ variables are public and bundled into
production files. Never put database credentials, passwords or private keys here.
The API has its own server-only environment file.

The development proxy forwards /api/auth/session to /auth/session on PHP.
Requests and cookies use the same browser origin. The PHP APP_ORIGIN setting must
match the browser address exactly. For the existing setup, use 127.0.0.1 rather
than localhost, which is a different origin.

## Build and deploy

```powershell
npm run build
```

This checks TypeScript and creates static files in dist. Upload only the contents
of dist to Trilogy's website directory. The PHP API is deployed independently
under /api on the same domain, with HTTPS and production cookie settings.
Vite's development proxy is not included in a production build.

npm run preview previews a build without the development API proxy. Use npm run
dev for the integrated local app.

The repository-root .htaccess prevents XAMPP Apache from serving client source
or environment files. It is not included in dist. Do not deploy the source folder,
Git metadata or .env. `public/.htaccess` is copied into dist and provides Apache
SPA route fallback while leaving `/api` to the separately deployed API. Enable
Apache rewrite support, or configure equivalent fallback rules on another host.

Repository: https://github.com/MeGallin/The-Allin-Family-Client

## Shared writes and delayed removal

- All shopping, calendar, memories, polls and personal-note writes use
  `src/app/execute-write.ts`: one busy/session guard, request lifecycle,
  conflict refresh and finally cleanup. Feature adapters handle typed cache updates
  and their feedback. Private-note snapshots remain keyed and checked by owner.
- `src/services/write-request.ts` sends JSON or multipart writes through the
  existing authenticated request client and retries an expired CSRF token once.
  Shopping, calendar, notes, memories and nickname updates use it.
- Every record removal starts through `useRemovals(domain).remove(record)`.
  `features/removals/removals-slice.ts` defines the only 30-second delay.
  `removal-listener.ts` alone waits and submits the removal after expiry.
  `removal-adapters.ts` maps each domain to its existing version-protected API.
  Do not call a domain's raw remove write from a component.
- `components/removals/PendingRemovals` owns the countdown/progress/Undo UI
  above every family route. Confirmations share `RemovalConfirmation` where
  applicable and all use `RemovalDelayHint`. Cards indicate pending removal.
- Undo cancels an unsent request. Navigation within the family space keeps the
  queue; refresh, sign-out, account changes and leaving the family area cancel
  unsent removals. The queue is intentionally in memory, never local storage.
- At expiry, writes wait for the feature's current save. A cached version change
  cancels removal; the server's version check protects the final race. Errors
  retain existing content or tell the user to refresh if the outcome is uncertain.
  Once a request starts, Undo is disabled; this is not a post-delete restore UI.
- Keep queues serializable and minimal: ID/title/version and scheduling/session
  metadata only. Never store note bodies, files or controllers in the queue.

To add another removable feature, supply a typed adapter and use the shared hook
and UI; do not introduce another timer, countdown component or delay constant.


## Saved family polls and administrator activity

Apply API migration 011. The lazy /polls page is linked from Home's Have a say
shortcut and the desktop sidebar. The Home poll panel uses the same saved data
and voting card. The existing five mobile navigation targets remain uncrowded;
Home's shortcut and poll panel provide phone access to the full polls page.

Any signed-in family member can create a poll with two to six distinct choices,
cast one vote, change it or withdraw it while voting is open. Everyone sees totals
and percentages. Only the creator or an administrator can edit question/details,
close/reopen voting or remove a poll. Choices stay fixed to preserve ballot meaning.
Removal uses the shared 30-second pending countdown/Undo; votes/history remain after
soft removal. Empty, loading, saving, closed, missing and error states are included.

features/polls and services/polls-* separate types, Redux UI state, RTK Query data
and transport. Writes use executeWrite/writeRequest; removals use useRemovals with
a typed polls adapter. No new timer, write middleware, dependency or sample seed.
Server-generated actor IDs, independent per-person ballot revisions and poll
versions prevent spoofed/duplicate votes and stale changes. Unchanged retries have
no new activity; an unchanged addition draft reuses its user-scoped request key.

Administration now has a lazy Family activity feed. Filter by person and feature;
expand before/after changes and page back in blocks of 50 using stable cursors.
It covers shopping, calendar, memories/likes, polls/votes and nicknames. Voting
screens explicitly explain that administrators can see voter identity/choices.
Personal note content/history is excluded. Activity invalidation after successful
writes is centralised in executeWrite; the feed also polls while its latest page
is visible. Nickname writes invalidate activity through the existing profile flow.

The development database contains no generated examples after Gary's requested
cleanup. User accounts, Gary's real entries and their audit history are preserved.
No example poll is created automatically; the first poll should be real input.
## Platform usage

Administration now includes a lazy Platform usage section backed by the existing
Redux/RTK Query API cache. It shows per-person login counts, estimated active time,
last login/last seen, members without recorded use, and paginated session history
with last section and explicit sign-out location/time. Filters cover person and
sessions started in the last7/30/90 days or since tracking began. Data refreshes
every30 seconds on the latest page while focused. Nickname changes invalidate
this view, and sign-out/session changes clear it with the shared private cache.

UsagePresence is mounted once inside the authenticated router. It sends only the
pathname and recent-input/visibility state through the shared CSRF write transport;
no typed text, query string, note ID or content is sent. Pointer/keyboard/wheel/touch
input renews activity; raw scroll events do not, because automatic layout changes
and scroll anchoring must not reset the idle timer. Inputs expire after60
seconds; visible heartbeats run every30 seconds, hidden tabs stop periodic traffic,
and missing intervals are bounded by server time. Network failures never block
content workflows. Explicit sign-out sends the current pathname through auth-api.
The profile explains administrator visibility and continued note-content privacy.

Apply API migrations012 and013 first. Tracking starts now; an already-open session is
labelled as existing rather than a new login. Closing the browser is not a reliable
logout event: stale sessions display inactive and retain their last recorded
section. Duration is an estimate of active time across sessions, not exact time
between login and logout. No third-party analytics package or cookie is added.
