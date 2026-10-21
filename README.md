# The Allin Family - Client

React and TypeScript starter using Vite for theallinfamily.co.uk. The PHP API
has its own repository in the sibling `api` folder.

## Run locally

Use Node.js 22.18+ on the 22 release line, or another release supported by the
locked Vite version. From this repository in PowerShell:

```powershell
npm ci
# First checkout only. Keep an existing .env when updating the repository.
Copy-Item .env.example .env
npm run dev
```

Open `http://127.0.0.1:5173`. Start the API separately with `./serve.ps1` in the
API repository. The starter page checks the API and offers a retry if unavailable.
No accounts or family features are implemented yet.

## Environment

This repository has its own ignored `.env`, copied from the committed template.

- `VITE_APP_NAME`: display name.
- `VITE_API_BASE_URL`: browser-facing API URL, normally `/api` on the same origin.
- `API_PROXY_TARGET`: local PHP server address, normally `http://127.0.0.1:8000`.
  Used only by Vite's development server.

Restart Vite after changing environment settings. Variables prefixed `VITE_`
are public browser configuration and are bundled into production files. Never
put database credentials, passwords or private keys in them.

The development proxy forwards `/api/health` to the PHP server's `/health`.
Requests use the same browser origin, so no cross-origin access settings are
needed for this local setup.

## Build and deploy

```powershell
npm run build
```

This checks TypeScript and creates static files in `dist/`. Upload the contents
of `dist/` to Trilogy's website directory. The PHP API is deployed independently,
normally under `/api` on the same domain. Vite's development proxy is not included
in the production build; the deployed API must be reachable at the configured URL.

`npm run preview` previews a build; it does not provide the development API proxy.
Use `npm run dev` for the integrated local connection check.

The repository-root `.htaccess` prevents Apache from serving client source or
environment files through XAMPP. It is not part of `dist/`. Deploy the build
output, not this source directory or its `.env`. Routing rules for future pages
will be added when those pages exist.

Repository: https://github.com/MeGallin/The-Allin-Family-Client

