# The Allin Family - Client

React and TypeScript client using Vite for theallinfamily.co.uk. The PHP API has
its own repository in the sibling api folder.

## Alerts

The calendar warning badge opens the shared weather-style Modal with the three
latest FSA notices, using shared Nimbus Panel/Icon/FriendlyTime styles. Alert
details load lazily when the dialog opens. There is no dedicated Alerts route or
navigation entry; closing the dialog preserves the calendar range and scroll.
Provider components and tests live together in `components/family/alerts`, ready
for additional alert sources later. The `features/food-alerts` hook subscribes to the
shared Redux Toolkit Query API through `services/food-alerts-query.ts`. Polls every
30 minutes while focused; server caching and failure backoff protect the provider.
Source/publication dates, official links and last successful check are shown.
Unavailable/stale data is labelled, with retry; browser-cached notices expire after
six hours. No search, key, database migration or family data sent to the FSA.
Release requires both client and API packages. Tests are colocated with FoodAlerts;
the API regression suite includes provider normalisation/cache/authentication checks.
Today's Home calendar tile shows a small warning badge and latest-notice count
beside the date, alongside the weather information. The badge opens the dialog
without changing tile height. Its accessible
label/tooltip explains notice types and stale/unavailable status. It is a current
information shortcut, not a claim these notices were issued today. Both displays
share one RTK Query request and the same freshness rules.
Inside the dialog, each headline is a native keyboard-accessible disclosure. Expanding it
shows affected products (including supplied pack, batch and date information), the
FSA risk statement and consumer advice, plus the official source link. Missing
fields have explicit fallbacks. Products/advice stack on phones and use two columns
when space permits. No additional request or family data write occurs on expansion;
the API's cached full-view response is shared with Home's compact badge.

The shared `components/ui/Accordion.tsx` and colocated CSS own disclosure behaviour,
the chevron and Nimbus defaults. Each group keeps at most one item open; selecting
the open item again closes it. Food alerts supply stable IDs, summary content and
detail content while keeping their product-specific layout in the alerts folder.
The alert briefing uses type-specific warning icons, publication dates and affected
product counts for scanning. Expanded notices emphasise the FSA consumer action;
phones show advice first, while wider dialogs pair products and advice in columns.
Only the notice area scrolls, keeping the dialog title and Close control visible.

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

## Diary companion layout and shared surfaces

Home leads with the existing horizontal calendar. Its next-event/birthday column follows the calendar in DOM order and sits alongside it only at the wide container breakpoint. Polls and shopping remain compact links to their source pages.

- `styles/tokens.css` owns Nimbus design values, including the minimum collection-column width.
- `styles/content-patterns.css` owns the shared surface recipe and main/history layout. Change the recipe once to update Home, collections, Profile and Admin.
- `components/ui/Panel.tsx` provides a labelled section with a header/action. Its default `surface` variant uses the shared recipe. Use `variant="plain"` only inside an existing surface, as Home does, to avoid duplicate framing.
- `components/ui/ContentSurface.tsx` wraps collections that already have their own headings/controls. It uses the same recipe and adds stacked spacing; it has no data or business logic.
- Domain components retain their own rendering and behaviour. Sticky notes, photos and charts keep their specialised styles. History follows primary content on mobile. A lone photo memory pairs its image and story only on wide screens.

This styling release changes no API, database schema, permissions or saved family content. Deploy with `npm run build:deploy:client`; upload only that package into the site root, preserving remote `api/` and private server storage. Shared Panel regression coverage includes both surface and plain variants.

## Met Office calendar warnings

Home reads the authenticated `GET /weather-warnings` endpoint through the shared Redux API. It refreshes every five minutes while Home is focused, reuses the existing saved town and invalidates with profile preferences. No API key or new user setting is required. Switching weather off (no saved town) also disables location-based warnings; only UK locations are supported.

