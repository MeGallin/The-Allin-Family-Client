# Family branding

Use `FamilyBrand` for the approved Option 09 standalone calligraphic A, extended into a custom vector ALLIN wordmark with the selected appearance accent. The mark has no shield frame. `Family` remains text in the existing app font.

```tsx
<FamilyBrand size="medium" />
<FamilyBrand variant="shield" size="small" />
```

Three size tokens live in `src/styles/tokens.css`:

| Size   | Mark width    | Proportional height | Wordmark type | Typical use      |
| ------ | ------------- | ------------------- | ------------- | ---------------- |
| small  | 2.5rem (40px) | 2.75rem (44px)      | 1.25rem       | Sidebar, footer  |
| medium | 3rem (48px)   | 3.3rem (52.8px)     | 1.5rem        | Main header      |
| large  | 5rem (80px)   | 5.5rem (88px)       | 2.5rem        | Sign-in branding |

Pixel equivalents assume the default 16px root font. The selected A SVG uses `viewBox="25 21 150 165"` (10:11), and height is automatic. Never set an independent height or stretch the mark. Both variants use the same A sizes. Family text is half the mark width, so changing a size token scales the complete lockup together. Existing `--brand-shield-*` size/ratio tokens and the `variant="shield"` API name are retained for compatibility; that variant now means the standalone A without lettering.

The calligraphic A is followed by bespoke inline SVG L, L, lowercase-style i and N constructions: bowed downstrokes, flowing L terminals, a shorter tapered i with a flared curved foot and separate light dot, and a curved diagonal N. The i has a nominal 24-unit upper stem, widened around its existing centreline to echo the A leg's weight and tapered into its existing foot. Its top and dot are lowered by 22 units (stem start y=108 instead of 86; dot cy=88 instead of 66), shortening the complete i by about 20% with its foot/baseline anchored. The stem's vertical curves are reshaped, not scaled; its 24-unit width and round 24-unit dot remain intact. The letter bodies lean visibly left toward the A using a 24-degree skew anchored at the y=159 baseline, matching the approximate direction of the A's descending right leg. The dot remains outside that transform at cx=59.9, cy=88, r=12 (the projected position of the stem centreline), so it stays circular and aligned.

The letters' `-40 21 200 165` viewBox reserves room for the slanted first L. The N alone is translated six SVG units right before the shared skew, separating it from the widened, shortened i without narrowing that stem or changing either letter's vertical geometry. The translated N remains within the existing viewport after the skew. The SVG width is 4/3 of the mark token; a negative inline margin of 47/150 of that token tucks the ink close to the A without changing glyph scale. The effective layout contribution is 153/150 of the token, slightly narrower than the previous 160/150, retaining compact small/medium/large lockups. Height still scales to the A's 165-unit viewport. `Family` retains its existing display font, weight and half-mark-width type size. The component exposes the complete accessible name “The Allin Family”; decorative SVGs/text are hidden from assistive technology. It contains no link; wrap it with a labelled home link where appropriate. These geometric choices still require rendered visual acceptance.

The A develops the selected Option 09 calligraphic direction from `work/ui-design/family-shield-2026-10-30/option-09.html` with a fuller curved crown, tapered legs and broader terminals; its recognizable open form and original bowed crossbar remain. The body uses dynamic `--color-accent`; the crossbar and i dot use off-white `--color-text-on-dark`. Custom LLiN paths also follow the accent; `Family` retains `--color-text`. The A uses `.family-logo__mark`, and the additional vector lettering uses `.family-logo__letters`. No shield outline, doorway or background panel is included. The browser favicon remains the original static cyan asset.

Before sign-in, appearance uses the last accent displayed on this browser/origin (Turquoise when absent or invalid). The anonymous `allin-family:accent:v1:browser` localStorage entry contains only an allowlisted palette ID, never an account ID. It does not identify the next person signing in. Authentication restores that person's own per-user preference immediately, including Turquoise for an account without an override. Preferences do not sync across devices; blocked storage retains the colour for the current visit but cannot guarantee restoration after reload.

Use the wordmark at family entry points and the standalone mark for compact identity. Do not replace unrelated functional icons with the family mark. `FamilyFooter` provides the shared compact footer.
