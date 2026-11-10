# Where Is It? — Quick Index

Local implementation, 10 November 2026. The approved Quick Index sits inside the existing Widget Store, shelves and family shell. No prototype shell, example items or extra Home card is installed.

## Installation and permissions

Install from the Store with a collection name and Family (recommended) or Personal visibility. Existing per-owner active-widget limit of 30 applies across kinds. Multiple separate installations follow the same rule as Dinner Spinner; nothing is copied between them. Family members can view, add, edit and remove collection items. Only the installation owner can rename, change visibility or remove the installation. Changing to Family explicitly shares the existing collection. Personal items and photos are owner-only, including against administrators.

## Everyday use

Search matches item names, complete locations and notes. The single location filter and datalist suggestions deduplicate case/whitespace variants. Results sort by name. Add/edit/move needs a name (100 characters) and location (160); note (1,000) and one photo are optional. The detail dialog gives the full location, optional photo/note and updated time. Unsupported uploads are rejected without losing the draft. Supported photos are JPG, PNG and WebP, at most 10 MB, 24 megapixels and 8192 pixels on either side, matching the existing server image validation. Existing orientation/preview helpers are reused. There is no HEIC conversion promise.

Existing Modal, draft protection, ContentSurface, controls and Nimbus roles are reused. Removing an item or installation uses the shared 20-second delayed submission/Undo lifecycle; Undo cancels before the request, so the photo remains intact. The server rechecks the captured version and access when the delay ends. Refresh restores persisted records. Search/filter are temporary component state.

## Data and recovery

Where items use owner-keyed RTK Query caches, existing session/CSRF transport, 15-second timeouts and shared write/session-generation safety. Successful writes update item data and invalidate installation summaries. The widgets ETag includes visible item revisions so Home counts refresh. Home uses its existing reusable summary and receives family installation counts, without loading item details or personal collections into that summary. One muted detail line says “No items saved yet” for empty family collections, otherwise “Last updated …” from the latest active item timestamp. Add and edit both set that item timestamp; installation settings and removed items never supply recency. Counts aggregate visible family collections and the link opens the collection supplying the newest item update. Offline/error status takes priority and suppresses the detail hint.

Every item write and installation management write carries a UUID and an exact canonical payload signature; photo writes also hash uploaded bytes. Receipt acknowledgement is durable and stable across later edits/removal. Retrying an accepted request never repeats its mutation. Returned snapshots are current state, separate from the stable acknowledgement. Item retries still require current collection access. Installation retries are actor/owner scoped. Item/version and settings/version conflicts retain drafts and show the latest saved text or offer loading the latest settings. Network/timeouts and 5xx/unexpected responses freeze the attempted intent and offer retry of the exact saved request. Validation failures remain editable. In-memory attempts survive in-app refresh while the form is open; a full reload/discard can lose that recovery key and is guarded by the established draft warning.

Photo URLs use the authenticated item endpoint and current item key, not Memories URLs. Every fetch checks current installation access, active item and exact key; no-store responses prevent cached private content being reused after permissions change. Removed items retain their files under the established soft-delete policy. Replaced/unlinked photos are deleted only after confirmed commit; an uncertain COMMIT retains its new file. These files are inside the configured private photo directory, never a client asset folder.

## Scope and local checks

No barcode, inventory quantities, borrowing, deadlines, new dependencies or third-party services. No item-level family activity is generated: installation audit metadata identifies the kind/owner/visibility/version without item text or photos.

Focused checks: npx tsc --noEmit; npx vitest run src/components/where-is-it/WhereItemForm.test.tsx src/components/widgets/WidgetLibrary.test.tsx src/components/family/HomeOverview.test.tsx src/features/removals/removal-listener.test.tsx; API node --test tests/where-is-it.test.mjs. Parent owns authenticated Gary/Dad browser acceptance. Migration 027 is required before matching runtime deployment. Production migration, version setting, commit, push, package build and upload are separate unperformed gates.
