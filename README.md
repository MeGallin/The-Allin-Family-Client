# The Allin Family - Client

React and TypeScript client using Vite for theallinfamily.co.uk. The PHP API has
its own repository in the sibling api folder.

## Run locally

The existing checkout has dependencies and a local environment file. Start the
API and database using the API README, then run:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173`.

Development page requests to `localhost:5173` redirect to `127.0.0.1:5173`, keeping
navigation on the same origin as local session and CSRF configuration. The
redirect middleware is development-only and does not alter production hosting.

On a fresh checkout:

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
- `src/components/brand`: shared shield/wordmark, footer and usage guide. Small,
  medium and large sizes use global brand tokens and preserve the SVG aspect ratio.
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
retains private history. All removals use the shared 20-second countdown and Undo
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
and forced-colour support. Removing an item starts a 20-second spinner/countdown
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

This checks TypeScript and creates static files in dist. Vite's development proxy
is not included in a production build.

### Prepare the Windows upload folder

From this client directory, choose the package you need:

```powershell
npm run build:deploy
npm run build:deploy:client
npm run build:deploy:api
```

| Command | Folder under `C:\xampp\htdocs\WebSitesDesigns\live` | Contents |
| --- | --- | --- |
| `build:deploy` | `theallinfamily` | Built client and `api/` runtime |
| `build:deploy:client` | `theallinfamily-client` | Built client only, including root `.htaccess` |
| `build:deploy:api` | `theallinfamily-api` | Only `api/`, ready to merge into the site root |

The batch entry point `scripts/build-deploy.cmd` calls Windows PowerShell for
checked file operations. It works from npm or by double-clicking the batch file;
double-clicking prepares the full package. Client builds require Node/npm and
installed client dependencies. Packages containing the API require PHP CLI,
resolved from PATH, falling back to `C:\xampp\php\php.exe`. Client-only does not
require or inspect PHP/API runtime; API-only does not run TypeScript/Vite or read dist.

The selected destination's `live` parent must exist; its final folder is created
if missing. The other two package folders remain untouched. Each command:

1. Validates the destination, rejects source overlap and junctions/symbolic links,
   and uses one shared lock to prevent any packaging commands running concurrently.
2. For client/full packages, runs the normal TypeScript/Vite build with root
   hosting (`/`) and same-origin API (`/api`) explicitly selected. Normal
   `npm run build` remains available.
3. Copies only the selected runtime into a fresh sibling staging folder: client
   dist files (including the production `.htaccess`) and/or `api/index.php`,
   `api/.htaccess`, `api/.env.example` and PHP runtime under `api/src`.
   Verifies each copy with SHA-256 and checks every packaged PHP file with `php -l`.
4. Moves the entire previous destination, including hidden/stale files, into
   `live\.deploy-backups\<package-folder>-<timestamp>-<id>`, then moves the validated
   staging folder into its place. A failed final move restores the previous folder.

A build/copy/validation error exits nonzero without replacing the live folder.
Failed staging folders remain outside the upload folder for diagnosis; their
paths are printed. Backups are retained until manually reviewed/removed and are
blocked from Apache access with their own `.htaccess`. Only one family packaging
command can run at a time. No server upload or database changes occur.

The resulting folder contains only the selected runtime, not a configured
production installation. Development `.env`, Git metadata, node_modules, tests,
CLI tools, migrations, database data, photos and sessions are excluded. Any config
or media manually put in the local destination is replaced on the next run and
retained only in that run's backup. Keep deployment credentials/private data
separate from this generated folder.

Before the first server upload, complete the API README's hosting setup: provision
the database, apply migrations through 015 using separate deployment access,
configure production environment values (`APP_ENV`, HTTPS origin, a private app
key, secure cookies and database credentials), and provide private writable
photo/session storage. `api/.env.example` is a reference with local defaults,
not production credentials; do not rename it unchanged. Existing database content
and private photos require a separate transfer plan. These are subsequent server
setup steps, not actions performed by this packaging command.

Upload the **contents** of the selected package folder into `public_html` using
FileZilla, including `.htaccess` files. For API-only this means merging its `api/`
folder into the existing `public_html/api/`, not uploading PHP files into the root.
For client-only, retain the entire remote `api/` folder. For every mode, preserve
server `api/.env` and private photo/session storage. Do not delete or mirror the
remote site to match a partial package. FileZilla copying does not remove obsolete
remote assets; review any stale-file cleanup separately with a server backup.

Choose the mode deliberately; scripts do not infer changes or API compatibility.
Before a client-only upload, confirm that any required API/schema version is
already live. Before an API upload, confirm compatibility with the existing client.
Apply required versioned migrations separately with a production backup, then deploy
the matching runtime. Packaging never runs migrations or copies a local database.
Review hosting-specific Apache/PHP settings before replacing server routing files.

The API's [database-release runbook](../api/DATABASE-RELEASE.md) describes the separate
private CLI workflow for a reviewed plan, enforced maintenance, fresh database/
application/photo backup, actual scratch restore verification, checksummed pending
SQL and explicit verified resume. Deploy its maintenance-capable API first, verify
hosting CLI/permissions/storage prerequisites, and rehearse locally before any live
schema change. Tools/migrations remain excluded from all three upload packages.
`npm run test:database-release` exercises this workflow only on disposable local DBs;
it is also part of `npm run test:all`. No production release has been run by these tests.

The production `.htaccess` redirects `theallinfamily.co.uk` to
`https://www.theallinfamily.co.uk`, preserving the path and query, and disables
directory listings. Set the API's production `APP_ORIGIN` to that exact www
origin. Clear cPanel's NGINX cache after uploading changed files; it can otherwise
continue serving a pre-deployment page independently for the bare and www hosts.