The horizontal calendar shows a compact severity-coloured warning button on each affected UK date. Expired warnings disappear using the shared clock. The lazy detail view uses the existing exclusive Accordion and shared Modal; `scrollable` gives the Modal a fixed header and independently scrolling body, also reused by food alerts. Yellow/amber/red semantics are Nimbus tokens, independent of personal accent colours. Warning times use Europe/London, including BST/GMT; the unmodified original RSS summary is labelled as UTC.

Matching uses the saved town/county names against the provider's named council areas, not geographic polygons. The dialog states this limitation and links to the official map/advice. A missing badge is not an all-clear. Ready feeds with no matches stay quiet; failed or old feeds show an unavailable message, with saved notices marked delayed for up to 15 minutes. The 4–360-day calendar range does not extend the provider's published warning horizon.

Deploy both client and API packages together for this feature. There is no schema migration or family-data import. Build and local desktop/mobile browser checks passed; the existing Home navigation test mock was updated for the added query. The automated suite was not run for this implementation request.

Food and weather warning dialogs share `components/ui/AlertBriefing.tsx` and its colocated CSS: `AlertSource` renders the provider/header link; `AlertSummary` renders the icon, severity/type, metadata, headline and preview. Both accordions use the shared briefing row/open-state recipe with the same responsive breakpoint. Feature bodies retain their own product or validity/coverage content while following the same typography and panel spacing. Do not introduce separate source/summary styles for future alert providers.

## Split glance calendar tile contract

`components/family/home/CalendarDayTile.tsx` is the reusable, API-independent presentation component, with colocated CSS. The parent supplies `date`, `calendarHref`, `isToday`, optional `monthLabel`/`holidayTitle`, read-only plan summaries, `plansUnavailable`, a `forecast` React slot and a read-only `indicators` array. WeekPlanner owns queries, recurrence/date projection and provider adapters. The tile never fetches or mutates saved data.

`components/ui/IndicatorStrip.tsx` owns service-group presentation, sorting, the three-visible limit, the remaining-group count, shared scrollable Modal and exclusive Accordion. Each `CalendarIndicator` has a unique stable id, label/optional compact label, accessible label, source description, icon, semantic tone, adapter-assigned priority and lazy detail renderer. Counts represent hidden service groups, not the number of notices within one provider. Weather warnings, FSA food alerts and bank holidays adapt existing real data; no transport/air-quality examples are added to the app. When only two groups are relevant, More is intentionally absent. Adding a future provider means supplying another adapter/model item; tile markup and height do not change.

Shared Nimbus tokens define tile width (maximum 280px), height (196px), header/footer and spacing. The scroll container constrains card width to its available inner viewport, including on smaller phones. Compact internal type and provider labels keep content inside the fixed height. Navigation keeps full event text in accessible names/tooltips; displayed titles use bounded lines, with a count for additional plans. Forecasts beyond the published horizon say No forecast yet. Keyboard focus, reduced motion, month boundaries, weekend stripes and per-provider detail content remain available. The old absolute food-alert positioning styles were removed.

Local desktop/mobile visual checks and production TypeScript/Vite build passed. All 12 real-data tiles measured about 196px high, with no tile/page overflow; a complete card fits within the scroller at approximately 347px and 284px CSS viewports. Existing food and weather detail dialogs open and close correctly. The new overflow control is implemented for additional groups; current real Home data has two relevant groups, so its multi-group runtime path was not exercised with invented data. The previous HTML five/eight-group preview remains design evidence, not a React regression result. One existing FSA label assertion was maintained; no automated tests were added or run for this implementation request.

## Review and release verification — 23 October 2026

Reviewed the accumulated Met Office warnings and Split glance work for shared responsibilities, simple props and Nimbus consistency. The tile is presentation-only; WeekPlanner and provider adapters prepare data; IndicatorStrip owns the three-visible/More behaviour. Fixed closed More sections mounting provider details by adding an opt-in lazy mode to the shared Accordion. Area alias normalisation now trims punctuation before comparing Greater London.

