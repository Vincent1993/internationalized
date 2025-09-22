import { FormatPlugin, PluginExecutionContext } from "../types";

/**
 * **预处理插件**
 * 负责固定小数位数，通过设置 minimumFractionDigits 和 maximumFractionDigits 为相同值。
 */
export const fixDecimalsPlugin: FormatPlugin = {
  name: 'fix-decimals-plugin',
  version: '2.0.0',
  description: '固定小数位数',
  priority: 100,
  phase: 'pre-process',
  isApplicable: (context: PluginExecutionContext) =>
    Number.isInteger(context.extend?.extend_fixDecimals),
  processOptions: (options: Intl.NumberFormatOptions, context?: PluginExecutionContext) => {
    const { minimumFractionDigits, maximumFractionDigits, ...restOptions } = options;
    return {
      ...restOptions,
      minimumFractionDigits: context?.extend?.extend_fixDecimals,
      maximumFractionDigits: context?.extend?.extend_fixDecimals,
    };
  },
};