Deployment regression checks use disposable temp folders, never the actual upload
folders, server or database:

```powershell
npm run test:deploy
```

The original 12 checks plus 66 mode-specific checks cover all three package modes:
exact file sets/copy hashes, unused build/PHP dependencies, missing destination
creation, repeated-run hidden-file backups, unchanged sibling packages/source data,
stale-file removal and secret/source-map/API-entry exclusion. Failure cases include
build/output/PHP/copy errors, corrupt copies, backup writes/moves, final-move rollback,
invalid modes/unsafe destinations, junctions (including backup access rules), lock
recovery and cross-mode concurrent runs. Synthetic fault injection exercises errors
without changing a real package or database. This suite does not upload to hosting.

The three real npm commands were also exercised locally: API20/client96/full116
files matched source hashes exactly, backups matched prior packages, and the other
two packages stayed byte-for-byte unchanged after each run. Invalid batch mode
returned exit1. These counts describe the current build and can change as features
are added. Active server configuration and database migrations remain separate.

npm run preview previews a build without the development API proxy. Use npm run
dev for the integrated local app.

The repository-root .htaccess prevents XAMPP Apache from serving client source
or environment files. It is not included in dist. Do not deploy the source folder,
Git metadata or .env. `public/.htaccess` is copied into dist and provides Apache
SPA route fallback while leaving `/api` to its own PHP routing. Enable
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
  `features/removals/removals-slice.ts` defines the only 20-second delay.
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
through a read-only summary linking to the source poll. Voting executes only on /polls. The existing five mobile navigation targets remain uncrowded;
Home's shortcut and poll panel provide phone access to the full polls page.

Any signed-in family member can create a poll with two to six distinct choices,
cast one vote, change it or withdraw it while voting is open. Everyone sees totals
and percentages. Only the creator or an administrator can edit question/details,
close/reopen voting or remove a poll. Choices stay fixed to preserve ballot meaning.
Removal uses the shared 20-second pending countdown/Undo; votes/history remain after
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

## Administrator overview and charts

The default /admin view is now an overview, with separate URL-addressable sections
for Usage details, Shared activity and Family members (?view=usage/activity/members).
Each view is lazy; Recharts3.10.1 and its react-is peer are loaded with the overview,
so chart code is not part of ordinary family pages. The existing Redux/RTK Query
API owns the insight snapshot, refreshes every30 seconds while focused, clears it
with session state, and invalidates it after shared writes/nickname changes.

