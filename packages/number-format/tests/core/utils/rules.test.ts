/**
 * @file 规则合并工具函数测试 (mergeRules)
 * @description
 *   本测试文件旨在全面验证 `mergeRules` 函数的正确性和健壮性。
 *   `mergeRules` 负责合并数字格式化的指标规则数组，是实现配置继承和覆盖的核心逻辑。
 *
 *   测试覆盖范围包括：
 *   1.  **基础合并场景**：验证不同规则、同名规则、同模式规则的合并与覆盖逻辑。
 *   2.  **边缘与异常情况**：
 *       - 空数组处理：验证当一个或两个输入数组为空时的行为。
 *       - 深度合并：确保 `options` 对象被正确地深度合并，而不是浅层覆盖。
 *       - 不规范规则：测试当规则同时包含 `name` 和 `pattern` 时的纠正机制。
 *       - 属性缺失：验证当规则缺少 `options` 属性时的合并行为。
 *       - 无效正则：测试当 `pattern` 为无效正则表达式字符串时的处理。
 */
/**
 * @file 规则合并工具函数测试 (mergeRules)
 * @description
 *   本测试文件旨在全面验证 `mergeRules` 函数的正确性和健壮性。
 *   `mergeRules` 负责合并数字格式化的指标规则数组，是实现配置继承和覆盖的核心逻辑。
 *
 *   测试覆盖范围包括：
 *   1.  **基础合并场景**：验证不同规则、同名规则、同模式规则的合并与覆盖逻辑。
 *   2.  **边缘与异常情况**：
 *       - 空数组处理：验证当一个或两个输入数组为空时的行为。
 *       - 深度合并：确保 `options` 对象被正确地深度合并，而不是浅层覆盖。
 *       - 不规范规则：测试当规则同时包含 `name` 和 `pattern` 时的纠正机制。
 *       - 属性缺失：验证当规则缺少 `options` 属性时的合并行为。
 *       - 无效正则：测试当 `pattern` 为无效正则表达式字符串时的处理。
 */

import { mergeRules } from '../../../src/core/utils/rules';
import type { MetricFormatRule } from '../../../src/core/types';

