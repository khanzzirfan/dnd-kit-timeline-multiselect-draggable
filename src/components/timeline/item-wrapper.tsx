import { useItem } from "dnd-timeline";
import type { Span } from "dnd-timeline";
import React, { useEffect } from "react";
import { useCustomEventListener } from "react-custom-events";
import { useState, useRef } from "react";
import Item from "./item";
import { ItemDefinitionSelect } from "@/types/ItemDefinition";

interface ItemWrapperProps {
  id: string;
  span: Span;
  children: React.ReactNode;
  selected: boolean;
}

interface positions extends ItemDefinitionSelect {}

const ItemWrapper = (props: ItemWrapperProps) => {
  const item = props;
  const { id } = item;
  const [span, setSpan] = useState(item.span);
  const itemWrapperRef = useRef(null);

  useEffect(() => {
    setSpan(item.span);
  }, [item.span]);

  useCustomEventListener(
    "UPDATE_GROUP_DRAG_POSITIONS",
    (data: { positions: positions[] }) => {
      const { positions } = data || {};
      if (positions.length > 0) {
        const itemToUpdate = positions.find((pos) => pos.id === id);
        if (itemToUpdate) {
          const { span: spanToUpdate } = itemToUpdate;
          setSpan(spanToUpdate);
        }
      }
    }
  );

  return <Item {...props} span={span} parentRef={itemWrapperRef} />;
};

export default ItemWrapper;