The daily pulse combines stacked audit-action categories with a sign-in line.
Feature and member charts reuse one StackedActivityChart, semantic palette/legend
and ChartPanel. All colours live in styles/chart-tokens.css, derived from Nimbus.
Animations are disabled for chart polling; existing route transitions remain.
Responsive SVG, keyboard accessibility, plain figures and an expandable daily
table provide access beyond colour/hover. Phone layouts stack; desktop compares
features and members side by side. Chart categories keep the same meaning across
all views: added, updated, votes/reactions and removed.

Only real recorded data is shown. Before the first recorded date, values are null
and displayed as unavailable; the plot starts at the first available day. Today is
partial, calendar days use Europe/London, and previous-period comparisons are
withheld until earlier recorded coverage exists. Feature counts measure writes,
not page views or time reading a feature. Personal-note activity is excluded.
Member usage links retain the selected period/person; feature links explicitly
open the full audit history for that feature. Data-driven next-step notes highlight
limited history, enabled members without recorded use, and the busiest shared
feature. No forecasts or made-up engagement scores are produced.

Admin filters share features/admin/useAdminFilters.ts and live in the URL. Overview
periods, usage person/period and audit feature/actor/cursor survive refresh and
browser Back. Filter changes reset an older cursor; navigation keeps the period.
Named chart applications support keyboard access to tooltips. ChartTooltip uses
the actual chart width to pin tooltips inside narrow frames, avoiding plot-axis
clamping overflow at320px; desktop tooltips follow the chart normally. The daily
figures table scrolls within its own keyboard-focusable region.

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

## Family account management

Administration > Family members is a lazy, mobile-first directory with one shared
create/edit form. Admins can manage full name, nickname, sign-in username, role and
active/paused access, including restoring paused accounts. Account creation issues
a generated temporary password. Password reset has a separate confirmation and
issues a new temporary password; the member must choose their own at next sign-in.
Use Change password in the account menu for your own account. Admins cannot pause
or demote themselves. Pausing retains content and prevents sign-in immediately.

The existing Redux store owns member request status and the RTK Query directory.
Writes use executeWrite and writeRequest, sharing session-generation checks,
CSRF handling, conflict refresh and cache invalidation with the other features.
Profile invalidation tags are shared with nickname changes. Components and CSS
are colocated under components/admin/members; typed domain state and transport
live in features/members and services. The old nickname-only admin grid is replaced
by the directory; self-service nickname editing remains on Profile.

Temporary passwords are returned directly to the calling component and shown once.
They never enter Redux actions, query/mutation caches, localStorage, URLs or audit
history. Dismissing the credential panel or leaving the view clears its mounted
state. Share the details privately before dismissing. If a response is lost, reload
the directory before retrying; reset again if a new temporary credential is needed.

Account changes and self-service password changes appear in Shared activity under
Family accounts and in the overview chart. Nickname-only self edits keep their
existing Nicknames category. Audit member filters include paused accounts. The
API records actor, target, server time and public before/after fields, excluding
passwords and hashes. No database migration or example accounts are required.

Account-management browser verification also covers duplicate usernames, stale
edits and loading the latest version. Loading the latest draft clears the old
conflict error. The shared shoppingError adapter projects plain status/code/message
fields even when a direct service throws ApiError, keeping Redux state serializable.

## Home and real saved data

Home reads the same authenticated shopping/calendar/memories/polls RTK Query caches
as their full pages. Shared sync subscribers refresh needed routes every15 seconds
while visible/online and invalidate after writes; no duplicate Home API or snapshot store
is introduced. Session clearing resets the same private caches. The /family request
remains an authenticated bootstrap, not a source of sample content.

HomeOverview and features/family/useHomeOverview.ts expose linked live totals for
upcoming plans (each annual event counted once at its next occurrence), saved
memories, items still to pick up, and open polls. Unknown totals show a dash with
Loading/Unavailable rather than an invented zero; failed refreshes mark previously
loaded totals. These summaries are navigation, not admin analytics.

- Coming up shows the next three saved events, recurring birthdays projected by the
  existing date helpers, human countdowns and a link to remaining plans. Cached plans
  remain visible with a retry message if a later refresh fails.
- Recent memories shows the three newest saved entries: the first uses the shared
  photo/story/reaction card and the next two are compact album links. Ordering is
  createdAt descending with a stable ID tie-break. The featured photo uses existing
  priority loading; additional thumbnails are lazy and preserve image fallback UI.
