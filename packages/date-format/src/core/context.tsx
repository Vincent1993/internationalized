import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import type { DateFormatContextValue, DateFormatProviderProps } from './types';

const DateFormatContext = createContext<DateFormatContextValue | null>(null);

/**
 * @name DateFormatProvider
 * @description 提供日期时间格式化上下文的 React 组件。它会缓存传入的 `options`
 * 并向所有子组件、Hook 共享，便于在应用内统一 locale、时区等配置。
 *
 * @since 0.0.1
 *
 * @example
 * ```tsx
 * import { DateFormatProvider, DateFormat } from '@internationalized/date-format';
 *
 * export function App() {
 *   return (
 *     <DateFormatProvider options={{ locale: 'zh-CN', timeZone: 'Asia/Shanghai' }}>
 *       <DateFormat value={new Date()} timeStyle="short" dateStyle="medium" />
 *     </DateFormatProvider>
 *   );
 * }
 * ```
 */
export function DateFormatProvider({ children, options }: DateFormatProviderProps) {
  const memoized = useMemo(() => options ?? null, [options]);

  return <DateFormatContext.Provider value={memoized}>{children}</DateFormatContext.Provider>;
}

/**
 * @name useDateFormatContext
 * @description 读取最近的 `DateFormatProvider` 上下文，供自定义组件或 Hook 访问日期配置。
 *
 * @since 0.0.1
 *
 * @returns 当前上下文配置；若不存在 Provider，则返回 `null`
 */
export function useDateFormatContext(): DateFormatContextValue | null {
  return useContext(DateFormatContext);
}

export type { DateFormatContextValue };
export type DateFormatProviderComponentProps = PropsWithChildren<DateFormatProviderProps>;
