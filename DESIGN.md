---
name: Cost of Living Design System
description: Stark, premium, consequence-led gamified utility and landing page guidelines.
colors:
  primary: "#22c55e"
  negative: "#ef4444"
  tertiary: "#f59e0b"
  neutral-bg: "#0a0a0a"
  neutral-surface: "#111111"
  neutral-border: "#1f1f1f"
  neutral-text: "#f5f5f5"
  neutral-text-muted: "#666666"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(48px, 8vw, 96px)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "10px"
  md: "14px"
  lg: "20px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-text}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text-muted}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

# Design System: Cost of Living

## 1. Overview

**Creative North Star: "The Brutal Balance"**

A stark, high-contrast digital ledger where green and red act as indicators of psychological and economic survival, wrapped in a premium dark slate context. There are no safe zones or soft textures. Design choices enforce discipline, urgency, and consequence.

Every UI element is crisp, clean, and sparse. The interface avoids the warm-cream saturated defaults and cozy pastel colors of standard productivity tools. It operates with mathematical rigidity, using tabular numbers and tight geometric lines to feel like a high-stakes banking portal.

**Key Characteristics:**
- Dark-drenched aesthetic with deep ink-blended backgrounds
- High contrast indicator elements (only pure positive green and pure negative red)
- Heavy, deliberate motion mimicking natural inertia
- Zero decorative cards or box borders

## 2. Colors

A strictly limited, binary color palette reflecting profit vs. loss, plus an alert indicator.

### Primary
- **Positive Green** (#22c55e / oklch(0.79 0.19 143)): Represents earned discipline, rewards, and active streaks.

### Negative
- **Consequence Red** (#ef4444 / oklch(0.63 0.23 27)): Represents daily tax, missed contracts, compounding debt, and bankruptcy.

### Tertiary
- **Destiny Amber** (#f59e0b / oklch(0.76 0.17 76)): Represents destiny double multipliers, mystery box rewards, and warnings.

### Neutral
- **Ledger Black** (#0a0a0a): The default deep background.
- **Card Surface** (#111111): Elevated container background.
- **Border Dark** (#1f1f1f): Subtle divider lines.
- **Ink White** (#f5f5f5): Canonical text color.
- **Muted Dust** (#666666): Secondary text color.

**The Binary Rule.** Colors outside green, red, amber, and slate-greyscale are prohibited. Green, red, and amber are signals of absolute state, never decoration.

## 3. Typography

**Display Font:** Instrument Serif (with Georgia, serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** Highly geometric, clean, legible sans-serif for body and interfaces, paired with a sleek, high-contrast, elegant italic editorial serif for main display headlines. Numbers are tabular to ensure ledger lines remain structurally constant.

### Hierarchy
- **Display** (400, clamp(48px, 8vw, 96px) italic, 1): Hero titles and big currency balance counters.
- **Headline** (400, 32px to 48px italic, 1.1): Core section headers.
- **Title** (600, 15px, 1.3): Quest titles and card labels.
- **Body** (400, 13px, 1.5): Descriptive explanations and list content. Max line length is 65ch.
- **Label** (600, 10px, 0.18em uppercase): Eyebrow kickers, tabs, and small helper tags.

## 4. Elevation

The system is flat-by-default, utilizing flat surfaces and subtle borders to convey structure. Depth is generated via color layering rather than drop shadows.

**The Border-Only Rule.** Drop shadows are prohibited. Depth contrast is created by transitioning background values between Ledger Black (#0a0a0a) and Card Surface (#111111), with flat 1px borders (#1f1f1f) as dividers.

## 5. Components

### Buttons
- **Shape:** Rounded corners (10px or 9999px pill).
- **Primary:** Ink White background with Ledger Black text, 1px top border reflection.
- **Ghost:** Transparent background with Muted Dust text.
- **Hover / Focus:** Micro-movement scale down to 97% on press (`scale(0.97)`) with 160ms ease-out transitions.

### Cards / Containers
- **Corner Style:** Rounded corners (20px).
- **Background:** Card Surface (#111111).
- **Border:** 1px Border Dark (#1f1f1f) line.
- **Internal Padding:** Generous padding (28px to 32px) to allow components to breathe.


## 6. Do's and Don'ts

### Do:
- **Do** format all currencies and countdown timers with tabular-nums so numbers do not shift layout while updating.
- **Do** add `@media (hover: hover) and (pointer: fine)` wrappers to all button hover states to avoid touch device sticky hovers.
- **Do** transition all state variations using exact properties (`transform`, `opacity`) instead of using `all`.

### Don't:
- **Don't** use warm-beige background palettes ("cream", "sand", "bone").
- **Don't** use gradient text (`background-clip: text`) or colorful box-shadows.
- **Don't** wrap layout content in nested card elements.
- **Don't** use bounce, elastic, or ease-in transitions for user-triggered interface loops.