- Shopping reuses shoppingView and ShoppingList to show only unpicked items,
  important first then newest. Counts and remainder links refer to this same view.
  A genuine all-picked-up state links back to review the saved full list.
- Polls feature the newest open question with live shared voting/results and links
  to two further open questions. The featured question stays stable when voting.
  With no open poll, the newest-created closed poll appears as a labelled result;
  an actually empty database offers creation. Failed initial requests never display
  a false empty prompt. Cached data remains available with retry feedback.

Memory and poll cards have stable anchors. The shared useHashTarget hook resolves
Home album/poll links after lazy routes and saved data mount, scrolls and focuses
the matching card, and respects reduced motion. It also handles /#family-poll.
No write logic or delayed removal timers are duplicated. Components/CSS remain
colocated and use Nimbus tokens; the overview is two columns on phones and four
on wider containers, with the existing one-to-two-column Home layout retained.
No seeded content, database changes, new dependencies or backend changes are needed.

## Family brief UI

Nimbus remains the shared colour/font foundation. Family brief uses a stronger
heading/date hierarchy, flat section dividers and aligned rows for structured data.
`src/styles/tokens.css` owns type/spacing/shape decisions; `data-patterns.css` owns
shared numerical summaries and explanatory disclosures. PageHeader, Panel and
EmptyState carry the common page/section rhythm; feature CSS stays colocated.

Home puts the next saved event before recent memories, alongside them on desktop.
Its overview is an unboxed linked summary, and shortcuts follow the content.
Calendar uses date-led agenda rows; Memories preserves full photographs; private
notes keep their existing paper/pin/tilt/curl design. Empty Notes/Polls show the
creation path without redundant search fields. No generated content is seeded.

ViewControls consistently exposes filters/sorting through an expandable native
summary with visible counts and an active-filter indication. RefreshButton shares
accessible collection refresh controls. Labels and touch targets remain readable;
phone layouts come first and wider layouts use the family-content container.

Administration uses the same hierarchy: compact tabs, shared summary figures,
aligned account/usage directories and date-grouped activity. Exact audit timestamps
remain in change disclosures. Chart data, reporting semantics, permission checks,
Redux/RTK Query caches and the common 20-second removal/Undo flow are retained.

### Family brief regression follow-up

The internal-browser regression covered Gary/Dad's family routes, admin views and
sign-in flow on desktop and phones. CollectionToolbar now shares the compact
privacy/help/refresh/feedback pattern on Notes and Polls. Full-page poll headings
are level 2 (Home previews stay level 3), and an empty filtered view offers Show
all polls. The reporting toolbar uses the shared icon refresh control so the
period text fits a 320px phone. Temporary browser fixtures and their activity were
removed; original family content was checked against the pre-test baseline.

## Draft protection, reporting periods and poll links

The authenticated app uses a React Router data router, preserving lazy page routes.
`DraftProtectionProvider` owns one blocker and one shared Nimbus confirmation for
all registered editors. `useDraftGuard` protects dirty Notes, Calendar, Memories,
Polls, Shopping add/inline-edit, nickname and admin member forms. Closing, Cancel,
Back, changing editor/admin view, password settings and sign-out preserve writing
until the person explicitly discards it. Successful saves bypass the warning.
Refresh/tab close use the browser's native beforeunload warning. Filter and anchor
changes that retain the editor do not warn. Shopping retains editing rows even if
a background update removes them from the filtered view. Missing records keep the
mounted draft available to copy and disable saving. Nested modals share a scroll
lock and restore scrolling regardless of closing order.

`DraftConflict` provides a shared three-way field review. Untouched fields adopt
the latest saved values; overlapping changes require choosing the draft or saved
value. Reconciled fields remain editable and require an explicit save. Selected
memory images stay in memory while the editor remains open. Draft text/files are
not persisted in URLs, localStorage or a draft API. Deliberately discarding,
confirmed reloads, crashes and expired authentication can still lose a draft.

