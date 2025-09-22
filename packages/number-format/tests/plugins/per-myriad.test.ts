/**
 * @file 万分比（Per-myriad/Basis point）插件组测试
 */

import { createNumberFormat } from '../../src/core/formatter';
import { NumberParser } from '../../src/core/parser';
import { resetPlugins } from '../../src/plugins/registry';
import { perMyriadPluginGroup } from '../../src/plugins/per-myriad';
import { fallbackPlugin } from '../../src/plugins/fallback';

describe('万分比（Per-myriad/Basis point）插件组', () => {
  beforeEach(() => {
    resetPlugins([perMyriadPluginGroup, fallbackPlugin]);
  });

  it('应能将数字正确格式化为万分比字符串', () => {
    const formatter = createNumberFormat({ style: 'per-myriad' });
    expect(formatter.format(0.0123).formattedValue).toBe('123‱');
  });

  it('应能处理不同的小数位数配置', () => {
    const formatter = createNumberFormat({ style: 'per-myriad', maximumFractionDigits: 2 });
    expect(formatter.format(0.012345).formattedValue).toBe('123.45‱');
  });

  it('应能正确处理负数', () => {
    const formatter = createNumberFormat({ style: 'per-myriad' });
    expect(formatter.format(-0.0456).formattedValue).toBe('-456‱');
  });

  it('应能与 fallback 插件协同工作，处理无效值', () => {
    const formatter = createNumberFormat({ style: 'per-myriad' });
    expect(formatter.format(null).formattedValue).toBe('--‱');
    expect(formatter.format(undefined).formattedValue).toBe('--‱');
  });

  describe('解析流程', () => {
    it('在非严格模式下应自动去除‱并进行换算', () => {
      const parser = new NumberParser({ style: 'per-myriad', strict: false });
      const result = parser.parse('123‱');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.0123);
    });

    it('在严格模式下应要求存在‱符号', () => {
      const parser = new NumberParser({ style: 'per-myriad', strict: true });
      const withSymbol = parser.parse('123‱');
      const withoutSymbol = parser.parse('123');

      expect(withSymbol.success).toBe(true);
      expect(withSymbol.value).toBeCloseTo(0.0123);
      expect(withoutSymbol.success).toBe(false);
    });
  });
});
