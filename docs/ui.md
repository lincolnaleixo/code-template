# UI Foundation

The UI system is owned by the repository and follows the shadcn model: accessible primitives are copied into `packages/ui`, composed into patterns, and customized with semantic CSS variables.

## Principles

- neutral, clean, and quietly premium by default
- semantic tokens instead of hardcoded brand colors
- light, dark, and system themes
- compact and comfortable density modes
- responsive web, mobile WebView, and desktop WebView behavior
- minimal animation with reduced-motion support
- no product-specific business logic in UI primitives

## File layout

```text
packages/ui/src/
  components/       buttons, forms, cards, feedback, dialog, tabs
  patterns/         app shell, page header, empty state, stat card
  styles.css        semantic tokens, Tailwind mappings, base styles
  theme-provider.tsx appearance state and bootstrap script
apps/web/src/
  brand.css         project-specific primary color and chart palette
  routes/ui.tsx     development playground
```

## Branding

Reusable components use tokens such as:

```text
background
foreground
card
primary
secondary
muted
accent
destructive
success
warning
info
border
input
ring
sidebar
```

Project identity belongs in `apps/web/src/brand.css`.

The default palette exposes three simple controls:

```css
:root {
  --brand-hue: 264;
  --brand-chroma: 0.18;
  --brand-lightness: 0.55;
}
```

Example hue starting points:

```text
blue        255
violet      300
green       155
cyan        205
orange       55
rose         15
```

Review contrast after every brand change. The `primary-foreground` token must remain readable against `primary` in both themes.

## Radius and density

Change global shape with:

```css
:root {
  --radius: 0.75rem;
}
```

The appearance provider sets `data-density` on the root element. Supported modes are `compact` and `comfortable`.

## Themes

Wrap the application with `AppearanceProvider` and include `APPEARANCE_BOOTSTRAP_SCRIPT` in the document head. This prevents a visible theme flash and supports light, dark, and system modes.

## Component ownership

Components are source code, not an opaque dependency. Modify them when the project needs a different interaction or visual language, while preserving accessibility and semantic tokens.

Primitives should remain generic. Product-specific combinations belong in product features or reusable patterns.

## UI playground

Run the web application and open:

```text
http://localhost:3000/ui
```

The playground displays colors, typography, controls, cards, feedback, loading states, dialog behavior, themes, and density. Use it when adapting a project brand.

## Adding components

Before adding a component:

1. Confirm an existing primitive or native element cannot satisfy the requirement.
2. Define keyboard and screen-reader behavior.
3. Use semantic tokens.
4. Support disabled, focus, error, loading, light, and dark states where applicable.
5. Add it to the UI playground.
6. Keep the public API small and composable.
