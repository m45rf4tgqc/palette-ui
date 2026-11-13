export interface PaletteItem {
  /** Stable identifier, also used to build ARIA ids. */
  id: string;
  /** Text shown to the user and matched against the query. */
  label: string;
  /** Optional group heading, rendered by the consumer. */
  group?: string;
  /** Extra terms that should match even when the label does not. */
  keywords?: string[];
  disabled?: boolean;
}

export type PaletteFilter = (item: PaletteItem, query: string) => boolean;
