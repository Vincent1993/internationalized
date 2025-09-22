/**
 * @file 运行时校验插件
 * @description 在格式化前对传入的 options 进行校验。
 *   - 开发环境：遇到错误配置时直接抛出异常。
 *   - 生产环境：对可修复的错误进行静默处理，保证程序健壮性。
 */

import type { FormatPlugin } from '../types';
import { validationRules } from './rules';

export const validatorPlugin: FormatPlugin = {
  name: 'validator',
  version: '1.0.0',
  description: '对格式化选项进行运行时校验，在开发环境抛出错误，在生产环境静默修复。',
  phase: 'pre-process',
  priority: 10, // 高优先级，确保在所有其他选项处理插件之前运行

  isApplicable: () => true, // 对所有格式化操作都适用

  processOptions: (options: Intl.NumberFormatOptions): Intl.NumberFormatOptions => {
    // 创建一个可变副本以进行可能的修改
    let newOptions: Intl.NumberFormatOptions = { ...options };

    for (const rule of validationRules) {
      if (!rule.isValid(newOptions)) {
        if (process.env.NODE_ENV !== 'production') {
          // 在开发环境中，构造详细错误信息并抛出
          const errorMessage = `[number-format-validator] 配置错误: ${rule.errorMessage(
            newOptions,
          )} \n有问题的配置: ${JSON.stringify(newOptions)}`;
          throw new Error(errorMessage);
        } else {
          // 在生产环境中，如果存在修复逻辑，则应用修复
          if (rule.fix) {
            const fixedOptions = rule.fix(newOptions);
            if (fixedOptions) {
              newOptions = { ...fixedOptions };
            }
          }
        }
      }
    }

    return newOptions;
  },
};