describe('mergeRules', () => {
  const baseRules: MetricFormatRule[] = [
    { name: 'currency', options: { style: 'currency', currency: 'USD' } },
    { pattern: /_rate$/, options: { style: 'percent' } },
  ];

  describe('基础合并场景', () => {
    it('should return the right array if the left is empty', () => {
      expect(mergeRules([], baseRules)).toEqual(baseRules);
    });

    it('should return the left array if the right is empty', () => {
      expect(mergeRules(baseRules, [])).toEqual(baseRules);
    });

    it('should merge different rules', () => {
      const newRules: MetricFormatRule[] = [{ name: 'volume', options: { style: 'decimal' } }];
      const result = mergeRules(baseRules, newRules);
      expect(result).toHaveLength(3);
      expect(result[2]).toEqual(newRules[0]);
    });

    it('should overwrite rules with the same name', () => {
      const newRules: MetricFormatRule[] = [
        { name: 'currency', options: { style: 'currency', currency: 'EUR' } },
      ];
      const result = mergeRules(baseRules, newRules);
      expect(result).toHaveLength(2);
      expect(result[0].options.currency).toBe('EUR');
    });

    it('should overwrite rules with the same pattern', () => {
      const newRules: MetricFormatRule[] = [
        { pattern: /_rate$/, options: { minimumFractionDigits: 2 } },
      ];
      const result = mergeRules(baseRules, newRules);
      expect(result).toHaveLength(2);
      expect(result[1].options.minimumFractionDigits).toBe(2);
      expect(result[1].options.style).toBe('percent'); // Should preserve old properties
    });

    it('should handle mixed new and overwrite rules', () => {
      const newRules: MetricFormatRule[] = [
        { name: 'currency', options: { currency: 'JPY' } },
        { name: 'new_metric', options: { style: 'decimal' } },
      ];
      const result = mergeRules(baseRules, newRules);
      expect(result).toHaveLength(3);
      expect(result[0].options.currency).toBe('JPY');
      expect(result[2].name).toBe('new_metric');
    });
  });

  describe('边缘与异常情况测试', () => {
    it('当左右规则数组均为空时，应返回空数组', () => {
      expect(mergeRules([], [])).toEqual([]);
    });

    it('应能正确深度合并 options 对象', () => {
      const left: MetricFormatRule[] = [
        { name: 'metric', options: { style: 'decimal', useGrouping: true } },
      ];
      const right: MetricFormatRule[] = [
        { name: 'metric', options: { useGrouping: false, minimumFractionDigits: 2 } },
      ];
      const result = mergeRules(left, right);
      expect(result).toHaveLength(1);
      expect(result[0].options).toEqual({
        style: 'decimal',
        useGrouping: false,
        minimumFractionDigits: 2,
      });
    });

    it('当规则同时存在 name 和 pattern 时，应优先使用 name 并发出警告', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const conflictingRule: MetricFormatRule = {
        name: 'metric',
        pattern: /metric/,
        options: { style: 'decimal' },
      } as any;
      const result = mergeRules([], [conflictingRule]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('metric');
      expect((result[0] as any).pattern).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('当规则缺少 options 属性时，应能正常合并', () => {
      const left: MetricFormatRule[] = [{ name: 'metric', options: { style: 'decimal' } }];
      const right: MetricFormatRule[] = [{ name: 'metric' } as any];
      const result = mergeRules(left, right);
      expect(result).toHaveLength(1);
      expect(result[0].options).toEqual({ style: 'decimal' });
    });

    it('当 pattern 是无效的正则表达式字符串时，应能作为普通字符串键处理', () => {
      const left: MetricFormatRule[] = [{ pattern: '*(', options: { style: 'decimal' } }];
      const right: MetricFormatRule[] = [{ pattern: '*(', options: { useGrouping: true } }];
      const result = mergeRules(left, right);
      expect(result).toHaveLength(1);
      expect(result[0].options).toEqual({ style: 'decimal', useGrouping: true });
    });
  });
});

describe('边缘与异常情况测试', () => {
  it('当左右规则数组均为空时，应返回空数组', () => {
    expect(mergeRules([], [])).toEqual([]);
  });

  it('应能正确深度合并 options 对象', () => {
    const left: MetricFormatRule[] = [
      { name: 'metric', options: { style: 'decimal', useGrouping: true } },
    ];
    const right: MetricFormatRule[] = [
      { name: 'metric', options: { useGrouping: false, minimumFractionDigits: 2 } },
    ];
    const result = mergeRules(left, right);
    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual({
      style: 'decimal',
      useGrouping: false,
      minimumFractionDigits: 2,
    });
  });

  it('当规则同时存在 name 和 pattern 时，应优先使用 name 并发出警告', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const conflictingRule: MetricFormatRule = {
      name: 'metric',
      pattern: /metric/,
      options: { style: 'decimal' },
    } as any;
    const result = mergeRules([], [conflictingRule]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('metric');
    expect((result[0] as any).pattern).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('当规则缺少 options 属性时，应能正常合并', () => {
    const left: MetricFormatRule[] = [{ name: 'metric', options: { style: 'decimal' } }];
    const right: MetricFormatRule[] = [{ name: 'metric' } as any];
    const result = mergeRules(left, right);
    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual({ style: 'decimal' });
  });

  it('当 pattern 是无效的正则表达式字符串时，应能作为普通字符串键处理', () => {
    const left: MetricFormatRule[] = [{ pattern: '*(', options: { style: 'decimal' } }];
    const right: MetricFormatRule[] = [{ pattern: '*(', options: { useGrouping: true } }];
    const result = mergeRules(left, right);
    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual({ style: 'decimal', useGrouping: true });
  });
});
