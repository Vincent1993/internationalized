/**
 * @file Fix Decimals 插件测试
 * @description 验证 fix-decimals 插件能否正确处理固定小数位数的功能。
 */

import { createNumberFormat } from '../../src/core/formatter';
import { resetPlugins } from '../../src/plugins/registry';
import { fixDecimalsPlugin } from '../../src/plugins/fix-decimals';
import { fallbackPlugin } from '../../src/plugins/fallback';
import { perMillePluginGroup } from '../../src/plugins/per-mille';

// 辅助函数：重置为默认插件
const setupPlugins = () => {
  resetPlugins([fixDecimalsPlugin, fallbackPlugin, perMillePluginGroup]);
};

describe('Fix Decimals 插件', () => {
  beforeEach(() => {
    setupPlugins();
  });

  describe('基本功能', () => {
    it('应该正确固定小数位数为指定值', () => {
      const formatter = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 3
      });

      expect(formatter.format(123.456789).formattedValue).toBe('123.457');
      expect(formatter.format(123).formattedValue).toBe('123.000');
      expect(formatter.format(123.4).formattedValue).toBe('123.400');
    });

    it('应该忽略用户设置的 minimumFractionDigits 和 maximumFractionDigits', () => {
      const formatter = createNumberFormat({
        style: 'decimal',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        extend_fixDecimals: 3
      });

      // 插件应该覆盖用户的设置
      expect(formatter.format(123.456789).formattedValue).toBe('123.457');
    });

    it('只在 extend_fixDecimals 为整数时生效', () => {
      // 不设置 extend_fixDecimals，插件不生效
      const formatter1 = createNumberFormat({
        style: 'decimal',
        maximumFractionDigits: 2
      });
      expect(formatter1.format(123.456789).formattedValue).toBe('123.46');

      // 设置为非整数，插件不生效
      const formatter2 = createNumberFormat({
        style: 'decimal',
        maximumFractionDigits: 2,
        extend_fixDecimals: 2.5
      });
      expect(formatter2.format(123.456789).formattedValue).toBe('123.46');
    });

    it('应该正确处理不同的固定小数位数', () => {
      // 0 位小数
      const formatter0 = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 0
      });
      expect(formatter0.format(123.456789).formattedValue).toBe('123');

      // 1 位小数
      const formatter1 = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 1
      });
      expect(formatter1.format(123.456789).formattedValue).toBe('123.5');

      // 4 位小数
      const formatter4 = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 4
      });
      expect(formatter4.format(123.456789).formattedValue).toBe('123.4568');
    });
  });

  describe('与不同样式结合', () => {
    it('应该与货币样式正确结合', () => {
      const formatter = createNumberFormat({
        style: 'currency',
        currency: 'CNY',
        extend_fixDecimals: 2
      });

      expect(formatter.format(123.456789).formattedValue).toBe('¥123.46');
      expect(formatter.format(123).formattedValue).toBe('¥123.00');
    });

    it('应该与百分比样式正确结合', () => {
      const formatter = createNumberFormat({
        style: 'percent',
        extend_fixDecimals: 1
      });

      expect(formatter.format(0.456789).formattedValue).toBe('45.7%');
      expect(formatter.format(0.123).formattedValue).toBe('12.3%');
    });

    it('应该与千分比样式正确结合', () => {
      const formatter = createNumberFormat({
        style: 'per-mille',
        extend_fixDecimals: 2
      });

      // 测试千分比格式化结果包含 ‰ 符号
      const result1 = formatter.format(0.456789);
      const result2 = formatter.format(0.123);

      expect(result1.formattedValue).toMatch(/‰$/);
      expect(result2.formattedValue).toMatch(/‰$/);
    });
  });

  describe('边界情况处理', () => {
    it('应该正确处理负数', () => {
      const formatter = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 2
      });

      expect(formatter.format(-123.456789).formattedValue).toBe('-123.46');
      expect(formatter.format(-123).formattedValue).toBe('-123.00');
    });

    it('应该正确处理大数字和小数字', () => {
      const formatter = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 2
      });

      expect(formatter.format(123456789.123456).formattedValue).toBe('123,456,789.12');
      expect(formatter.format(0.00123456).formattedValue).toBe('0.00');
    });

    it('应该正确处理科学计数法', () => {
      const formatter = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 2,
        notation: 'scientific'
      });

      expect(formatter.format(123456789).formattedValue).toBe('1.23E8');
    });
  });

  describe('与 fallback 插件集成', () => {
    it('应该与 fallback 插件协同工作处理无效值', () => {
      const formatter = createNumberFormat({
        style: 'decimal',
        extend_fixDecimals: 2
      });

      // fallback 插件的默认行为
      expect(formatter.format(null).formattedValue).toBe('N/A');
      expect(formatter.format(undefined).formattedValue).toBe('N/A');
      expect(formatter.format(NaN).formattedValue).toBe('N/A');
      expect(formatter.format(Infinity).formattedValue).toBe('∞');
    });
  });

  describe('插件优先级和执行顺序', () => {
    it('应该在适当的阶段执行', () => {
      // 这个测试验证插件的 phase 设置是否正确
      expect(fixDecimalsPlugin.phase).toBe('pre-process');
      expect(fixDecimalsPlugin.priority).toBe(100);
    });

    it('应该正确识别适用条件', () => {
      const context = {
        originalValue: 123.456,
        currentValue: 123.456,
        style: 'decimal' as const,
        options: {},
        valueState: 'valid' as const,
        extend: { extend_fixDecimals: 2 }
      };

      expect(fixDecimalsPlugin.isApplicable(context)).toBe(true);

      // 测试非整数值
      const context2 = {
        ...context,
        extend: { extend_fixDecimals: 2.5 }
      };
      expect(fixDecimalsPlugin.isApplicable(context2)).toBe(false);

      // 测试无扩展配置
      const context3 = {
        ...context,
        extend: undefined
      };
      expect(fixDecimalsPlugin.isApplicable(context3)).toBe(false);
    });
  });

  describe('选项处理', () => {
    it('应该正确处理并返回新的选项', () => {
      const context = {
        originalValue: 123.456,
        currentValue: 123.456,
        style: 'decimal' as const,
        options: {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        },
        valueState: 'valid' as const,
        extend: { extend_fixDecimals: 3 }
      };

      const newOptions = fixDecimalsPlugin.processOptions(context.options, context);

      expect(newOptions.minimumFractionDigits).toBe(3);
      expect(newOptions.maximumFractionDigits).toBe(3);
      // 注意：插件会覆盖原始值，而不是移除属性
      expect(newOptions.minimumFractionDigits).toBe(3);
      expect(newOptions.maximumFractionDigits).toBe(3);
    });

    it('应该保留其他选项不变', () => {
      const context = {
        originalValue: 123.456,
        currentValue: 123.456,
        style: 'decimal' as const,
        options: {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
          useGrouping: true,
          locale: 'zh-CN'
        },
        valueState: 'valid' as const,
        extend: { extend_fixDecimals: 3 }
      };

      const newOptions = fixDecimalsPlugin.processOptions(context.options, context);

      expect(newOptions.minimumFractionDigits).toBe(3);
      expect(newOptions.maximumFractionDigits).toBe(3);
      expect(newOptions.useGrouping).toBe(true);
      expect(newOptions.locale).toBe('zh-CN');
    });
  });
});
