# Regression tests

Run commands from the client directory. Node must meet the installed Vite/Vitest requirements (Node 22.12 or newer; use a supported release). Install the locked dependencies with `npm ci`.

```powershell
npm test                  # React/Redux and transport tests; no running server/database needed
npm run test:watch        # Re-run affected client tests while developing
npm run test:api          # New isolated real PHP/MySQL feature regression
npm run test:auth         # Existing isolated authentication/security regression
npm run test:database-release # Backup/restore, migration and maintenance safeguards
npm run test:all          # All four, stops on the first failing command
npm run test:deploy       # Separate disposable file-packaging regression checks
npm run build             # Type-check application, tests and configs; build production assets
npm run format:check
```

## Organisation

Client tests live beside the code they exercise (`*.test.ts` / `*.test.tsx`). `src/test/` contains only shared test fixtures/setup. `vitest.config.ts` uses jsdom, React Testing Library and the real Redux middleware. The application exports `createAppStore()` so each test owns a fresh store; the normal singleton and browser listener setup remain the application's entry point. Test dependencies and setup are not imported into production code.

The client setup blocks unmocked fetch calls, so a missing test mock cannot contact the family API. Modal methods are simulated because jsdom has no native dialog presentation. Timers are virtual: the real 20-second deletion policy is checked at 19,999ms and 20,000ms without waiting 20 real seconds per case. API persistence/security are tested against a real disposable database separately.

| Area                 | Repeatable checks                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Saving               | Shared success/busy/failure lifecycle; a real note form sends all fields through Redux/services, updates the correct owner cache and retains writing on failure; draft discard warning. API save/fresh-read checks cover shopping, calendar, notes, memories/photos and polls.                                                                                  |
| Privacy              | Sign-out aborts reads, clears Redux/private validators and cancels queued removals; old-session responses ignored. Server denies anonymous access and cross-owner note read/edit/delete, including admin and spoofed owner fields; private note content stays out of shared activity/Home data.                                                                 |
| Permissions          | Members rejected from admin reads and account mutations; creator/admin management rules for memories and polls; CSRF/origin/validation failures cannot write.                                                                                                                                                                                                   |
| Concurrent edits     | Real API competing writes share one version: one succeeds and one receives 409 across all five domains; stale deletes rejected; no-op saves preserve versions/ETags; competing ballot versions cannot overwrite a vote.                                                                                                                                         |
| Undo                 | All five real removal adapters use the shared 20-second boundary. Undo before sending prevents HTTP; duplicate scheduling, independent deadlines, busy saves, newer/missing records, account changes, failed responses and already-sending state are covered. Accessible countdown/progress/focus and omission of private body text from the queue are checked. |
| Collection rendering | Batch resets when returning to a previous filter; deep links reveal an older target without mounting the whole collection.                                                                                                                                                                                                                                      |

## Real API prerequisites and isolation

See `../api/tests/README.md` for the server setup and recovery procedure. Start the existing isolated local MariaDB on 127.0.0.1:3307 first. The API's local `.env` and ignored `.local/mysql-admin.ini` must already be configured; PHP needs pdo_mysql, Argon2id, fileinfo and GD for photo support. On Windows the default PHP path is C:/xampp/php/php.exe; elsewhere it is php. Override with `$env:PHP_BINARY` if necessary.

The runner starts its own loopback PHP server on a free port. It never sends requests to port8000 or the internal browser. Its generated owner/member/admin accounts exist only in `theallinfamily_regression_test`, with separate least-privilege DB credentials, sessions and image storage. It applies every migration to an empty schema, tests the production API routes and removes its database/account/photos/sessions on completion or an ordinary test failure. A second run or wrong cleanup token is refused. Family users, Gary's saved input and production/local family configuration are not modified.

The existing authentication suite uses its own `theallinfamily_auth_test` fixture, with the original setup/cleanup guards. Neither suite should be run against a production environment. Do not commit ignored credentials, session files, photos or fixture settings.

The database-release suite uses random `allin_release_test_<token>` databases and
random private fixture directories, plus `allin_restore_<token>` databases for
actual dump/restore verification. It opens only the isolated local server on3307;
its configuration guard rejects production. Tests cover explicit targets, plan and
historical checksums, ordered pending migrations, separate deployment credentials,
private database/photo/config/code backups, actual scratch restores, preservation
of existing fields/owners, successful CLI plan/apply/resume, concurrent locks,
later-statement SQL failures and failed backup/restore/process timeouts. Real HTTP
requests prove maintenance rejects health, sessions, background presence and feature
writes before DB access; an existing leased worker must finish before its saved
row appears in the backup. A drain timeout fails closed. Failed releases cannot
resume or rerun silently. Fixture databases/files are cleaned on ordinary failure.
See the API's [DATABASE-RELEASE.md](../api/DATABASE-RELEASE.md) for hosting prerequisites
and manual, explicitly authorised production recovery; tests never restore live.

## Boundaries

These are client DOM/Redux tests plus real HTTP/database integration tests. They are not an automated full-browser visual/accessibility audit, a load benchmark or a multiple-PHP-worker lock stress test. Competing edits use independent sessions and the same record revision on the local PHP server. Keep the Gary/Dad internal-browser mobile/desktop checks for native date/file inputs, browser refresh warnings and visual layout. Nothing in these tests changes the mobile-first Nimbus styles.

When adding a feature, extend its colocated client tests and the matching API regression module. Use a fresh record/request key within each scenario; do not assert hard-coded database IDs. Run `npm run test:all` and the build before accepting a change to save, privacy, permission or deletion behaviour.
