# Frontend Visual Polish — Modern Museum Aesthetic

**Date:** 2026-04-08
**Scope:** Visual polish only — same layouts, same features, elevated look and feel
**Aesthetic:** Modern Museum — clean, bold, institutional, high contrast

---

## 1. Typography

**Font:** Inter (Google Fonts)
- Load via `@import` in `client/src/index.css`
- Applied globally via Tailwind `fontFamily` config

**Usage rules:**
- **Headings (h1–h3):** `font-weight: 700–800`, `letter-spacing: -0.02em` (`tracking-tight`)
- **Body text:** `font-weight: 400`, default letter-spacing
- **Labels/tags/section markers:** `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.05em` (`tracking-widest`)

**Tailwind config change:**
```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

## 2. Color Palette Re-role

The same colors, used differently.

| Tailwind Token | Old Value / Role | New Value / Role |
|---|---|---|
| `light` | `#E8AC49` (gold, used as page bg) | `#FAFAFA` (off-white, page bg) |
| `gold` (new) | — | `#E8AC49` (accent: dividers, badges, quote borders, small highlights) |
| `primary` | `#28715E` (green) | Same — buttons, active nav states, links, section accent bars |
| `secondary` | `#632420` (burgundy) | Same — header bg, hero sections, CTA backgrounds |
| `accent` | `#C95C2C` (burnt orange) | Same but demoted — tertiary highlights only (e.g., featured rank badge) |
| `dark` | `#1C1A1A` | Same — heading text on light bg, dark section backgrounds |

**Files changed:**
- `client/tailwind.config.js` — redefine `light`, add `gold`
- `client/src/index.css` — update `@layer base` html rule from `bg-light` to use new off-white

## 3. Component Polish

### 3.1 Header (`Header.jsx`)
- Logo text: apply `font-extrabold tracking-tight` (Inter will carry the weight)
- Sign Up button: replace `bg-gradient-to-r from-secondary to-secondary/80` with flat `bg-primary text-white` — cleaner, museum-appropriate
- No structural changes

### 3.2 FigureCard (`FigureCard.jsx`)
No structural or interaction changes. Surface-level polish:

- **Gradient overlay (front face):** reduce from `from-black/90 via-black/50` to `from-black/80 via-black/40` for slightly more image visibility
- **Badge pills (years, featured rank):** style as `bg-white/90 text-dark border border-gold/30` — muted, institutional
- **Like button (active state):** swap the round icon container from `bg-secondary text-white border-secondary` to `bg-dark/60 backdrop-blur text-white border-white/20` — more neutral. The count label below stays as-is (`bg-black/40 text-white`)
- **Bottom action bar:** simplify to `bg-dark/50 backdrop-blur-sm` — less layered glass morphism
- **Tags on hover:** `bg-dark/30` instead of `bg-white/20` for better contrast on the image
- **Source badge:** keep as-is

### 3.3 Home Search Hero (`Main.jsx`)
- Hero section: keep `bg-secondary` (burgundy)
- Search input: add `border border-gray-200 shadow-sm` for definition against white bg
- Search button: swap `bg-dark` to `bg-primary` (green) for better contrast against burgundy

### 3.4 Featured Section (`Main.jsx`)
- Divider line: replace gradient `from-secondary to-primary` with solid `bg-gold` — single clean accent line
- Section heading: add `tracking-tight font-extrabold`
- Subheading text: keep as-is

### 3.5 Echoes Gallery (`Echoes.jsx`)
- Select dropdown + search input: slightly more rounded — `rounded-xl` instead of `rounded-lg`
- Active filter pills: swap `bg-secondary/10 text-secondary` to `bg-primary/10 text-primary` for consistency
- No other changes

### 3.6 Footer
Footer file is empty (1 line). No changes needed.

## 4. About Page Redesign (`About.jsx`)

Same content, restructured layout for institutional feel.

### 4.1 Hero Section
- **Background:** `bg-dark` (near-black) instead of `bg-secondary`
- **Layout:** gold accent bar (3px wide, 32px tall) above content, small uppercase "ABOUT" label in gold, large `font-extrabold tracking-tight` heading in white, subtitle in `text-gray-500`
- **No image/illustration** — purely typographic

### 4.2 Mission Section
- **Layout:** vertical green accent bar (`w-1 bg-primary`) left-aligned next to content
- **Label:** small uppercase "OUR MISSION" in `text-primary` with `tracking-widest`
- **Body text:** `text-gray-600` on white/off-white bg
- **Separator:** `border-b border-gray-200` below section

### 4.3 Quote Block
- **Style:** white card with `border-l-4 border-gold` (left accent), rounded on right side
- **Quote text:** `italic text-dark` at slightly larger size
- **Attribution:** `text-gray-500 font-semibold`, small

### 4.4 How It Works
- **Label:** small uppercase "HOW IT WORKS" in `text-primary`
- **Layout:** 3 steps in a row connected by a horizontal line (`h-px bg-gray-300`) running through step circles
- **Step circles:** `bg-primary text-white` with `border-4 border-light` (off-white, to cut through the line)
- **Step text:** bold title + small gray description below each circle

### 4.5 CTA Section
- **Background:** `bg-dark` instead of `bg-secondary`
- **Heading:** `font-extrabold text-white tracking-tight`
- **Subtitle:** `text-gray-500`
- **Primary button:** `bg-primary text-white rounded-lg`
- **Secondary button:** `border border-gray-600 text-white rounded-lg`

### 4.6 Acknowledgements Section
- **Layout:** same as Mission — vertical accent bar, this time in burgundy (`bg-secondary`)
- **Label:** small uppercase "ACKNOWLEDGEMENTS" in `text-secondary`
- **Content:** existing quote/text, styled consistently

## 5. Global Spacing & Polish

- All `rounded-lg` on cards and inputs stays — museum feel uses moderate rounding
- Shadow consistency: cards use `shadow-md`, inputs use `shadow-sm`
- Section padding: standardize on `py-16` for major sections, `py-8` for sub-sections
- Button height minimum: keep `min-h-[44px]` for touch targets (already in place)

## 6. Files Modified

| File | Changes |
|---|---|
| `client/tailwind.config.js` | Redefine `light` color, add `gold` color, add Inter font family |
| `client/src/index.css` | Add `@import` for Inter font, update base `html` styles |
| `client/src/components/Header/Header.jsx` | Logo text styling, Sign Up button flat style |
| `client/src/components/Echoes/FigureCard.jsx` | Gradient, badge, like button, action bar polish |
| `client/src/components/Main/Main.jsx` | Search input/button styling, featured section divider/heading |
| `client/src/components/Echoes/Echoes.jsx` | Filter bar rounding, filter pill color |
| `client/src/components/About/About.jsx` | Full visual restructure (same content) |

## 7. Out of Scope

- No new features or functionality
- No routing changes
- No backend changes
- No FigureDetail page changes (not flagged as a pain point)
- No Profile page changes
- No modal/form styling changes
- No 3D flip card interaction changes
