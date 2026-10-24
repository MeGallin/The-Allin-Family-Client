# Personal Sudoku v1

## Product and persistence

Sudoku is a personal, one-installation-per-user tool at
`/my-space?view=widgets&tool=sudoku`. Store metadata only exposes installation
availability; board content is not part of a family snapshot. My widgets mounts
the game through the existing shelf, while Family widgets never adds a Sudoku
entry. Existing Dinner/Shopping/Polls data sources remain unchanged.

Save is explicit. Entries, pencil masks and paused state are stored; Undo/Redo is
bounded to 100 local changes and resets on refresh. A dirty/busy game registers
with shared draft protection. Wrong/incomplete entries may be saved, and visible
conflicts do not get silently corrected. A full board is marked complete only
when all row/column/box constraints hold. Pause hides the board, without a timer.

New/restart explicitly confirm replacement/reset. Removal is queued through the
existing shared 20-second Undo service. Soft removal retains the current row and
lifecycle audit; reinstall reuses the singleton with a higher version and a new
puzzle. Playable old games are not archived. No scores, rankings or other game
statistics are introduced.

## Puzzle method

Original server implementation in API `src/sudoku-puzzles.php`: permute digits,
rows within bands/bands, and columns within stacks/stacks of a valid solved pattern.
For each candidate clue removal, count solutions with minimum-remaining-value
backtracking and row/column/box masks; stop at two. Keep the removal only when the
count is exactly one. The entire generation call has a 100,000-search-node budget,
3.5-second deadline and at most three attempts. A budget/deadline/target failure
returns an error before changing any existing game.

Targets are Easy 42, Medium 36 and Hard 30 givens. These describe clue density,
not a verified human-solving rating. No external puzzle dataset/artwork/library is
used. Algorithm principles: [Norvig Sudoku](https://www.norvig.com/sudoku.html).
Keyboard grid principles: [WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).
No source prose or vendor UI is copied.

## API contract

- Authenticated `GET /sudoku` returns `{ownerId, installationVersion, game}`.
- CSRF-protected POST `/sudoku/install`, `/save`, `/new`, `/restart`, `/remove`.
- Session identity is the only owner selector; no admin/family override.
- Install takes the last observed installation version (0 before any install).
  Other writes take exact installation ID and monotonic version. Reinstall does
  not reset the version, so a delayed old write cannot resurrect an old game.
- Every write carries a UUID retry key. The server remembers its last key/body
  hash, accepts its exact replay, rejects changed payload reuse and applies version
  checks before/under lock. An older retry after a newer change conflicts rather
  than repeating its old operation.
- Save takes 81 ASCII digits, 81 integer note masks 0–511, and a boolean pause.
  Givens cannot change; filled/given cells cannot carry notes. User errors are
  permitted. Completion is computed server-side.
- RTK Query is account-keyed on the existing shared cache; state is cleared on
  account/session reset. Personal Workspace/Install is also keyed by account.
- Conflict/error preserves local edits; Reload requires explicit discard. Unknown
  save outcome keeps the same action payload/key for a retry until the user changes
  their intent or explicitly loads latest.
- Admin activity logs only install/new/restart/completed/removed metadata with
  actor/time/type/level/version. Regular cell saves do not create per-key audit
  entries. Board, givens, notes and game payloads are never recorded there.

## UI and accessibility

One grid Tab stop, arrow navigation, row Home/End and Ctrl/Cmd+Home/End. Digits,
Delete/Backspace/0, P, Ctrl/Cmd+Z / Shift+Z / Y and Ctrl/Cmd+S act inside the grid.
Fixed clues are bold and immutable. Mobile keypad uses normal shared touch targets;
the nine-column board necessarily uses smaller spatial cells. Cell labels expose
row/column/value/given/notes/conflict. Busy cells retain keyboard focus using
aria-disabled and blocked edits. Shared Modal, draft protection and removal UI
are reused. Nimbus tokens and the current user accent style the game.

## Local migration and eventual release

`022_sudoku.sql` is additive: only `user_sudoku` is created. Expected local instance
was verified as APP_ENV local / 127.0.0.1 / 3307 / theallinfamily. A full ignored
backup was retained before DDL; migration 022 was the only pending file. Existing
23 table row counts stayed unchanged except ledger +1. New game rows remained 0.

This is not a production release. Later release order: maintenance/fresh verified
backup and rehearsal; apply reviewed 022 and ledger through the established private
database-release workflow; verify existing data/schema and runtime CRUD grants for
new table; deploy matching API modules/front controller; deploy client last. Do not
upload `.local`, migration tools or backup files into public runtime packages.
No old migration is edited and no family rows need a backfill.

## Verification status

Implementation source was independently reviewed. Subsequent authorised QA adds
repeatable client board/helper/Redux/cache/removal tests and a disposable API suite.
Run the client with `npx vitest run --maxWorkers=1`. Run the focused API suite from
the API root with `node --test tests/sudoku.test.mjs`; its guarded local harness
creates a unique test database/account, uses synthetic users, and cleans them up.
It does not connect to the application's development database or use family users.

API coverage independently counts solutions for two generated puzzles per level,
checks typed immutable clues/notes/completion, session/CSRF/owner isolation,
metadata-only audit, exact retry/stale writes, two-process competing saves and
remove/reinstall revision safety. Pure checks force solver node/deadline exhaustion;
the HTTP generator's 503 path is not deterministically forced. Client tests use
mocked transport/controllers; browser gameplay complements them.

Parent completed local owner-account gameplay through installation, all levels,
pencil/Undo/Redo, saved refresh, keyboard/mobile, pause, guarded navigation,
new/restart, completion and normal delayed removal/Undo. A stale success message
after editing and an already-saved completion prompt were fixed with regressions.
Cleanup completed: no active Sudoku installation remained; soft row/audit retained.
No production deployment or broad cross-browser certification is claimed. Exact
commands/results and independent review are in the workspace Sudoku QA handoff.

Final authorised run: client 203/203 tests in 48/ 48 files with one worker (202.95s);
focused Sudoku coverage17 cases; isolated API 10/10 (7.56s). Final TypeScript/Vite
build passed (3,172 modules; Vite 2.86s), alongside PHP syntax/scoped formatting.
