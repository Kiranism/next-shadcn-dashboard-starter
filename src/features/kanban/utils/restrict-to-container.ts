import type { Modifier } from '@dnd-kit/core';

export function createRestrictToContainer(getElement: () => HTMLElement | null): Modifier {
  return ({ transform, draggingNodeRect, containerNodeRect: _containerNodeRect }) => {
    const container = getElement();

    if (!draggingNodeRect || !container) {
      return transform;
    }

    const rect = container.getBoundingClientRect();

    const minX = rect.left - draggingNodeRect.left;
    const maxX = rect.right - draggingNodeRect.right;
    const minY = rect.top - draggingNodeRect.top;
    const maxY = rect.bottom - draggingNodeRect.bottom;

    return {
      ...transform,
      x: Math.min(Math.max(transform.x, minX), maxX),
      y: Math.min(Math.max(transform.y, minY), maxY)
    };
  };
}
