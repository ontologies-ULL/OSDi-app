/**
 * @file useExpandableList.js
 * @brief Custom hook for managing a list of expandable card items.
 *
 * Tracks both the item array and the set of currently expanded indices.
 * The list always contains at least one item (seeded from `emptyTemplate` when
 * `initialItems` is empty). The first item starts expanded.
 *
 * Typical consumers: cost cards, utility cards, effect cards, detection-parameter
 * cards in the OSDi form pages.
 *
 * @module hooks/useExpandableList
 */

import { useState } from 'react';

/**
 * @brief Manages a list of expandable items with add, update, delete, and toggle operations.
 *
 * @param {Array<Object>} initialItems   - Pre-populated item array. When empty or falsy,
 *   the list is seeded with a single copy of `emptyTemplate`.
 * @param {Object}        emptyTemplate  - Plain object used as the blueprint for new items
 *   appended via `handlers.add()` or when the list would otherwise be empty.
 *
 * @returns {[Array<Object>, number[], Object]} A three-element tuple:
 *   - `items`    — current array of item objects.
 *   - `expanded` — array of indices that are currently in the expanded state.
 *   - `handlers` — object with five mutation functions:
 *     - `update(index, updatedItem)` — replaces the item at `index` with `updatedItem`.
 *     - `add()`                      — appends a blank item and expands it.
 *     - `delete(index)`              — removes the item at `index` (no-op when only one item remains); adjusts expanded indices.
 *     - `toggle(index)`              — adds or removes `index` from the expanded set.
 *     - `reset(newItems)`            — replaces the list with `newItems` (or a single blank item) and collapses all but the first.
 */
function useExpandableList(initialItems, emptyTemplate) {
  const [items, setItems] = useState(
    initialItems?.length > 0 ? initialItems : [{ ...emptyTemplate }]
  );
  const [expanded, setExpanded] = useState([0]);

  const handlers = {
    /**
     * @brief Replaces the item at `index` with the provided `updated` object.
     * @param {number} index   - Zero-based position of the item to replace.
     * @param {Object} updated - New item value.
     */
    update: (index, updated) =>
      setItems(prev => {
        const next = [...prev];
        next[index] = updated;
        return next;
      }),

    /**
     * @brief Appends a blank item (copy of `emptyTemplate`) and marks it as expanded.
     */
    add: () =>
      setItems(prev => {
        const next = [...prev, { ...emptyTemplate }];
        setExpanded(exp => [...exp, next.length - 1]);
        return next;
      }),

    /**
     * @brief Removes the item at `index`. Does nothing when only one item remains.
     * Collapsed/expanded indices above the removed position are decremented by one.
     * @param {number} index - Zero-based position of the item to remove.
     */
    delete: (index) => {
      setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
      setExpanded(prev =>
        prev.filter(i => i !== index).map(i => i > index ? i - 1 : i)
      );
    },

    /**
     * @brief Toggles the expanded state for the item at `index`.
     * @param {number} index - Zero-based position of the item to toggle.
     */
    toggle: (index) =>
      setExpanded(prev =>
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      ),

    /**
     * @brief Resets the list to `newItems` (or a single blank item) and collapses all but index 0.
     * @param {Array<Object>} newItems - Replacement item array.
     */
    reset: (newItems) => {
      setItems(newItems?.length > 0 ? newItems : [{ ...emptyTemplate }]);
      setExpanded([0]);
    },
  };

  return [items, expanded, handlers];
}

export default useExpandableList;
