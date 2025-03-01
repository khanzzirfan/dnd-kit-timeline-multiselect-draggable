import type { ItemDefinition, Range, RowDefinition } from "dnd-timeline";
import { atom } from "jotai";

export interface ItemDefinitionSelect extends ItemDefinition {
  selected: boolean;
}
