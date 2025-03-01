import { type ClassValue, clsx } from "clsx";
import { minutesToMilliseconds } from "date-fns";
import type { ItemDefinition, Range, RowDefinition, Span } from "dnd-timeline";
import { nanoid } from "nanoid";
import { twMerge } from "tailwind-merge";
import type { ItemDefinitionSelect } from "../types/ItemDefinition";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GenerateRowsOptions {
  disabled?: boolean;
}

export const generateRows = (count: number, options?: GenerateRowsOptions) => {
  return Array(count)
    .fill(0)
    .map((): RowDefinition => {
      const disabled = options?.disabled;

      let id = `${nanoid(4)}`;
      if (disabled) id += " (disabled)";

      return {
        id,
        disabled,
      };
    });
};

const getRandomInRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const DEFAULT_MIN_DURATION = minutesToMilliseconds(60);
const DEFAULT_MAX_DURATION = minutesToMilliseconds(360);

export const generateRandomSpan = (
  range: Range,
  minDuration: number = DEFAULT_MIN_DURATION,
  maxDuration: number = DEFAULT_MAX_DURATION
): Span => {
  const duration = getRandomInRange(minDuration, maxDuration);

  const start = getRandomInRange(range.start, range.end - duration);

  const end = start + duration;

  return {
    start: start,
    end: end,
  };
};

interface GenerateItemsOptions {
  disabled?: boolean;
  background?: boolean;
  minDuration?: number;
  maxDuration?: number;
}

export const generateItems = (
  count: number,
  range: Range,
  rows: RowDefinition[],
  options?: GenerateItemsOptions
) => {
  return Array(count)
    .fill(0)
    .map((): ItemDefinitionSelect => {
      const row = rows[Math.ceil(Math.random() * rows.length - 1)];
      const rowId = row.id;
      const disabled = row.disabled || options?.disabled;

      const span = generateRandomSpan(
        range,
        options?.minDuration,
        options?.maxDuration
      );

      let id = `${nanoid(4)}`;
      if (disabled) id += " (disabled)";

      return {
        id,
        rowId,
        span,
        disabled,
        selected: false,
      };
    });
};