`ReportingPeriodSelect` is shared by Overview, Usage and Activity. Activity now
passes days through its RTK Query/API filters and shows the returned reporting
bounds. All use London calendar days including today, with exclusive next-midnight
UTC query bounds. Activity and Usage also support all recorded history (days=0).
Changing filters clears the pagination cursor. Usage remains a session-start cohort,
not a per-day allocation of total active time; lifetime last-login/seen stay labelled.

Poll status and search live in `show`/`q` URL parameters. `pollLink` includes the
saved open/closed status and target anchor. An anchored poll hidden by filters
reveals its actual current status, clears conflicting search and focuses the card
after loading. A missing poll gives recovery feedback. Compose/edit/remove preserve
the current view and anchor when closing; Back from another page restores the view.
No schema changes, dependencies or generated records are needed for this increment.

### Reliability regression follow-up

Internal-browser regression under Gary/Dad covered shared dirty-form navigation,
Cancel/X/Escape/Back, retained image selection, overlapping/non-overlapping note
conflicts and retained shopping drafts after filtering and background removal.
Reporting windows/drill-downs matched database counts with temporary boundary
fixtures; closed-poll links, refresh, Back, preserved editor filters and missing-link
recovery worked at phone widths. The cancelled refresh attempt retained writing;
IAB did not expose its native prompt, and crash/tab-close recovery is not promised.
Rapid admin selections now accumulate URL filters rather than losing a prior choice.
Warnings focus Keep editing; conflict review restores editor focus, and modal return
focus can fall back to main content when an account-menu trigger disappears.
Only Gary-owned disposable fixtures were used; all were removed and original content,
account identities and audit history were compared exactly with the private baseline.

## Mobile Home priorities

Home reads in the same task-first order on phones and desktop: Shopping, Coming up,
Polls, Recent memories. The linked real-data overview uses that order too, with
semantic icon keys rather than positional icon assignments. Existing wider
container layouts remain two columns; DOM and keyboard order match the reading order.

Shopping reuses the shared interactive list for up to three needed items, important
first, with a link to the remainder. Empty/all-picked-up states are compact inline
summaries. Failed connections keep retry feedback and distinguish cached completion
from a verified current snapshot. Coming up leads with the next saved occurrence,
natural countdown, author and exact date; its remaining-plan count links to Calendar.

Recent memories now uses up to three compact linked rows, lazy FamilyImage previews,
two-line story excerpts and author/relative dates. Thumbnails contain the complete
photo; text-only memories use the shared icon. Each row opens its existing album
anchor for full photos, stories, editing and reactions. Home does not duplicate those
full-card actions. Panel/Icon/FriendlyTime/date helpers and existing RTK Query
snapshots remain shared. No new endpoints, dependencies, data or design tokens.

### Mobile Home regression follow-up

Internal-browser checks under Gary/Dad covered populated shopping priority/preview
limits/remainder links and saved checks, real upcoming-plan links, Home poll votes,
changed votes and closed-result links, plus photo/story album anchors. Checked320px,
390px and desktop widths with long text and real photo loading. Memory links now
have explicit concise accessible names, so a clamped story is not read in full as
part of the link label. Disposable Gary-owned records and their audit/photo data
were cleaned; original saved content, identities and history matched the baseline.

## Shared performance policies

- useLiveQueryOptions owns route/visibility/connectivity refresh policy. Home reads
  its four shared features; other routes subscribe only to their own feature.
  Hidden/offline views stop automatic reads and resubscribe/refetch on return.
  Queued removals retain their snapshots even away from a feature or while hidden;
  busy writes pause their polling. The identity profile refreshes every60seconds;
  the existing usage presence tracker is unchanged. Private notes remain owner-scoped.
- Unused RTK Query entries survive60seconds for return navigation and delayed removal
  safety. Sign-out/session reset still aborts requests and clears every private cache.
  The transport conditionally revalidates the five snapshot endpoints, keeping their
  last ETag/data only in memory. Responses from an older session generation are
  discarded, including during JSON parsing. No localStorage cache is introduced.
- useCollectionWindow and colocated CollectionMore mount20 memory/poll/note cards
  or20 events per agenda group; Shopping mounts30 rows. Filters/sorting apply to
  the complete saved collection before windowing. Show more adds a window and focuses
  the first new entry. Changed filters reset the window. Direct memory/poll anchors
  also mount their target without requiring every preceding record. Active shopping
  editors remain pinned when a filtered/background update would otherwise hide them.
