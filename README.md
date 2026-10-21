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
Administration, with a useful not-found page. Desktop navigation becomes a
labelled bottom navigation on phones. Administration currently provides a role
guard and placeholder information; account management and statistics are future work.

The family content is explicitly labelled as a preview. Plans, shopping changes,
photo previews, reactions and poll choices live in React state for this tab and
reset on refresh or sign-out. Photos use local object URLs and are not uploaded.
The PHP API currently supplies authentication and the protected family gate only;
shared persistence still needs API endpoints and database migrations.

- `src/app`: router and signed-in application composition.
- `src/pages`: lazy route views with colocated styles.
- `src/components`: reusable UI, layout, auth and family components with their CSS.
- `src/features/family`: typed preview data, navigation and shared state.
- `src/services`: shared HTTP client and feature API calls.
- `src/hooks`, `src/types`, `src/lib`: hooks, authentication types and small helpers.

Route and dialog bundles load on demand. Images reserve their dimensions;
gallery images load lazily while the featured memory loads eagerly. Native
dialogs provide keyboard focus handling and Escape dismissal. Loading, retry,
empty and error states use shared components. Motion respects reduced motion.

Run `npm run format` to format source or `npm run format:check` to check formatting.

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
