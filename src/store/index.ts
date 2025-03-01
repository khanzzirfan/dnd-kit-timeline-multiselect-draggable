import { generateItems, generateRows } from "@/lib/utils";
import { endOfDay, startOfDay } from "date-fns";
import type { ItemDefinition, Range, RowDefinition } from "dnd-timeline";
import { atom } from "jotai";
import type { ItemDefinitionSelect } from "../types/ItemDefinition";

const DEFAULT_RANGE: Range = {
  start: startOfDay(new Date()).getTime(),
  end: endOfDay(new Date()).getTime(),
};

const DEFAULT_ROWS = generateRows(4);
const DEFAULT_ITEMS = generateItems(10, DEFAULT_RANGE, DEFAULT_ROWS);

export const rangeAtom = atom<Range>(DEFAULT_RANGE);
export const rowsAtom = atom<RowDefinition[]>(DEFAULT_ROWS);
export const itemsAtom = atom<ItemDefinitionSelect[]>(DEFAULT_ITEMS);