Verification: all 116 client tests in 28 files pass, including new eight-group ordering/overflow, exclusive lazy content, removal while open, expiry/staleness and BST/GMT tests. Existing Home assertions now check the accepted Split glance markup. Prettier and whitespace checks pass. API isolated checks: 14 weather-warning, 7 public-feed and 34 FSA checks pass, without network/database writes. Warning fixtures cover UTC, UK midnight boundaries, New Year rollover, malformed dates, interval bounds, unsafe hosts/XML and response size. Real local Gary/Dad desktop/mobile checks confirm the shared dialogs and complete fixed-height mobile tiles. Build the API package first and upload its runtime dependencies before index.php; then upload client assets before index.html. No migration, account/content import or configuration/photo replacement is required.

### Calendar typography refinement

Date numerals use the shared `--calendar-tile-date-size` (40px) and compact (36px) tokens at weight700, aligned with the weekday/Today/Weekend stack. Actual plan titles use13px/weight600; empty and unavailable labels retain their original11px styling. Multiple-plan titles clamp to one line above the count so the196px card height remains fixed. Full titles remain in navigation labels/tooltips.

Release verification:116 client tests pass; formatting and whitespace checks pass. Local Gary/Dad desktop, phone and small-phone checks confirm no page/tile overflow or forecast overlap. This is a client-only change; no API, database or production configuration update is required.

## Personal TfL travel indicators (local implementation)

Choose Tube, Overground, DLR and Elizabeth line services in **Profile → Your travel**. Choices save to the signed-in account and follow it across devices; all lines unselected means off. Preferences use version checks, existing draft protection/CSRF/write transport, Redux cache invalidation and the authentication-generation reset. Admin activity records the actor and before/after line names. The existing profile activity/chart label now says Profiles and preferences.

Home passes a prepared travel view into the existing CalendarIndicator adapter. Today shows current disruptions; future tiles use only dated provider-classified PlannedWork intervals. UK dates and exclusive end boundaries are respected, including overnight works and BST/GMT. Three service groups stay visible; additional groups use More. Tile dimensions remain unchanged. Details lazy-load into the shared Modal/Accordion/AlertBriefing with official status, advice, validity and TfL source link. Suspense is scoped to each detail body so loading another provider does not hide its accordion heading or lose keyboard focus. Shared UK time formatting also remains in use by weather warnings.

The PHP API fetches the same fixed 19-line network for everyone without sending personal line choices/towns to TfL. Current status is shared-cache refreshed after30seconds (maximum90second saved fallback); published planned works cover the next30days, refresh after30minutes and expire from cache after1hour. Client polling is30seconds while focused. Expired/too-old notices are hidden, delayed/unavailable updates are labelled, and no missing badge is presented as an all-clear. The common provider backoff remains5minutes after failure. Anonymous API access is denied. No API key is currently needed; if TfL changes anonymous access, the UI fails visibly rather than pretending service is normal.

Release requires **both API and client plus additive migration017_travel_preferences.sql** through the existing backed-up database-release workflow. Do not run the local migration command against production or copy a development database. This table adds account preferences only and does not replace existing family data. Local backup and migration completed; production is unchanged. Deployment packages are not rebuilt/uploaded for this implementation request.

Verification:122 client tests,36 isolated API regression tests and19 standalone TfL parser/validation checks pass. Client production build, Prettier and whitespace checks pass. Internal-browser QA under local Gary/Dad covers refresh persistence, keyboard selection, draft retention, live Central delays, future Circle planned closures, More/focus restoration, mobile dialogs and196px tiles at phone/small-phone widths. All360 cards retain height with no overflow. Temporary line selections were returned to off; ordinary local preference audit history is retained. Other-user isolation/security are verified only in the disposable automated test database, which is cleaned by the harness.

The travel selector includes a keyboard-accessible Select all lines checkbox: off selects every available line, on clears them, and a minus mark indicates a partial selection. Bulk changes remain a draft until Save travel choices is pressed and are disabled during an in-flight save.

### Official travel line colours

