# Jasmine Design System — Cracked Designer Reference

Premium UI principles from Vercel, Linear, Stripe, Aceternity, Reforge UI, and the Ultimate Web Design Guide.

## Typography

- **Display**: 48–60px, tracking -0.02em, line-height 1.1–1.15
- **Headings**: 24–36px, tracking -0.02em, line-height 1.2
- **Body**: 14–16px, line-height 1.6–1.75, 60–90 chars per line
- **Labels**: 11–12px, tracking 0.08–0.12em, uppercase optional
- **Fonts**: DM Sans (primary), Geist/Instrument for display. Max 2 font families.

## Spacing (8px grid)

- 4, 8, 12, 16, 24, 32, 48, 64, 96
- Section padding: 24–48px mobile, 48–96px desktop
- Card padding: 16–24px
- Button padding: 12–16px vertical, 20–32px horizontal

## Color & Contrast

- **60-30-10**: 60% dominant, 30% secondary, 10% accent
- **WCAG**: Text contrast 4.5:1 minimum
- **Accent**: Use sparingly for CTAs, links, highlights
- **Surfaces**: Layered (surface, raised, overlay) for depth

## Shadows & Depth

- **Soft**: 0 4px 20px rgba(0,0,0,0.08)
- **Inset**: gradient darker bottom, lighter top for buttons
- **3D lift**: translateY(-2px) + stronger shadow on hover
- **No harsh black**: Use rgba for softer edges

## Micro-interactions

- **Duration**: 150–250ms for most transitions
- **Easing**: cubic-bezier(0.22, 1, 0.36, 1) for premium feel
- **Hover**: Subtle scale(1.02), translateY(-1px)
- **Focus**: Visible ring, 2px offset

## Components

- **Buttons**: Pill or rounded-lg, inset shadow, 2–4px border on primary
- **Cards**: Rounded-xl, border + soft shadow, hover lift
- **Inputs**: Rounded-xl, inset shadow, focus ring
- **Icons**: Phosphor only, 18–24px for UI

## Anti-AI-Slop

- No purple-blue gradients
- No three-column generic grids
- No Inter/system font defaults
- No Lorem Ipsum
- Distinctive, human-designed feel
