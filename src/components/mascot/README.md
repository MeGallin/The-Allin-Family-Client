# Cockatiel mascot

`CockatielMascot` renders the approved white cockatiel PNG with its yellow crest,
orange cheeks and navy perch. The asset retains its original transparent canvas
and intrinsic 1536 × 1024 aspect ratio. Vite imports it as a local bundled asset;
there is no external image request or dependency.

```tsx
<CockatielMascot />
<CockatielMascot size="12rem" className="my-mascot" />
```

The default width is Nimbus `--space-9` × 2 (160px at the default font size),
limited to its container's width. `size` accepts a React CSS width value (numeric
values use pixels); `className` lets the consumer own placement and responsive
styling. The image does not intercept pointer input and cannot be dragged.
It is decorative by default (`alt=""`, `aria-hidden`); supply meaningful `alt`
only when the illustration conveys content.

The login consumer centers it above the card, at 160–192px canvas width. Its
existing PNG perch is aligned with the card top using the image's approximately
88% perch position. A wrapper reserves 64px of external headroom alongside the
app shell's existing top margin; the card's padding, typography, grid and form
height are unchanged. Placement rules live in `auth/LoginForm.css`, not here.

The authenticated `FamilyLayout` header also reuses the decorative image on all
family and administration routes. The canvas is at most 96 × 64px at the default
font size, using Nimbus `--control-min-height` and the original aspect ratio.
Absolute placement aligns the integrated perch's bottom (approximately 94% of
the original canvas height) with the header's bottom border. A `ResizeObserver`
measures the header, `FamilyBrand` and `AccountMenu` to size the bird within their
actual free gap, retaining Nimbus `--space-3` clearance on each side. It centers
geometrically within the full header where space permits, and shifts only as
needed into that gap on narrow screens rather than collapsing a symmetric slot
to zero. Existing header
padding, minimum height, typography and account controls remain unchanged.
Placement rules live in `layout/FamilyLayout.css`.

Header browser acceptance is pending: compare desktop and actual CSS390/320
widths, Light/Dark, family/admin routes and the open account menu. Check that
the brand and menu are unobscured, header height stays stable, the bird is
centered within the full header where space permits, the perch rests on its
bottom border, and keyboard focus remains visible. The current
internal browser session is signed out, so an authenticated rendered baseline
was unavailable during implementation.

Browser acceptance is parent-owned. Check desktop and actual CSS390/320 widths,
Light/Dark, initial/error/busy states and keyboard focus for crest clipping,
perch alignment, image background integration, wrapping and form obstruction.
No tests or build were run for the initial implementation.
