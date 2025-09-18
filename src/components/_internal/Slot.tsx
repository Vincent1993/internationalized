import { cloneElement, forwardRef, isValidElement, ReactNode } from 'react';

/**
 * Simple Slot Implementation
 */
export const Slot = forwardRef<HTMLElement, { children?: ReactNode }>(({ children }, ref) => {
  if (!isValidElement(children)) return null;
  return cloneElement(children, { ref } as Partial<typeof children.props>);
});

/* v8 ignore next */
Slot.displayName = 'NumberFormatSlot';