Travel dialog headings use the reusable TravelLineLabel component, with colocated styling and shared src/styles/travel-tokens.css provider tokens. All 19 supported line IDs map to TfL Colour Standard issue 11 (August 2026), sections 3, 5 and 6: https://content.tfl.gov.uk/tfl-colour-standard.pdf. Values are the published screen RGB colours, including Elizabeth #60399e from the current standard rather than the older design idiom. Line identity is independent of personal accents and warning severity. Labels use white or black text selected for contrast (minimum 4.68:1 across the palette), with a subtle outline so Northern remains distinguishable on navy. Unknown line IDs fall back to readable Nimbus styling. Shared AlertSummary accepts ReactNode headlines so provider identity remains reusable without duplicating the accordion layout.

Local internal-browser appearance inspected under Gary/Dad at desktop and phone widths. No account preferences or data were changed. No automated tests/build rerun for this styling request; no commit or deployment performed.

TravelLineIcon now shares the same line-ID colour mapping and contrast-safe foreground as TravelLineLabel. AlertSummary has an optional mark slot for provider-specific icons; default alert icons remain unchanged. Travel disruption status retains its semantic colour. Local desktop dialog appearance inspected; no automated tests rerun for this small styling follow-up.

### Shared provider dialog content styling

Expanded travel and weather details now use the same AlertBriefing body, heading, paragraph, validity-panel, time-value, note and source-link classes. Travel inherits the established weather detail typography and accent panel rather than maintaining separate CSS. Food, weather and travel share status/footer spacing and divider styling. Existing Modal, Accordion, source headers, provider line colours and single-open behaviour remain in use. Inspected local Gary/Dad expanded travel dialog at desktop and phone widths. No automated tests/build rerun for this styling request.

### Travel status-board redesign

