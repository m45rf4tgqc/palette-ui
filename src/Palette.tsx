import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useCommandPalette } from "./useCommandPalette";
import type { PaletteApi, PaletteOptions } from "./useCommandPalette";
import type { PaletteItem } from "./types";

export interface PaletteProps extends PaletteOptions {
  children: (palette: PaletteApi) => ReactNode;
}

const PaletteContext = createContext<PaletteApi | null>(null);

function usePalette(): PaletteApi {
  const palette = useContext(PaletteContext);
  if (!palette) throw new Error("Palette components must be rendered inside <Palette>");
  return palette;
}

/**
 * Render-prop root. Children receive the palette API, and the compound
 * components below read the same context.
 */
export function Palette({ children, ...options }: PaletteProps) {
  const palette = useCommandPalette(options);
  return <PaletteContext.Provider value={palette}>{children(palette)}</PaletteContext.Provider>;
}

export function PaletteInput({ placeholder }: { placeholder?: string }) {
  const { getInputProps } = usePalette();
  return <input {...getInputProps()} placeholder={placeholder} className="palette-input" />;
}

export function PaletteList({ children }: { children: ReactNode }) {
  const { getListProps } = usePalette();
  return <ul {...getListProps()} className="palette-list">{children}</ul>;
}

export function PaletteItem({
  item,
  index,
  children,
}: {
  item: PaletteItem;
  index: number;
  children: ReactNode;
}) {
  const { getItemProps } = usePalette();
  return <li {...getItemProps(item, index)}>{children}</li>;
}
