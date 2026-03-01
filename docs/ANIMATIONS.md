# Animation reference

Hero animations are inspired by [Linear's landing page](https://linear.app) and implemented from the [anoopraju31/linear-landing-page](https://github.com/anoopraju31/linear-landing-page) clone.

## Components

| Component | Purpose |
|-----------|---------|
| `BlurPopUpByWord` | Word-by-word blur reveal for headlines (opacity + blur + translateY) |
| `BlurPopUp` | Block-level blur reveal with configurable delay |
| `IllustrateAnimate` | Illustration-style reveal (opacity + 3D translate) |

## Animation variants (`src/lib/animations.js`)

- **blurPopUp**: `opacity: 0, filter: blur(10px), y: 20%` → `opacity: 1, filter: blur(0), y: 0`
- **illustrate**: `opacity: 0, x: 50, y: -50, z: 300` → `opacity: 1, x: 0, y: 0, z: 0`

Uses `framer-motion` with `ease: [0.22, 1, 0.36, 1]` (premium easing).
