# Daily Word v1 — local implementation

Daily Desk is a personal My widgets installation at
`/my-space?view=widgets&tool=word`. Family widgets has a separate
`tool=word-results` surface, available without installing the personal game.
Home and the application shell are unchanged. The real React board and its
colocated CSS use Nimbus tokens; the standalone October 25 HTML designs remain
reference artifacts rather than application code.

## Rules and ownership

Each London calendar day has one server-owned, immutable, randomly selected
five-letter challenge. The previous 30 challenge answers are excluded from new
selection. There are six accepted guesses. Invalid dictionary words and duplicates
do not consume an attempt. The PHP scorer allocates exact matches before remaining
letters, handling repeated letters without overcounting. There are no hints, timer,
restart or accepted-guess Undo. Backspace edits only the current typed word.

Private progress belongs to the authenticated owner, including administrators'
own progress only. It survives refresh and removal/reinstallation. The shared
20-second delayed removal/Undo service removes only availability; it does not
reset attempts or silently publish/withdraw results. Installation generation and
progress revision are independent server guards. A publication changes progress
revision but not attempt count (the latter comes from the accepted-guess array).

An explicit share operation derives a completed outcome from saved progress.
Family receives only display nickname, owner identity, date, solved/finished and
attempt count. No answer, guesses, tile patterns or private participation are
returned. The family results view covers seven London days and supports withdrawing
the owner's result. Reinstall first to manage a previously shared result after
removal. Private seven-day history includes played/solved/finished status and is
never included in the shared endpoint or administrator activity payloads.

Administrators can see generic install/remove/share/withdraw lifecycle events in
the existing activity view. The separate `daily_word` entity carries kind, owner,
installation generation and visibility only; no private play date, score,
completion, guess or pattern. It does not affect family widget ETags or appear in
family feeds. Exact receipt replay and no-op transitions create no duplicate audit.

## Client state and failures

Lazy Workspace/Install/Results components use the existing shared Modal, draft
guard, clock and removal primitives. The account-keyed RTK Query endpoint and
Redux write lifecycle reset with the session. Results are also keyed by viewer
account. No local/browser storage persists private content.

Typed letters remain local until Enter. Each write carries a UUID key and exact
payload. No optimistic accepted row is displayed. A timeout retains the exact key,
word, challenge date and revisions while the component remains mounted (including
in-app Refresh status). Pending request keys are memory-only; a full browser
reload or discarded navigation does not retain them. Accepted database progress
reloads independently. Explicit unresolved state keeps editing and
day transitions locked even if Refresh clears an error; Retry same request resolves
the original receipt. A definitive rejection permits correction or guarded loading
of the authoritative board. Successful historical receipts never overwrite current
RTK Query state; writes force an authoritative snapshot read.

Server London date, UTC expiry and next-midnight instant govern rollover, including
BST/GMT changes. The shared clock/focus/reconnect/polling refreshes server metadata.
The old board and draft remain until an explicit guarded transition; no typed word
is silently submitted to another date. New expired requests fail, while an exact
previously accepted receipt can replay after midnight or later guesses.

The labelled input supports physical typing/Enter; keypad buttons offer letters,
Backspace and Enter. Tiles have accessible names and non-colour symbols; accepted
guesses announce each letter's textual mark. Keyboard feedback keeps the strongest
known status. Reduced motion is respected. Mobile puts board and keyboard before
the personal rail.

## Word data and release

The API privately ships 6,939 accepted British five-letter words and a separate
696-word common answer shortlist. Every answer is also an accepted guess.
ESDB/SCOWL release `rel-2026.02.25` is pinned; API
`src/daily-word-data/provenance.json` records the exact primary archive SHA256,
extraction options, derived asset hashes and curation. `COPYRIGHT.txt` retains the
complete primary notices. No New York Times dataset, external gameplay service,
API key or application dependency was added.

`scripts/deployment.ps1` now requires all four exact word assets when the Daily
Word runtime is present, retains its PHP-only policy for other runtime files,
and includes the notices/provenance with the API package. The API src directory
remains denied by Apache and routed through PHP locally. Do not stage/deploy only
the client: production needs a fresh verified backup/rehearsal, additive migration
023, API runtime plus word assets, then client. Existing `.env` and storage stay
private. Commit/package preparation and production release are separate operations
recorded in the workspace release handoff.

Initial implementation verification was limited to build/syntax/source review.
Gary subsequently authorised local functional QA on 25 October: the parent used
Gary/Dad in the internal browser for actual guesses, persistence/refresh, privacy,
explicit share/withdraw, mobile and removal/Undo/reinstall. Named QA records were
archived privately and removed after normal withdrawal and soft removal; the
original daily challenge and other family data were preserved.

Repeatable coverage is in `src/components/daily-word/*.test.tsx` and
`src/features/daily-word/daily-word-actions.test.ts`. API coverage runs with
`node --test tests/daily-word.test.mjs` from the API repository: a uniquely named
disposable database/account, synthetic identities and marker guards isolate it
from Gary's game. It includes real competing PHP processes, owner/admin/CSRF
boundaries, all six durable receipts, share/withdraw and no-op audit, reinstall
retention, first expired versus accepted old-day writes, dictionary hashes and
23/25-hour London days. Optional explicit instants in PHP domain functions support
deterministic clock checks; HTTP requests cannot override the server clock.

Client coverage exercises mounted board/result controllers and actual Redux/query,
session and 20-second removal lifecycles. A full browser reload retains accepted
database progress; exact uncertain keys remain memory-only until resolved or
explicitly discarded. No production action was taken. A real screen-reader session
and other real family logins were not performed.