Following visual research of Sandra Shinto's Transit, simplified (https://dribbble.com/shots/27676327-Transit-simplified) and Minimal Slides' railway dashboard (https://dribbble.com/shots/27316768-Modern-Dashboard-For-Railway-Operations), travel notices now use compact line/status rows with progressive disclosure. These are layout references, not copied assets or a replacement design system. TravelNoticeSummary and TravelNoticeDetails are colocated with TravelNotice.css; shared Modal, Accordion, official line identities, Nimbus tokens and shared source/footer remain in use. Collapsed previews clamp to two lines and disappear when expanded, so the full official narrative appears only once. Published validity uses a compact From/Until strip, with UK-local-time and recovery-time caveats retained. Real unique affected-line and notice counts appear under the source name. Mobile stacks content and desktop places status beside the line. Existing weather/food dialogs are not restyled by this travel-specific redesign.

Local Gary/Dad desktop and phone appearance inspected; no account data changed. Formatting/whitespace checks completed; automated tests/build not rerun for this design request. No commit or deployment performed.

Home now labels the indicator TfL (with its existing affected-line count), uses Transport for London in source/tooltips and dialog titles, and names TfL in unavailable messages/profile navigation. This distinguishes the feed from generic travel; it still includes selected Tube, Overground, DLR and Elizabeth services.

### Selected expanded layout: Timeline brief

The app now uses the chosen Timeline brief inside each travel accordion. Service information, separate advice and published validity form a reading sequence, not a fabricated incident history. The rail and markers inherit the official line colour through the same central line-ID mapping as labels/icons; they do not follow the personal accent. Neutral contrast outlines keep Northern black and other dark lines visible against navy.

Only existing API fields are displayed: description (TfL reason/disruption description), advice (disruption.additionalInfo), startsAt and endsAt. No suggestions, route alternatives, recovery estimates or incident milestones are generated. Empty descriptions/advice are explicitly labelled as not supplied. From and Until are rendered independently, with missing values labelled Not supplied by TfL. Shared UK date/time formatters retain BST/GMT and the provider validity caveat. Feed timestamps/source links remain in the shared footer.

Real local Central line data visually inspected under Gary/Dad on desktop and phone; source mapping reviewed in API src/travel.php. Formatting/whitespace checked. No automated tests/build rerun for this implementation request; no API/database change, commit or deployment.

### TfL final QA under local Gary/Dad

Internal-browser walkthrough verified saved line choices on phone, refresh persistence, Select all/mixed/clear states, correct completed-save cursor, unsaved-draft Keep editing protection, Home filtering to the saved subset, switching all indicators off, and exact restoration of Gary's original 19 selected lines. Real current Central/Northern notices and future Circle engineering works verified. Enter/Space expansion, one-open accordion, Escape and focus return passed. Rails/icons matched Central red, Northern black and Circle yellow independently of Gary's pink personal accent. Phone/page/dialog widths showed no horizontal overflow. Published Circle dates correctly span 24 Oct BST to 26 Oct GMT, and actual feed freshness/source links remain visible. No current browser errors observed.

Fixed two issues found: browser GMT+0 spelling now normalises to GMT in shared UK time formatters; admin empty previous TfL selection now reads Switched off rather than blank. Added regression coverage for verbatim notice text, missing advice/date fields, independently available dates, UK clock change, browser zone spelling, Select all mixed states and empty preference audit values.

Final results: 130 client tests across 33 files pass; 36 API tests across 9 suites pass in the disposable database, which the harness cleaned; 19 standalone TfL parser checks pass. Production client build, full format check and whitespace check pass. QA logs/screenshots are in the workspace work/tfl-expanded-designs folder. No family content/test users were created. The three local preference-save audit records are retained as genuine history; Gary's original selection is restored. No production changes, commit, push or deployment performed.

Calendar day cards with known saved plans again receive a subtle accent-derived background via the shared --color-calendar-planned-surface token (8% personal accent over muted surface). Root has-plans is set only when plans are available and non-empty. Weekend stripes and today's border remain separate. Card dimensions are unchanged. Local comparison of empty today versus saved weekend plans visually inspected; no tests/build rerun for this small styling request.

## TfL/calendar release verification - 23 October 2026

Final pre-release verification:131 client tests across34 files,36 isolated feature API tests,30 authentication checks,56 database-release safeguards and19 TfL parser checks pass. Includes regression coverage for planned-day background state with empty/unavailable data. Shared Nimbus tint preserves weekend stripes and fixed calendar height. Production deployment requires additive migration017 after a fresh private backup and verified scratch restore/rehearsal; then upload the API runtime followed by the client assets/entry point. Existing family accounts/content/configuration/photos must be preserved.

## TfL production release completed - 23 October 2026

Runtime commits: client8de6dc0 and API034e7be, both pushed to origin/main. Final checks passed:131 client tests/34 files,36 isolated API regressions,30 authentication checks,56 database-release safeguard checks and19 TfL parser checks. Client and API packages were built separately with build:deploy:client and build:deploy:api; their previous staging folders were backed up automatically.

Production migration017 was applied through the documented cPanel/phpMyAdmin workflow after enabling the private maintenance marker, downloading fresh database/home backups, validating both archives, restoring the database into the separate unprivileged theallinfamilyco_family_tfl_restore database, comparing every original row and schema, and rehearsing the additive migration there. All15 original tables matched before migration. Live then received only the new preferences table and017 ledger row; preservation comparisons passed after migration and after live smoke checks. Runtime API.env is byte-for-byte unchanged. No development database/accounts/content were uploaded.

FileZilla uploaded24 API source files, then API index.php, then106 client assets and index.html last. Queue empty; failed-transfer tab had no failures. Unchanged routing/example configuration files were preserved. All27 API package files matched a private downloaded server archive; all107 public client files matched their package SHA256. Maintenance marker was renamed after verification and health returned200.

Live Gary/Dad desktop/phone checks passed: temporary Central/Circle/Northern selection saved after refresh, live/planned timelines and official red/yellow/black colours, BST/GMT, keyboard single-open/escape/focus return, correct admin before/after and no overflow/errors. Real Gym Closed/Gym Opens/birthday cards retain196px height and regain subtle planned-day tint. Temporary live selections were returned to off (the original live default), with two genuine preference audit records retained. Each family member enables TfL by choosing lines in Profile. Runtime packages and family content remain unchanged by this documentation update. Private recovery copies and non-secret evidence paths are documented in API README and shared memory.md.

### Personal Studio profile

Profile uses the selected Personal Studio layout with an account identity rail and four URL-addressable tabs: About you (`?view=identity`), Appearance (`?view=appearance`, the default), Week Ahead (`?view=weather`) and TfL lines (`?view=travel`). The shared router draft blocker protects view changes before an active editor unmounts.

`components/ui/Tabs` owns keyboard focus and tab/tabpanel accessibility. ProfileIdentity, ProfileAppearance and ProfileSection keep their styles alongside their components. `styles/preference-patterns.css` supplies shared settings fieldsets. Existing profile/week/travel query services retain their save and conflict handling. TfL choice swatches reuse the same official-colour mapping as disruption notices. Only the selected tab's content mounts.

Personal Studio release review (23 October 2026): reviewed tab lifecycle, keyboard/ARIA relationships, shared draft blocking, per-user preference services, official TfL colour reuse and mobile layouts. No blocking findings. Production TypeScript/Vite client build completed successfully. No database migration or API package is required.

Live Profile QA (23 October 2026): all four tabs checked under Gary/Dad, including mobile. Nickname, accent, Week Ahead and TfL saves persisted after refresh; Keep editing preserved drafts, Discard completed a tab change, and route navigation was blocked for unfinished searches. Manual keyboard tab navigation worked. Restored Dad, Green, Guildford/England and Wales and TfL off. All 131 client regression tests passed; both focused TfL tests passed after the small mobile-summary spacing fix. The TfL summary now gives Select all its own row on narrow screens.

## My Space and Widget Shelf

`/my-space` uses the approved Widget Shelf layout inside the existing family application shell. Desktop access is in the sidebar; mobile access is in the avatar/account menu so the bottom navigation is unchanged. The shared Tabs, ContentSurface, HorizontalScroll, Modal, draft protection, RTK Query write lifecycle and 20-second Undo are reused.

- Widget Library currently offers Dinner Spinner. Other catalogue entries are explicitly planned, not functional.
- Add to my space creates a separate owner-controlled instance. Each owner can keep up to 30 instances, with 2–12 distinct meals per spinner. New instances default to Just me.
- Family visibility lets everyone spin the same instance and see its latest pick/history. Only the owner edits meals, renames, changes visibility or removes the widget. A recipient can hide/show a shared instance without changing it for anyone else.
- Trial picks are selected and committed by the API before animation, with idempotent retries. Trials belong only to the person spinning, including on family installations. A trial does not replace a published family suggestion. See the publication workflow below.
- Widget and saved-meal removal use the central 20-second Undo queue and version checks. Removing unsaved draft rows is immediate. Save an additional meal before removing one of the final two saved choices.
- Admin activity and insights include widget usage metadata, without private widget names, meals or results. Session caches and widget UI state clear on account changes/sign-out.

Requires API migration `018_widgets.sql`, applied locally with `php bin/migrate.php --local` from the API repository. A live release needs both client and API packages plus the established backed-up database-release process. Do not deploy this client feature against an API/database without that migration.

Implementation compilation: TypeScript/Vite build and PHP syntax checks. Full interactive persistence/permissions/concurrency/Undo QA and regression tests are not claimed in this implementation turn; no example spinner or meal data was inserted into Gary's account.

### Widget discovery labels
The main area is now labelled **Widgets**, with **Widget Library** shown first by default for everyone, **My widgets** for the current user's own saved instances, and **Family widgets** for family-visible setups. An owner's shared instance appears in both My widgets and Family widgets. The existing `/my-space` route is retained. These labels supersede the earlier My Space wording above; ownership/privacy and API permissions are unchanged.

### Personal trials and published family dinners

The current Dinner Spinner workflow supersedes the original immediate shared-pick behaviour:

1. Install a widget for **Personal** or **Family**. Each installation has its own meals; the owner manages them.
2. Every user can spin a family installation privately as often as desired. The API returns only the signed-in actor's trials, including to the installation owner and admins. The last 10 are available privately.
3. On a family installation, choose **Publish this pick**, review the dinner date and confirm. A personal installation must be changed to Family in Widget settings before publication is available.
4. The family sees an immutable published suggestion with meal, date, publisher nickname and publication time. **Family widgets** puts an existing published suggestion before the private spinner for quick access.
5. Every active family member, including the publisher, can choose **Happy with that**, **Suggest another**, or clear their own response. The UI shows names and unanswered replies. Silence is never agreement.
6. Further private trials leave the published suggestion and its replies untouched. Publishing a replacement is explicit; the previous suggestion and its responses remain in history. The UI shows the latest 10 publications, including the current one; older records stay in the database.

Publication uses version checks, the expected previous publication ID and a UUID retry key. Only the actor's own saved trial can be published, and its meal must still exist unchanged. Conflicting publication/response writes refresh the current state for review. Retried publication is not duplicated. Responses belong to a specific publication; an outdated response cannot be attached to its replacement.

Requires both migrations 018_widgets.sql and 019_dinner_publications.sql before release. Changes remain local/uncommitted; production database unchanged. TypeScript/Vite build and PHP syntax checks passed; no automated regression or end-to-end functional QA was run in this implementation turn. Only library/installation-dialog visual inspection was performed, including phone fit. No generated installations, trial spins, publications or responses were saved to Gary's account.

### Dinner wheel presentation
The main spinner now uses the full panel width, capped by the shared --dinner-wheel-size token (34rem). Meal names appear radially inside the wheel rather than as numbered segments; the current twelve-meal example fits with up to two lines per name. Very long names can abbreviate, with full names retained in the segment title/menu. The compact Widget Library illustration remains small. This supersedes the temporary numbered-wheel presentation.

Wheel label refinement: meal names now use smaller, single-line radial text. Long names fit the available segment length after font loading, instead of wrapping or replacing names with numbers. The earlier two-line presentation is superseded.

### Published dinners on Home
Home includes a compact read-only summary of each visible family Dinner Spinner’s latest published suggestion for today or a future date. It shows the meal, dinner date, publisher and actual active-family response counts. Links open the exact installation in Family widgets for replies; private trials and personal installations are excluded. Past dinners and hidden/queued-for-removal installations are omitted. The existing account-scoped Widgets query supplies the data and visible-route background refresh; no API or migration changes are needed.


Dinner Spinner regression checks: run `npm run test:widgets` from the client. This covers dashboard publication visibility/counts/links and database-backed privacy, shared spins, publication retries, responses and stale replacements. API checks create and destroy the isolated regression database using the established test harness; they do not use family accounts or live data.

### Multiple daily meals and the seven-day diary
Dinner Spinner publications now have a date and a Breakfast/Lunch/Dinner/Other slot. Spin privately as often as needed and publish separately for lunch and dinner; publishing replaces only the selected slot on that date. The publication dialog opens the saved meal in Family widgets after success. The published-meal picker and deep links select the exact date/slot result.

A published choice stands when there are no replies (“Chosen by default”); responses are optional and never fabricated. “Suggest another” flags review. The shared meal-diary helper keeps status/count/slot logic consistent between Home, the result panel and a reusable MealDiary component. Home shows up to four upcoming choices and an expandable rolling seven-day diary, preserving the calendar and general app shell. The diary distinguishes chosen meals from meals explicitly marked eaten, and keeps older records in the database. Mark as eaten / correct eaten record is available in the source widget, with actor/time and admin auditing. All writes use the existing Redux/RTK Query service and version safeguards.

Requires API migration 020_meal_diary.sql (applied locally only). Existing family dinner data is retained. TypeScript and PHP syntax checks passed for this extension; the prior QA results preceded these new meal-slot/diary changes and do not constitute a full regression pass for the extension.

### Meal-slot and diary QA (24 October 2026)
The extended npm run test:widgets command now runs 12 client checks and 7 database-backed checks (19 total), all passed. Coverage includes separate lunch/dinner/date publications, deep-link selection, default choices without inferred votes, a seven-calendar-day window across the October clock change, all 14 lunch/dinner slots despite the old ten-row snapshot cap, completed-meal controls, eaten actor/time persistence, corrections, retries, stale writes and protection of future/eaten meals. API fixtures are isolated and cleaned automatically. Production build and TypeScript passed.

Internal-browser walkthrough used Gary/Dad with a temporary family installation “QA Lunch and Dinner”: lunch QA Soup and dinner QA Pasta published separately, survived refresh, lunch marked eaten and corrected with both states surviving refresh, dinner remained unchanged, Home/diary reflected exact totals. Mobile viewport 390 had no page overflow; desktop viewport restored. Temporary installation removed through shared 20-second Undo flow; original family dinner/content untouched.

QA fixes: repeated eaten writes now return the already-saved state without changing actor/time instead of reporting a false version conflict. Both response buttons lock when a meal is eaten; correction restores them. Completed results use diary wording rather than inviting replies. Diary disclosure now has a visible chevron. Dashboard tests distinguish the result links from matching diary links.

### Widget hardening and the shared milestone
See docs/widget-qa.md for product rules, the input/error/concurrency/privacy coverage matrix and repeatable commands. Latest review passed 168 client tests and 16 database-backed widget tests. Client/API validators normalize invisible separators and spaces, reject control-only/oversized data and duplicate Unicode names, and keep valid emoji/punctuation as plain text. Publishing is limited to the rolling past week through the next year. Saves and reads have a 15-second deadline; an uncertain save preserves its retry key and offers a check-before-retry path. Offline views explain why saving/spinning is unavailable.

Home’s expanded seven-day diary includes a small shared three-day milestone: each date with a recorded eaten meal counts once. Repeated spins, votes, duplicate installations and multiple meals on the same day do not add progress. No leaderboard, separate points store or additional required step was added. The main flow remains spin privately, publish, optionally reply, then record eaten.

Migration 021_spin_meal_versions.sql (local only) records the exact meal revision used by new trial spins, preventing a rename-away-and-back from reviving a stale pick. Existing matching legacy picks are backfilled with the current revision because their original revision was not stored. Missing widget/result links now require explicit recovery instead of silently opening a different result. No visual redesign or deployment was performed in this pass.

### Dinner Spinner — Wheel & Table UI (24 October 2026)

Scoped independent review is complete: Reviewee's follow-up marks DS-001 (London
calendar consistency), DS-002 (retained Personal diary links) and DS-003 (API fixture
date) resolved by source inspection. This is not a fresh runtime regression pass;
tests/browser/database checks were not performed in the review/repair cycle.
Commit, push and release preparation are now authorised. Production upload and
migrations 018–021 remain separate release steps; do not copy local family data.

