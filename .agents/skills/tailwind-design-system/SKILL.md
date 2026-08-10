---
name: tailwind-design-system
description: >-
  Provides best practices, design token conventions, responsive layout rules, and micro-animation patterns for Tailwind CSS styling. Activate when building UI components, styling layouts, or designing responsive web interfaces.
---

# Tailwind CSS & Design System Best Practices

Guidelines for creating beautiful, accessible, responsive, and maintainable UI design systems with Tailwind CSS.

## Core Rules

### 1. Curated Palette & Modern Aesthetic
- Avoid raw browser default colors (`red-500`, `blue-500`). Use curated HSL/OKLCH design tokens or Tailwind semantic shades (`indigo-600`, `violet-500`, `emerald-500`, `slate-900`).
- Ensure contrast ratio meets WCAG AA standards in both light and dark modes.

### 2. Glassmorphism & Micro-animations
- Incorporate subtle backdrop blurs, crisp borders, and smooth transitions for premium user experiences:

```html
<div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg transition-all duration-200 hover:border-slate-700 hover:shadow-xl">
  <!-- Content -->
</div>
```

### 3. Responsive Layouts & Fluid Spacing
- Mobile-first responsive design (`sm:`, `md:`, `lg:`, `xl:`).
- Use flexbox and CSS grid with gap utilities rather than hardcoded margin offsets.

## Reference Guide

- Read [references/theme-tokens.md](./references/theme-tokens.md) for standard tokens, custom keyframes, and animation utilities.
