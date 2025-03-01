import { useItem } from "dnd-timeline";
import type { Span } from "dnd-timeline";
import React, { useRef, useEffect } from "react";
import { useState, useImperativeHandle } from "react";

interface ItemProps {
  id: string;
  span: Span;
  children: React.ReactNode;
  selected: boolean;
  parentRef: React.MutableRefObject<any>;
}

// Define the ref interface for clarity
export interface ItemRefHandle {
  setSpan: (span: Span) => void;
  updateTransform: (deltaX: number, deltaY) => void;
}

const COLORS = [
  "border-red-400",
  "border-amber-400",
  "border-lime-400",
  "border-emerald-400",
  "border-cyan-400",
  "border-blue-400",
  "border-violet-400",
  "border-fuchsia-400",
  "border-rose-400",
];

function hashCode(str: string) {
  let hash = 0;
  if (str.length === 0) return hash;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    // Convert to 32-bit integer
    hash = hash & hash;
  }

  return hash;
}

function Item(props: ItemProps) {
  const { parentRef } = props;
  const [bgColor] = useState(COLORS[hashCode(props.id) % COLORS.length]);
  const selectedBorderColor = "border-yellow-500"; // Unique border color for selected items
  const itemRef = useRef<HTMLDivElement>(null);
  const [localSpan, setLocalSpan] = useState(props.span);

  const { setNodeRef, attributes, listeners, itemStyle, itemContentStyle } =
    useItem({
      id: props.id,
      span: localSpan, // Use localSpan instead of props.span directly
    });

  // Update localSpan when props.span changes
  useEffect(() => {
    setLocalSpan(props.span);
  }, [props.span]);

  // Combine refs (our local ref and the one from useItem)
  const combinedRef = (node: HTMLDivElement | null) => {
    itemRef.current = node;
    setNodeRef(node);
  };

  return (
    <div
      ref={combinedRef}
      style={{
        ...itemStyle,
        transition: props.selected ? "none" : itemStyle.transition, // Remove transition for selected items during drag
      }}
      {...listeners}
      {...attributes}
      data-testid="item-wrapper"
      className="selecto-item"
      id={props.id}
      data-id={props.id}
    >
      <div
        style={itemContentStyle}
        data-testid="timeline-item-content"
        className="unselectable"
      >
        <div
          className={`border-2 rounded-sm shadow-md w-full overflow-hidden flex flex-row pl-3 items-center ${
            props.selected ? selectedBorderColor : bgColor
          } ${props.selected ? "bg-stripes" : ""} unselectable`}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default Item;
