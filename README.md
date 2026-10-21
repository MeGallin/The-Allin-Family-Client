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

The signed-in app has lazy routes for Home, Calendar, Memories, Lists and
Administration and Your profile, with a useful not-found page. Desktop navigation becomes a
labelled bottom navigation on phones. Administration currently provides a role
guard, family nickname editing and placeholder information; other account tools and statistics are future work.

Members can choose a nickname under the account menu's Your profile link. Admins
can change nicknames for active family accounts under Administration. Nicknames
appear throughout family greetings, the account menu, shopping attribution/history
and preview photo credits; without one, the first name is used. Full names are
retained for account administration. Blank clears a nickname, and duplicate names
are allowed because attribution uses account IDs. Forms preserve failed drafts and
require review if someone else edited the same profile. Successful changes refresh
profile/shopping data. Other signed-in sessions pick up changes on focus or the
15-second profile refresh. Profile changes are audited by the PHP API.

Shopping is stored in the PHP/MySQL API and shared by all signed-in family members.
Items appear newest first, including immediately after adding and after refresh.
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

Plans, photo previews, reactions and polls remain clearly labelled sample features
in React state and reset on refresh or sign-out. Photos use local object URLs and
are not uploaded. Their shared persistence and attribution are future work.

- `src/app`: router and signed-in application composition.
- `src/pages`: lazy route views with colocated styles.
- `src/components`: reusable UI, layout, auth and family components with their CSS.
- `src/app/store.ts`: Redux Toolkit store and RTK Query middleware/listeners.
- `src/app/store-hooks.ts`: typed Redux hooks; `session-actions.ts` clears private state.
- `src/features/auth`: public signed-in profile slice.
- `src/components/profile`: reusable nickname form with colocated styles.
- `src/components/admin`: family nickname administration with colocated styles.
- `src/pages/profile`: lazy profile page with colocated styles.
- `src/features/family`: preview data, navigation, family slice and selectors/actions.
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

Only the public account profile belongs in Redux. Passwords, session cookies,
CSRF tokens, File objects and browser resources are excluded. Photo previews put
serializable URL strings in Redux and release the underlying object URLs separately.
Sign-out/session expiry aborts pending requests and clears private caches, feature
data and feedback. A session generation guard prevents late write responses from
repopulating another session. Redux is not persisted to browser storage; the API
database remains the source of truth for shopping. DevTools are enabled in development.

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
