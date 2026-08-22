# UI Foundation

The UI system is owned by the repository and follows the shadcn model: accessible primitives live in `packages/ui`, patterns compose those primitives, and project identity is expressed through semantic CSS variables.

## Principles

- neutral, clean, and quietly premium by default
- semantic tokens instead of hardcoded brand colors
- light, dark, and system themes
- compact and comfortable density modes
- responsive web, mobile WebView, and desktop WebView behavior
- minimal animation with reduced-motion support
- no product-specific business logic in UI primitives
- native browser controls where they provide the right accessibility behavior

## File layout

```text
packages/ui/
  components.json   shadcn CLI install targets and aliases
  src/
    components/     controls, surfaces, feedback, overlays, tables
    patterns/       app shell, page states, settings, data composition
    styles.css      semantic tokens, Tailwind mappings, base styles
    theme-provider.tsx appearance state after hydration
apps/web/
  components.json               app and shared-workspace aliases
  public/appearance-bootstrap.js CSP-safe pre-hydration appearance setup
  src/brand.css                 project-specific identity
  src/routes/ui.tsx             core foundation playground
  src/routes/ui-advanced.tsx    product pattern playground
```

## Semantic tokens

Reusable components use roles rather than literal colors:

```text
background
foreground
card
popover
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
chart-1 through chart-5
```

Do this:

```tsx
<Button className="bg-primary text-primary-foreground">Save</Button>
```

Do not do this in a reusable component:

```tsx
<Button className="bg-blue-600 text-white">Save</Button>
```

## Branding

Project identity belongs in `apps/web/src/brand.css`.

The starter palette exposes three primary controls:

```css
:root {
  --brand-hue: 264;
  --brand-chroma: 0.18;
  --brand-lightness: 0.55;
}
```

Useful hue starting points:

```text
blue        255
violet      300
green       155
cyan        205
orange       55
rose         15
```

You can also override typography, radius, density defaults, sidebar colors, and chart colors in the same file. Review contrast after every brand change. `primary-foreground` must remain readable against `primary` in light and dark themes.

## Radius and density

Change global shape with:

```css
:root {
  --radius: 0.75rem;
}
```

The appearance provider sets `data-density` on the root element. Supported modes are `compact` and `comfortable`.

Density changes control height and section rhythm. It should not hide content or reduce touch targets below an accessible size.

## Themes and CSP

`AppearanceProvider` manages light, dark, and system preferences after hydration. The document loads `/appearance-bootstrap.js` before application scripts so the stored appearance is applied without a visible flash.

The bootstrap is an external same-origin script rather than inline JavaScript. This keeps it compatible with the strict Tauri Content Security Policy.

When changing the storage keys, update both:

```text
packages/ui/src/theme-provider.tsx
apps/web/public/appearance-bootstrap.js
```

## Included primitives

```text
Alert
Avatar
Badge
Button
Card
Checkbox
Dialog
Input
Label
Select
Separator
Sheet
Skeleton
Switch
Table
Tabs
Textarea
Tooltip
```

The dialog and sheet use the native `dialog` element for focus management, Escape behavior, and modal semantics. Tabs implement arrow, Home, and End keyboard navigation.

## Included patterns

```text
AppShell
ConfirmDialog
DataTable
EmptyState
ErrorState
FormField
LoadingState
PageContainer
PageHeader
Pagination
SearchInput
SettingsSection
StatCard
```

`DataTable` intentionally covers the common case: typed columns, semantic table markup, empty state, search composition, and pagination composition. Use TanStack Table when a project requires server sorting, column visibility, grouping, resizing, virtualization, or complex selection.

## Component ownership

Components are source code, not an opaque dependency. Modify them when a product needs a different interaction or visual language, while preserving accessibility and semantic tokens.

Primitives remain generic. Product-specific combinations belong in a product feature or in a reusable pattern whose purpose is clear.

## shadcn CLI workflow

The monorepo has one `components.json` in `apps/web` and another in `packages/ui`. They use the same base style, semantic CSS variables, neutral base color, and icon-library setting. Package import aliases route shared UI source into `packages/ui`.

Inspect the resolved setup:

```bash
bun run ui:info
```

Add a component directly to the shared package:

```bash
bun run ui:add alert-dialog
```

The command uses an exact CLI version rather than an unbounded `latest` tag. It may add package dependencies and update `bun.lock` when the selected component requires them.

After generation:

1. review every changed file
2. preserve repository naming and semantic tokens
3. reconcile generated imports with existing primitives
4. verify keyboard and screen-reader behavior
5. export the component deliberately from `packages/ui/src/index.ts`
6. add an example to `/ui` or `/ui-advanced`
7. run `bun run check` and relevant builds

Do not use an overwrite-all command against customized components without a dedicated review branch. Registry source is an input to the design system, not the design system's authority.

`bun run template:validate` checks that the two shadcn configurations remain compatible, Tailwind v4 keeps an empty config path, CSS variables stay enabled, package import aliases resolve, and shared package exports exist.

## Playgrounds

Run the web application and open:

```text
http://localhost:3000/ui
http://localhost:3000/ui-advanced
```

The core playground displays tokens, typography, controls, cards, feedback, loading, dialog behavior, themes, and density.

The advanced playground displays tables, search, pagination, settings sections, checkbox, tooltip, sheet, confirmation, loading, and error states.

Use both routes when adapting a project brand or changing a shared component.

## Adding components

Before adding a component:

1. Confirm an existing primitive or native element cannot satisfy the requirement.
2. Define keyboard and screen-reader behavior.
3. Use semantic tokens.
4. Support disabled, focus, error, loading, light, and dark states where applicable.
5. Add a representative example to a playground route.
6. Keep the public API small and composable.
7. Add a dependency only when the interaction is too complex to maintain safely in the repository.
