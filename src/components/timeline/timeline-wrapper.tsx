import { itemsAtom } from "@/store";
import { endOfDay, startOfDay } from "date-fns";
import type { DragEndEvent, Range, ResizeEndEvent } from "dnd-timeline";
import { TimelineContext } from "dnd-timeline";
import Selecto from "react-selecto";
import { emitCustomEvent } from "react-custom-events";
import { useAtom, useSetAtom } from "jotai";
import type { PropsWithChildren } from "react";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { ItemDefinitionSelect } from "@/types/ItemDefinition";

const DEFAULT_RANGE: Range = {
  start: startOfDay(new Date()).getTime(),
  end: endOfDay(new Date()).getTime(),
};

function TimelineWrapper(props: PropsWithChildren) {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [multiSelectItemIds, setMultiSelectItemIds] = useState<string[]>([]);

  const containerRef = useRef(null);
  const scrollBarRef = useRef(null);
  const initialPositionsRef = useRef(new Map());
  const selectoRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [items, setItemsAtom] = useAtom(itemsAtom);
  const setItems = useSetAtom(itemsAtom);

  useEffect(() => {
    // set multi select item ids
    const selectedItems = items.filter((item) => item.selected);
    const selectedIds = selectedItems.map((item) => item.id);
    setMultiSelectItemIds(selectedIds);
  }, [items]);

  const onResizeEnd = useCallback(
    (event: ResizeEndEvent) => {
      const updatedSpan =
        event.active.data.current.getSpanFromResizeEvent?.(event);

      if (!updatedSpan) return;

      const activeItemId = event.active.id;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== activeItemId) return item;

          return {
            ...item,
            span: updatedSpan,
          };
        })
      );
    },
    [setItems]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeRowId = event.over?.id as string;
      const updatedSpan =
        event.active.data.current.getSpanFromDragEvent?.(event);

      if (!updatedSpan || !activeRowId) return;

      const activeItemId = event.active.id as string;

      setItems((prev) => {
        const selectedItems = new Set(
          multiSelectItemIds.map((itemId) => itemId)
        );
        if (selectedItems.has(activeItemId) && selectedItems.size > 1) {
          // Update all multi-selected items
          return prev.map((item) => {
            if (selectedItems.has(item.id)) {
              const initialPosition = initialPositionsRef.current.get(item.id);
              if (initialPosition) {
                return {
                  ...item,
                  rowId: activeRowId,
                  span: {
                    start: updatedSpan.start + initialPosition.relativeStart,
                    end: updatedSpan.start + initialPosition.relativeEnd,
                  },
                };
              }
            }
            return item;
          });
        } else {
          // Update only the active item
          return prev.map((item) => {
            if (item.id !== activeItemId) return item;

            return {
              ...item,
              rowId: activeRowId,
              span: updatedSpan,
            };
          });
        }
      });
    },
    [items, setItems, multiSelectItemIds]
  );
  const clearMultiSelectElements = useCallback(() => {
    setItems((prev) =>
      prev.map((item) => {
        return {
          ...item,
          selected: false,
        };
      })
    );
  }, [items]);

  // Handle Selecto events
  const onSelectStart = useCallback((e: any) => {
    if (isDraggingRef.current) {
      if (selectoRef.current && selectoRef.current.stop) {
        selectoRef.current.stop();
      }
      return;
    }
    // If not extending selection (with Ctrl/Cmd), clear previous selection
    if (!e.ctrlKey && !e.metaKey) {
      clearMultiSelectElements();
    }
  }, []);

  const onSelectEnd = useCallback(
    (e) => {
      const selectedElements = e.selected;
      if (selectedElements.length === 0) {
        return;
      }

      // Map the selected DOM elements to timeline items
      const selectedItemIds = selectedElements
        .map((el) => {
          const id = el.id;
          return items.find((item) => item.id === id)?.id;
        })
        .filter(Boolean);

      setItemsAtom((prev) =>
        prev.map((item) => {
          const isSelected = selectedItemIds.some(
            (itemId) => itemId === item.id
          );

          return {
            ...item,
            selected: isSelected,
          };
        })
      );
    },
    [items, setItems]
  );

  // Check for dragstart events on timeline items to cancel Selecto
  useEffect(() => {
    const handleMouseDown = (e) => {
      // If the click is on a timeline item or handle, we want to prepare for potential dragging
      if (
        e.target.closest('[data-testid="item-wrapper"]') ||
        e.target.closest('[data-testid="right-handle"]')
      ) {
        isDraggingRef.current = true;
        if (selectoRef.current && selectoRef.current.stop) {
          selectoRef.current.stop();
        }
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const onDragStart = useCallback(
    (event) => {
      // Cancel any active Selecto selection when item dragging starts
      if (selectoRef.current && selectoRef.current.stop) {
        selectoRef.current.stop();
      }
      isDraggingRef.current = true;
      const { active } = event;
      // Store initial positions of all selected items
      initialPositionsRef.current = new Map();
      const activeItem = items.find((item) => item.id === active.id);
      const selectedItems = new Set(multiSelectItemIds.map((itemId) => itemId));
      if (selectedItems.has(active.id) && selectedItems.size > 1) {
        // Store relative positions for all selected items
        const activeStart = activeItem.span.start;
        items.forEach((item) => {
          if (selectedItems.has(item.id)) {
            initialPositionsRef.current.set(item.id, {
              relativeStart: item.span.start - activeStart,
              relativeEnd: item.span.end - activeStart,
              rowId: item.rowId,
            });
          }
        });
      }
      emitCustomEvent("ON_SEGMENT_DRAG_START", {
        dragItemId: event.active?.id,
      });
    },
    [multiSelectItemIds, items]
  );

  const onDragMove = useCallback(
    (event) => {
      const { active } = event;
      const activeItem = items.find((item) => item.id === active.id);
      if (!activeItem) {
        return;
      }

      const updatedSpan =
        event.active.data.current.getSpanFromDragEvent?.(event);
      if (!updatedSpan) {
        return;
      }

      const { x: deltaX, y: deltaY } = event?.delta || {};
      if (!deltaX || !deltaY) {
        return;
      }

      const selectedItems = new Set(multiSelectItemIds.map((itemId) => itemId));
      // Handle group dragging
      if (selectedItems.has(active.id) && selectedItems.size > 1) {
        const activeStart = updatedSpan.start;
        const selectedItemPositions: ItemDefinitionSelect[] = [];

        selectedItems.forEach((itemId) => {
          const item = items.find((i) => i.id === itemId);
          if (item && itemId !== active.id) {
            const initialPosition = initialPositionsRef.current.get(itemId);
            if (initialPosition) {
              selectedItemPositions.push({
                id: itemId,
                span: {
                  start: activeStart + initialPosition.relativeStart,
                  end: activeStart + initialPosition.relativeEnd,
                },
                selected: item.selected,
                rowId: item.rowId,
                disabled: item.disabled,
              });
            }
          }
        });

        console.log("event on drag move", event);
        const positionsExceptActiveItem = selectedItemPositions.filter(
          (pos) => pos.id !== active.id
        );

        // Emit event for visualizing all moving items
        emitCustomEvent("UPDATE_GROUP_DRAG_POSITIONS", {
          positions: [...positionsExceptActiveItem],
        });
      }
    },
    [items, multiSelectItemIds]
  );

  return (
    <TimelineContext
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onResizeEnd={onResizeEnd}
      onRangeChanged={setRange}
      onDragMove={onDragMove}
      range={range}
    >
      {/* Add Selecto for drag selection */}
      <Selecto
        ref={selectoRef}
        dragContainer={scrollBarRef.current}
        selectableTargets={['[data-testid="item-wrapper"]']}
        hitRate={0}
        selectByClick={false}
        selectFromInside={false}
        toggleContinueSelect={["shift"]}
        ratio={0}
        onSelectStart={onSelectStart as any}
        onSelect={onSelectEnd}
        scrollOptions={{
          container: scrollBarRef.current,
          threshold: 30,
          throttleTime: 30,
        }}
        onDragStart={(e) => {
          // Cancel selection if clicking on specific elements
          const target = e.inputEvent.target;
          const itemcontent = target.closest(".unselectable");

          if (isDraggingRef.current || itemcontent) {
            e.stop();
          }
        }}
        // @ts-ignore
        style={{
          position: "fixed",
          zIndex: 999,
          border: "2px dashed #f76910",
          backgroundColor: "rgba(247, 105, 16, 0.1)",
          display: isDraggingRef.current ? "none" : "block",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
        className="dndtimelinex1"
        ref={containerRef}
      >
        {props.children}
      </div>
    </TimelineContext>
  );
}

export default TimelineWrapper;
