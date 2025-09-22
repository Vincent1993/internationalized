import { cloneElement, forwardRef, isValidElement, ReactNode } from 'react';

/**
 * @zh 一个极简的 Slot 组件，用于支持 `asChild` 模式
 */
export const Slot = forwardRef<HTMLElement, { children?: ReactNode }>(({ children }, ref) => {
  if (!isValidElement(children)) return null;
  return cloneElement(children, { ref } as Partial<typeof children.props>);
});

/* v8 ignore next */
Slot.displayName = 'SharedSlot';