Widget date rules use the API's Europe/London calendar for the publication default/range,
seven-day diary, upcoming choices, Today/Tomorrow labels and eaten availability, regardless
of the viewer's timezone. Calendar-key arithmetic and labels avoid viewer-zone/DST shifts.
An open publish dialog refreshes its bounds from the shared clock while retaining the selected
date and draft. Retained choices on a now-personal installation link to My widgets; current
family installations link to Family widgets, preserving the exact result and permissions.

Implemented the approved option 1 from the isolated design review. The private wheel and published family result now sit side by side when the shared content container has enough width; on mobile the wheel comes first. The existing shared MealDiary gains a board layout below both panels, with today first, full meal-slot/status links and the shared HorizontalScroll for contained phone scrolling. Home keeps its existing list diary and shared milestone.

Meal names are available in a small WidgetMeals component using the shared Modal. Family response details, ownership/settings and private trial history are secondary disclosures; the duplicate shelf install tile is removed because the page action already opens the library. Existing meal links scroll to the requested published result while ordinary visits lead with the wheel. Styles remain colocated and use Nimbus tokens and each user's accent. The wheel's shared size token is now 28rem and still constrained by available width.

TypeScript/Vite production build passed. Visually reviewed locally as Gary/Dad at desktop and phone widths, including the meal modal, response disclosure, diary and direct meal link. Fixed a diary min-content sizing overflow; final page widths fit their viewport (desktop 1338px, phone 347 CSS px). No automated tests run in this UI implementation turn, no new saved family records, no API/migration changes, no commit/push/deployment. Evidence: workspace work/dinner-spinner-designs/evidence/implemented-wheel-table-desktop.png.
