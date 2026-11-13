# palette-ui

Headless command palette primitives for React. `palette-ui` owns the fiddly parts — query state, filtering, keyboard movement, and the ARIA wiring between a combobox input and a listbox — while you own every pixel.

## Why

Most command palettes ship with opinions about layout, animations, and a portal. That is fine until you need the palette inside an existing overlay, or the app already has a design system. This package exposes the behaviour through a hook and a handful of unstyled components, so markup stays yours.

## Install

```sh
npm install palette-ui
```

React 18 or newer is a peer dependency.

## Usage

```tsx
import { Palette, PaletteInput, PaletteList, PaletteItem } from "palette-ui";

const commands = [
  { id: "new-file", label: "New file", keywords: ["create"] },
  { id: "toggle-theme", label: "Toggle theme", group: "View" },
  { id: "archive", label: "Archive project", group: "Project", disabled: true },
];

export function CommandBar({ onClose }: { onClose: () => void }) {
  return (
    <Palette
      items={commands}
      onSelect={(item) => console.log("selected", item.id)}
      onClose={onClose}
    >
      {({ results, isEmpty }) => (
        <>
          <PaletteInput placeholder="Type a command" />
          {isEmpty ? (
            <p>No matching commands</p>
          ) : (
            <PaletteList>
              {results.map((item, index) => (
                <PaletteItem key={item.id} item={item} index={index}>
                  {item.group ? `${item.group}: ${item.label}` : item.label}
                </PaletteItem>
              ))}
            </PaletteList>
          )}
        </>
      )}
    </Palette>
  );
}
```

Need full control of the markup? Skip the components and spread the hook props instead:

```tsx
const palette = useCommandPalette({ items, onSelect });
return <input {...palette.getInputProps()} />;
```

Filtering is case-insensitive substring matching over `label` and `keywords`. Pass `filter` to `Palette`/`useCommandPalette` to use fuzzy ranking, a server query, or anything else.

## API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `items` | `PaletteItem[]` | required | Rendered in order until a query is present; matches are sorted by label |
| `onSelect` | `(item: PaletteItem) => void` | required | Fired on Enter or click for enabled items; query is cleared afterwards |
| `onClose` | `() => void` | — | Fired on Escape when the query is already empty |
| `filter` | `(item, query) => boolean` | substring | Replace to change matching |
| `loop` | `boolean` | `true` | Wrap arrow-key movement past the ends |
| `id` | `string` | generated | Prefix for all generated element ids |

`PaletteItem` is `{ id: string; label: string; group?: string; keywords?: string[]; disabled?: boolean }`.

The hook returns `query`, `results`, `activeIndex`, `isEmpty`, `setQuery`, `select`, and the three prop getters. Compound components are `PaletteInput`, `PaletteList`, and `PaletteItem`; they throw when rendered outside a `Palette`.

## Accessibility

- The input is a `combobox` with `aria-expanded`, `aria-controls`, and `aria-activedescendant`; the list is a labelled `listbox` and entries are `option`s.
- Arrow, Home, and End movement skips disabled entries; Enter ignores them.
- `onMouseDown` is prevented on entries so focus stays in the input, which keeps `aria-activedescendant` meaningful while using a mouse.
- Escape clears a non-empty query before it closes the palette, so one keystroke does not lose the search.
- Styling is fully external. The components add class names only, no inline styles.
- Consumers should render the palette in a dialog and restore focus on close. Focus trapping is intentionally out of scope.

## Layout

```
src/
  types.ts             PaletteItem and PaletteFilter
  useCommandPalette.ts state, filtering, keyboard handling, ARIA props
  Palette.tsx          context, render prop, unstyled compound components
  index.ts             public exports
```

## License

MIT
