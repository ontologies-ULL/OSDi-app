import { useState } from 'react';

/**
 * Manages a list of expandable items (e.g. cost cards, utility cards).
 * Returns [items, expandedIndices, handlers]
 *
 * handlers: { update(index, updatedItem), add(), delete(index), toggle(index) }
 */
function useExpandableList(initialItems, emptyTemplate) {
  const [items, setItems] = useState(
    initialItems?.length > 0 ? initialItems : [{ ...emptyTemplate }]
  );
  const [expanded, setExpanded] = useState([0]);

  const handlers = {
    update: (index, updated) =>
      setItems(prev => {
        const next = [...prev];
        next[index] = updated;
        return next;
      }),

    add: () =>
      setItems(prev => {
        const next = [...prev, { ...emptyTemplate }];
        setExpanded(exp => [...exp, next.length - 1]);
        return next;
      }),

    delete: (index) => {
      setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
      setExpanded(prev =>
        prev.filter(i => i !== index).map(i => i > index ? i - 1 : i)
      );
    },

    toggle: (index) =>
      setExpanded(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      ),

    reset: (newItems) => {
      setItems(newItems?.length > 0 ? newItems : [{ ...emptyTemplate }]);
      setExpanded([0]);
    },
  };

  return [items, expanded, handlers];
}

export default useExpandableList;
