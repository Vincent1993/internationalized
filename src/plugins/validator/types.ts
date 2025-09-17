/**
 * @file 校验插件相关类型定义
 */

/**
 * 定义一个校验规则的结构。
 */
export interface ValidationRule {
  /**
   * 规则的唯一标识符。
   */
  key: string;

  /**
   * 验证函数，接收格式化选项并返回是否有效。
   * @param options - 待验证的格式化选项。
   * @returns 如果选项有效，则返回 `true`，否则返回 `false`。
   */
  isValid: (options: Intl.NumberFormatOptions) => boolean;

  /**
   * 生成错误消息的函数。
   * @param options - 无效的格式化选项。
   * @returns 描述错误的字符串。
   */
  errorMessage: (options: Intl.NumberFormatOptions) => string;

  /**
   * (可选) 在生产环境中用于静默修复无效选项的函数。
   * @param options - 无效的格式化选项。
   * @returns 修复后的格式化选项。
   */
  fix?: (options: Intl.NumberFormatOptions) => Intl.NumberFormatOptions;
}
