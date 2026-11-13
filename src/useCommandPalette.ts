import { useCallback, useId, useMemo, useReducer } from "react";
import type * as React from "react";
import type { PaletteFilter, PaletteItem } from "./types";

export interface PaletteOptions {
  id?: string;
  items: PaletteItem[];
  onSelect: (item: PaletteItem) => void;
  onClose?: () => void;
  filter?: PaletteFilter;
  /** Wrap around when arrowing past either end. Defaults to true. */
  loop?: boolean;
}

interface State {
  query: string;
  activeIndex: number;
}

type Action = { type: "query"; query: string } | { type: "edge"; index: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "query":
      return { query: action.query, activeIndex: 0 };
    case "edge":
      return { ...state, activeIndex: action.index };
    default:
      return state;
  }
}

export interface PaletteApi {
  baseId: string;
  query: string;
  activeIndex: number;
  results: PaletteItem[];
  isEmpty: boolean;
  setQuery: (query: string) => void;
  select: (index: number) => void;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  getListProps: () => React.HTMLAttributes<HTMLUListElement> & { role: "listbox" };
  getItemProps: (
    item: PaletteItem,
    index: number,
  ) => React.LiHTMLAttributes<HTMLLIElement> & { role: "option" };
}

const defaultFilter: PaletteFilter = (item, query) => {
  if (query.trim() === "") return true;
  const needle = query.trim().toLowerCase();
  return (
    item.label.toLowerCase().includes(needle) ||
    (item.keywords ?? []).some((keyword) => keyword.toLowerCase().includes(needle))
  );
};

/**
 * Headless state for a modal command palette.
 *
 * Filtering is plain substring matching by default; pass `filter` to replace it.
 * Results are sorted by label so the list is stable while typing.
 */
export function useCommandPalette({
  id,
  items,
  onSelect,
  onClose,
  filter = defaultFilter,
  loop = true,
}: PaletteOptions): PaletteApi {
  const generatedId = useId();
  const baseId = `palette-${id ?? generatedId}`;
  const [state, dispatch] = useReducer(reducer, { query: "", activeIndex: 0 });

  const results = useMemo(() => {
    if (state.query.trim() === "") return items;
    return items
      .filter((item) => filter(item, state.query))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items, filter, state.query]);

  const enabledIndices = useMemo(
    () => results.reduce<number[]>((acc, item, index) => (item.disabled ? acc : [...acc, index]), []),
    [results],
  );

  const setQuery = useCallback((query: string) => dispatch({ type: "query", query }), []);

  const move = useCallback(
    (delta: number) => {
      if (enabledIndices.length === 0) return;
      const current = enabledIndices.indexOf(state.activeIndex);
      const next =
        current === -1
          ? delta > 0
            ? 0
            : enabledIndices.length - 1
          : Math.min(Math.max(current + delta, 0), enabledIndices.length - 1);
      const wrapped = loop
        ? (next + enabledIndices.length) % enabledIndices.length
        : next;
      dispatch({ type: "edge", index: enabledIndices[wrapped] });
    },
    [enabledIndices, loop, state.activeIndex],
  );

  const select = useCallback(
    (index: number) => {
      const item = results[index];
      if (!item || item.disabled) return;
      onSelect(item);
      dispatch({ type: "query", query: "" });
    },
    [results, onSelect],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          move(1);
          break;
        case "ArrowUp":
          event.preventDefault();
          move(-1);
          break;
        case "Home":
          event.preventDefault();
          if (enabledIndices.length > 0) dispatch({ type: "edge", index: enabledIndices[0] });
          break;
        case "End":
          event.preventDefault();
          if (enabledIndices.length > 0) {
            dispatch({ type: "edge", index: enabledIndices[enabledIndices.length - 1] });
          }
          break;
        case "Enter":
          event.preventDefault();
          select(state.activeIndex);
          break;
        case "Escape":
          event.preventDefault();
          if (state.query !== "") setQuery("");
          else onClose?.();
          break;
      }
    },
    [enabledIndices, move, onClose, select, setQuery, state.activeIndex, state.query],
  );

  const getInputProps = useCallback(
    (): React.InputHTMLAttributes<HTMLInputElement> => ({
      id: `${baseId}-input`,
      role: "combobox" as const,
      "aria-expanded": true,
      "aria-controls": `${baseId}-list`,
      "aria-autocomplete": "list" as const,
      "aria-activedescendant":
        results.length > 0 ? `${baseId}-item-${state.activeIndex}` : undefined,
      autoComplete: "off",
      value: state.query,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
      onKeyDown,
    }),
    [baseId, onKeyDown, results.length, setQuery, state.activeIndex, state.query],
  );

  const getListProps = useCallback(
    (): React.HTMLAttributes<HTMLUListElement> & { role: "listbox" } => ({
      id: `${baseId}-list`,
      role: "listbox" as const,
      "aria-label": "Commands",
    }),
    [baseId],
  );

  const getItemProps = useCallback(
    (item: PaletteItem, index: number): React.LiHTMLAttributes<HTMLLIElement> & { role: "option" } => ({
      id: `${baseId}-item-${index}`,
      role: "option" as const,
      "aria-selected": index === state.activeIndex,
      "aria-disabled": item.disabled || undefined,
      /** Keep focus in the input while moving with the mouse. */
      onMouseDown: (event: React.MouseEvent<HTMLElement>) => event.preventDefault(),
      onMouseMove: () => dispatch({ type: "edge", index }),
      onClick: () => select(index),
    }),
    [baseId, select, state.activeIndex],
  );

  return {
    baseId,
    query: state.query,
    activeIndex: state.activeIndex,
    results,
    isEmpty: results.length === 0,
    setQuery,
    select,
    getInputProps,
    getListProps,
    getItemProps,
  };
}
