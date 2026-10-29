# Family branding

Use `FamilyBrand` for the approved Allin shield and wordmark, with the selected appearance accent.

```tsx
<FamilyBrand size="medium" />
<FamilyBrand variant="shield" size="small" />
```

Three size tokens live in `src/styles/tokens.css`:

| Size   | Shield width  | Proportional height | Wordmark type | Typical use      |
| ------ | ------------- | ------------------- | ------------- | ---------------- |
| small  | 2.5rem (40px) | 2.75rem (44px)      | 1.25rem       | Sidebar, footer  |
| medium | 3rem (48px)   | 3.3rem (52.8px)     | 1.5rem        | Main header      |
| large  | 5rem (80px)   | 5.5rem (88px)       | 2.5rem        | Sign-in branding |

Pixel equivalents assume the default 16px root font. The SVG has a fixed 200:220 viewBox (10:11), and height is automatic. Never set an independent height or stretch the mark. Both variants use the same sizes. Lettering is half the shield width, so changing a size token scales the complete lockup together.

The shield A replaces the initial A of Allin; visible lettering is `llin Family`. The component exposes the complete accessible name “The Allin Family”. It contains no link; wrap it with a labelled home link where appropriate.

The component renders the original `favicon.svg` geometry inline so its shield outline, A crossbar and doorway follow `--color-accent`. The A retains its off-white `--color-text-on-dark` fill; the wordmark retains `--color-text`. No background panel is baked into the artwork. The browser favicon remains the original static cyan asset.

Before sign-in, appearance uses the last accent displayed on this browser/origin (Turquoise when absent or invalid). The anonymous `allin-family:accent:v1:browser` localStorage entry contains only an allowlisted palette ID, never an account ID. It does not identify the next person signing in. Authentication restores that person's own per-user preference immediately, including Turquoise for an account without an override. Preferences do not sync across devices; blocked storage retains the colour for the current visit but cannot guarantee restoration after reload.

Use the wordmark at family entry points and the shield alone for compact identity. Do not replace unrelated functional icons with shields. `FamilyFooter` provides the shared compact footer.
