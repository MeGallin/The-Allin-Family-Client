# Nonograms

Personal Widget Library → Games → Nonograms, at `/my-space?view=widgets&tool=nonograms`.
One active 5×5 or 10×10 board per signed-in account. It is excluded from Family
widgets, Home family counts, shared cache revisions and admin content/activity.
No external service, dependencies, timer, score, streak or completion archive.

The six original server-bundled pictures have computed run clues. The focused API
suite independently enumerates every binary line, counts complete solutions with
column-prefix pruning and fully solves each puzzle by repeated line overlap and
elimination without guessing. This supports uniqueness and a concrete human-style
logical solving method, not a difficulty label. Three puzzles per size; started
puzzles are honestly labelled played and later selections explicitly say replay.

The Clue Rail board keeps mode above aligned clues. Fill, × and clear support one
Undo per tap, Redo and roving keyboard arrows/Home/End, Space, X and Delete. Touch
drag is deliberately omitted. Completion checks the filled pattern; empty squares
need not all be crossed. Check is non-mutating. Hint reveals one square, records
assistance monotonically through Undo, and is optional. Reset explicitly starts
that puzzle unassisted again. Next-size selection prepares a future board; only
confirmed New changes the active puzzle. Reset/New always confirm replacement.

Nimbus surfaces/tokens and a shared original coloured-grid motif appear in the
Store, personal Continue tile and workspace. 10×10 fit mode has compact targets
on narrow phones. Enlarge preserves Clue Rail and offers contained scrolling with
larger squares rather than promising 44px targets fit 320px. Cells expose text
state and complete row/column clues; focus remains on the board during saving.
Individual cell boundaries use the existing strong border token (3.594:1 against
the Nimbus cell surface) in both fit and enlarged modes.

## Persistence and recovery

Account-keyed Redux holds the active draft and bounded Undo/Redo history. The
small NonogramSync component remains mounted in the authenticated shell, debounces
700ms and continues saving if the workspace is unmounted by navigation. Dirty,
in-flight and uncertain requests guard browser refresh/close. Sign-out explicitly
warns and allows discarding unsaved marks. Change password uses the same guard
before leaving the saving shell; busy requests must finish, Keep puzzle preserves
marks, and explicit discard clears the draft and pending request before entering
password settings. Cancel from settings cannot revive discarded marks. The existing
general draft guard still protects other editors. Session clearing removes private state
and ignores late responses. No private progress is written to browser storage.
Choosing to force refresh/close despite the native warning loses unsaved memory;
this is not an offline durable-storage promise.

Writes are serialized in the shared executeWrite lifecycle. In-flight and
uncertain requests block further board mutations, reset/new and removal. A lost
response retains the exact request payload/UUID; reachable retry controls exist
inside active confirmation/install modals. Ordinary save failures allow explicit
retry; offline edits resume debounce after reconnect. A 409 retains local marks,
stops autosave and offers confirmed Load latest. Loading latest awaits a successful
fresh owner-scoped GET before replacing anything; failed reads keep marks/dialog.
The owner-scoped query merge retains the highest installation revision for every
GET and explicit upsert, including removed (`game: null`) snapshots and reinstall.
Clean drafts adopt only a higher installation revision; dirty drafts stay intact.
An immutable old receipt clears its pending request but adopts the latest known
cache snapshot rather than reviving an older board. Successful Load latest still
requires an awaited owner-scoped read; a lower response cannot rewind the cache.

GET `/nonograms` and POST `/nonograms/{install,save,new,restart,remove}` use the
existing authenticated session and CSRF transport. Identity comes only from the
session, with no owner/admin target override. Migration028 adds `user_nonograms`
(one owner row with current board and finite played IDs) and `nonogram_receipts`
(immutable owner/request receipts). Every write takes the owner lock, checks an
exact prior receipt before revision/state, validates the board and commits state
and receipt atomically. Reusing a request with altered content/action fails.
Monotonic owner version + active puzzle ID prevent stale saves after reset/new/
remove/reinstall. No audit payload or family revision is emitted.

Removal uses the existing shared 20-second Undo queue and revision guard. Current
board is soft-removed; played labels and private receipts remain. Reinstall starts
a fresh board. No completion-history UI is created.

## Focused checks

- Client: `npx vitest run src/components/nonograms/NonogramWorkspace.test.tsx src/components/widgets/WidgetLibrary.test.tsx src/components/layout/FamilyLayout.nonograms.test.tsx src/components/layout/FamilyLayout.test.tsx src/features/removals/removal-listener.test.tsx`
- Client static: `npx tsc --noEmit`
- API (from API checkout): `node --test tests/nonograms.test.mjs`

The API suite reuses the existing disposable `sudoku` fixture lifecycle only as an
isolated database/account/session harness; it tests Nonograms endpoints, never the
real user's Sudoku. A fresh run-token-named database is created/migrated and safely
dropped with its synthetic account/sessions after verification. No family database
is opened by that fixture. Local application migration is separate and additive;
production migration/release still needs explicit authorization and backup workflow.