- FamilyImage accepts responsive srcSet/sizes and stored intrinsic dimensions, retains
  lazy loading/fallback feedback and resets image state when the photo changes.
  memoryPhotoSources supplies160/480 thumbnails with4rem display size and responsive
  album candidates up to1600px. Originals remain accessible via View full photo.
  Editor previews use960px delivery; local unsaved file previews remain in memory.
- Family memory activity reads compact change flags; complete exact history remains
  available through existing admin audit handling. No new client package is needed.

These are bounded render windows, not a truncated API result: initial/changed reads
still contain complete active collections, and sorting/search/counts remain global.
Migration014 and the API's metadata job must precede deployment of this client.

### Performance browser regression — 22 October 2026

Tested in the internal browser as Gary/Dad using 166 disposable records across shopping, plans, memories, private notes and polls, including two image uploads. Verified bounded batches, full-collection search, older-record deep links, keyboard focus, saved edits/votes after refresh and Undo across navigation. Fixed the shared window reset so returning to an earlier filter cannot revive an expanded batch. Retested 60 rows → alphabetical 30 → original filter 30. Phone layouts at 320/390px and wide layout remained within document width.

Recorded private responsive-image requests (36 KB mobile / 111 KB desktop for the existing 2.9 MB photo), lazy loading of an offscreen uploaded image and authenticated original/preview revalidation. Unauthenticated photo access returns 401. Per-page request logs confirmed unrelated feature collections do not poll on Shopping. Unchanged snapshots return 304 with no body. Background/offline pause and return/reconnect refresh passed using temporary local UI controls that simulated platform events; native IAB hiding does not change page visibility, so this is not an OS-level offline/background check. Diagnostic controls were removed.

All fixtures, uploaded fixture photos/derivatives and associated audit/vote/option records were removed with a private recovery copy. Original domain records, identity fields and history exactly matched the baseline afterwards; real usage tracking remains. Evidence and focused QA scripts are in the shared project workspace, outside this repository. Production build, source formatting and PHP syntax checks pass.

## Repeatable regression coverage

Run `npm run test:all` from this directory for client, feature API and existing authentication checks. See [TESTING.md](TESTING.md) for the coverage matrix, isolated fixture requirements and limitations. The shared Undo delay is now **20 seconds** across shopping, calendar, memories, private notes and polls; all countdowns/hints read the same constant. Usage heartbeats and admin refresh intervals remain separate policies.

## Shared scrollbar styling

`src/styles/scrollbars.css` owns native scrollbar styling for the page and nested scroll containers. Semantic tokens in `tokens.css` provide the shared 8px width/height, minimum thumb length, navy track and Nimbus blue/cyan default/hover/active colours. Fine-pointer devices receive the styling; touch-only devices and forced-colour modes retain native scrollbars. Standard thin/colour properties cover browsers without WebKit scrollbar selectors; the supported WebKit branch resets those properties to allow explicit dimensions and thumb states. No scrolling behaviour or overflow rules are replaced.

## Personal accent colours

Your profile → Make it yours offers Turquoise (default), Orange, Gold, Purple, Pink and Green as native radio swatches. The palette uses circular satin samples with names underneath, a separate selection ring/check, three columns on phones and six on wider screens. Pointer hover is subtle, reduced motion is respected, and forced colours expose native controls. Selections apply immediately through the shared accent, action, link, focus, selected-state, priority, chart-created and scrollbar tokens. `styles/accent-tokens.css` owns the curated palette and its supporting shades; navy base surfaces, fixed blue background highlight, semantic success/error colours and the sticky-note paper palettes retain their own tokens. No component copies colour hex values.

`features/appearance/` owns Redux preference state, account-change restoration and root theme application. `services/appearance-storage.ts` reads/writes only an allowlisted palette ID at `allin-family:accent:v1:user:<id>` in localStorage. Returning to Turquoise removes that account's override. Sign-out resets the visible theme while retaining the account's saved choice; another account loads its own choice. Same-account tabs synchronise via storage events. Profile refreshes do not overwrite in-memory choices. Storage failures apply the accent for the visit and explain that it could not be remembered. Choices are specific to this browser/origin and do not sync between devices. No API/database changes, account fields, credentials or private content are stored by this preference.

