import { NumberFormat } from './components';
import { NumberFormatProvider } from './core';

/**
 * @deprecated 旧版的 Format 对象，为了向后兼容而保留。
 *   请直接导入 `NumberFormat` 和 `NumberFormatProvider` 组件。
 * @example
 * ```diff
 * - import { Format } from '@your-package/number-format';
 * + import { NumberFormat, NumberFormatProvider } from '@your-package/number-format';
 *
 * - <Format.Provider>
 * + <NumberFormatProvider>
 *     ...
 * -   <Format.Number value={123} />
 * +   <NumberFormat value={123} />
 *     ...
 * - </Format.Provider>
 * + </NumberFormatProvider>
 * ```
 */
export const Format = {
  Number: NumberFormat,
  Provider: NumberFormatProvider,
};
