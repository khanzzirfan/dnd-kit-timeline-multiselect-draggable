import { generateItems } from "@/lib/utils";
import { itemsAtom, rowsAtom } from "@/store";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useVirtualizer } from "@tanstack/react-virtual";
import { groupItemsToSubrows, useTimelineContext } from "dnd-timeline";
import { useAtom, useAtomValue } from "jotai";
import React, { useMemo } from "react";
import { InlineCode } from "../ui/Inline-code";
import { Button } from "../ui/button";
import Row from "./row";
import Sidebar from "./sidebar";
import Subrow from "./subrow";
import ItemWrapper from "./item-wrapper";

function Timeline() {
  const rows = useAtomValue(rowsAtom);
  const [items, setItems] = useAtom(itemsAtom);
  const { setTimelineRef, style, range, timelineRef } = useTimelineContext();

  // console.log("timeline items", items);
  // const regenerateItems = () => {
  //   setItems(generateItems(50, range, rows));
  // };

  const groupedSubrows = useMemo(
    () => groupItemsToSubrows(items, range),
    [items, range]
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getItemKey: (index) => rows[index].id,
    getScrollElement: () => timelineRef.current,
    estimateSize: (index) => (groupedSubrows[rows[index].id]?.length || 1) * 50,
  });

  // console.log("grouped rows", groupedSubrows);
  // console.log("timeline-wrapper-styles", style);

  return (
    <div className="flex max-w-7xl flex-col w-full gap-3 bg-background">
      <div
        className="select-none rounded-lg border shadow-2xl shadow-slate-900"
        ref={setTimelineRef}
        style={{
          ...style,
          maxHeight: 400,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            minHeight: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Row id={virtualRow.key as string} key={virtualRow.key}>
                {groupedSubrows[virtualRow.key]?.map((subrow, index) => (
                  <Subrow key={`${virtualRow.key}-${index}-${subrow[0].id}`}>
                    {subrow.map((item) => (
                      <ItemWrapper
                        id={item.id}
                        key={`${item.id}-${item.span.start}-${item.span.end}`}
                        span={item.span}
                        selected={item.selected}
                      >
                        {`Item ${item.id}`}
                      </ItemWrapper>
                    ))}
                  </Subrow>
                ))}
              </Row>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Timeline;