The picker and its CSS are colocated in `components/profile/AccentPicker.*`. Six labelled options use a shared radio group, selected check mark, 48px minimum controls and two columns on small screens, expanding to three where space permits. Forced-colour mode exposes native radio controls.


## Poll closing times

Apply API migration 015 before this client. PollDeadlinePicker is a colocated mobile-first widget in the existing lazy poll editor. Every new poll has a concrete UTC closesAt, initially four hours from opening the form; shortcuts reset it to one, four or 24 hours from selection. Custom dates use the browser's local time with an explicit timezone label and an exact closing-time preview. Deadlines do not drift while a draft is being filled in.

Poll cards display an updating countdown and exact cutoff. The shared PollsSync collection owns one boundary timer to update cached closed states; Home summaries, links and filters also evaluate the deadline. The API independently enforces the database clock when voting. Early closing remains available. Closed polls reopen through the editor using a future deadline and the explicit Reopen voting checkbox; saved votes remain intact. Deadline edits participate in the existing draft protection/version conflict flow and shared admin history. All colours follow Nimbus/personal accent tokens.

Deadline regressions cover native custom-date input synchronisation, shortcuts/clearing and exact cache-boundary closure without fetching (PollDeadlinePicker.test.tsx and PollsSync.test.tsx). API regression cases cover persisted deadlines, expiry, late-vote rejection, reopening, permissions, idempotency and audit history in a disposable schema.


## Home live-poll indicators

HomeOverview adds a Live count/badge and next cutoff to the poll summary. FamilyPoll uses the shared homePolls projection for the next deadline and current-user unanswered count, alongside the existing stable featured question. PollTimeRemaining renders compact countdowns with exact-date tooltips/accessibility labels from the shared useNow clock. Existing PollsSync expiration updates and saved poll caches drive the UI; no additional polling, endpoint, storage or database writes are introduced. Styling remains colocated and follows personal accent tokens.


## Read-only Home poll brief

HomePollSummary is a colocated presentational link: title, remaining time, participation, saved choice and a route to voting/results. It has no mutation hooks or ballots. PollCard is used only by the Polls route; its former Home preview mode has been removed. Home's next-deadline link targets the soonest poll independently of the stable newest featured summary. When all polls expire, the live badge/reminder disappears and the latest result remains linked with show=closed.

All poll countdowns use pollTimeLeft, including compact text and expanded accessible names, so rounding agrees across Home and Polls. home-polls.test.tsx covers nearest/featured ordering, immutable projections, deadline boundaries, singular/zero transitions, links and the absence of Home voting controls, using the real Redux expiry timer without network calls.


## Shared search and filter contract

- `components/ui/ViewControls.tsx` owns the existing labelled, mobile-first search/sort/reset/result-count interface; Calendar/Shopping wrappers configure its domain options. The input limit comes from `lib/search.ts`.
- `hooks/useCollectionFilters.ts` owns collection query/sort/status state and reset. Calendar, Shopping and Polls use URL storage with default options omitted; Notes uses memory only so private query text never enters URL/history or persistent storage. Raw input remains visible while matching normalises whitespace, case (en-GB) and equivalent Unicode.
- `hooks/useUrlFilters.ts` merges URL updates while preserving unrelated/editor parameters, handles in-flight/interleaved router commits, and resets its baseline for browser Back/Forward. Collection changes replace history and clear stale deep-link hashes. Admin reuses the same updater with pushed history, retaining its period allowlist and clearing stale pagination cursors when filters change.
- `lib/search.ts` provides the shared 100-character query bound, prepared case-insensitive substring matcher and allowlisted option lookup. Each feature keeps its own searched fields, stable sorting and business filters in its `*-view.ts` module; Polls filtering is now in `features/polls/polls-view.ts` and includes creator/editor names. Filtering still operates on the full cached collection before display windowing.
- Regression tests cover matching/Unicode/limits, private memory state, option fallbacks, editor-parameter preservation, reset, rapid/interleaved updates, Back/Forward, admin cursor resets and poll expiry matching. This refactor adds no API route, database migration or dependency; Memories still has no search UI.
