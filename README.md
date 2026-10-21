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

## Accounts

The client now includes sign-in, mandatory first-login password change, a protected
family starting page, password change and sign-out. Accounts are created by the
administrator through PHP CLI commands. There is no public registration screen
or endpoint. Calendar, list and photo features have not been implemented yet.

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
Git metadata or .env. Future page routing rules will be added with those pages.

Repository: https://github.com/MeGallin/The-Allin-Family-Client
