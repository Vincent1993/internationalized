/**
 * @file 千分比（Per-mille）插件组测试
 * @description 验证 per-mille 插件组作为一个整体能否正确工作。
 */

import { createNumberFormat } from '../../src/core/formatter';
import { NumberParser } from '../../src/core/parser';
import { resetPlugins } from '../../src/plugins/registry';
import { perMillePluginGroup } from '../../src/plugins/per-mille';
import { fallbackPlugin } from '../../src/plugins/fallback';

describe('千分比（Per-mille）插件组', () => {
  beforeEach(() => {
    // 将 per-mille 插件组和 fallback 插件一起重置
    resetPlugins([perMillePluginGroup, fallbackPlugin]);
  });

  it('应能将数字正确格式化为千分比字符串', () => {
    const formatter = createNumberFormat({ style: 'per-mille' });
    expect(formatter.format(0.123).formattedValue).toBe('123‰');
  });

  it('应能处理不同的小数位数配置', () => {
    const formatter = createNumberFormat({ style: 'per-mille', maximumFractionDigits: 2 });
    expect(formatter.format(0.12345).formattedValue).toBe('123.45‰');
  });

  it('应能正确处理负数', () => {
    const formatter = createNumberFormat({ style: 'per-mille' });
    expect(formatter.format(-0.456).formattedValue).toBe('-456‰');
  });

  it('应能与 fallback 插件协同工作，处理无效值', () => {
    const formatter = createNumberFormat({ style: 'per-mille' });
    // 来自 fallback 插件的默认配置
    expect(formatter.format(null).formattedValue).toBe('--‰');
    expect(formatter.format(undefined).formattedValue).toBe('--‰');
    expect(formatter.format(NaN).formattedValue).toBe('--‰');
  });

  it('当包含符号时，应能正确显示', () => {
    const formatter = createNumberFormat({ style: 'per-mille', includeSign: true });
    expect(formatter.format(0.123).formattedValue).toBe('123‰');
    expect(formatter.format(-0.456).formattedValue).toBe('-456‰');
  });

  describe('解析流程', () => {
    it('在非严格模式下应自动去除‰并进行换算', () => {
      const parser = new NumberParser({ style: 'per-mille', strict: false });
      const result = parser.parse('123‰');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.123);
    });

    it('在严格模式下应保留‰并避免重复换算', () => {
      const parser = new NumberParser({ style: 'per-mille', strict: true });
      const withSymbol = parser.parse('123‰');
      const withoutSymbol = parser.parse('123');

      expect(withSymbol.success).toBe(true);
      expect(withSymbol.value).toBeCloseTo(0.123);
      expect(withoutSymbol.success).toBe(false);
    });
  });
});
