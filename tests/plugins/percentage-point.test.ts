/**
 * @file 百分点（Percentage point, pp）插件组测试
 */

import { createNumberFormat } from '../../src/core/formatter';
import { NumberParser } from '../../src/core/parser';
import { resetPlugins } from '../../src/plugins/registry';
import { percentagePointPluginGroup } from '../../src/plugins/percentage-point';
import { fallbackPlugin } from '../../src/plugins/fallback';

describe('百分点（Percentage point）插件组', () => {
  beforeEach(() => {
    resetPlugins([percentagePointPluginGroup, fallbackPlugin]);
  });

  it('应能将数字正确格式化为百分点字符串', () => {
    const formatter = createNumberFormat({ style: 'percentage-point' });
    expect(formatter.format(0.123).formattedValue).toBe('12.3pp');
  });

  it('应能处理固定小数位数配置', () => {
    const formatter = createNumberFormat({ style: 'percentage-point', maximumFractionDigits: 1 });
    expect(formatter.format(0.126).formattedValue).toBe('12.6pp');
  });

  it('应能正确处理负数', () => {
    const formatter = createNumberFormat({ style: 'percentage-point' });
    expect(formatter.format(-0.0456).formattedValue).toBe('-4.56pp');
  });

  it('应能与 fallback 插件协同工作，处理无效值', () => {
    const formatter = createNumberFormat({ style: 'percentage-point' });
    expect(formatter.format(null).formattedValue).toBe('--pp');
    expect(formatter.format(undefined).formattedValue).toBe('--pp');
  });

  describe('解析流程', () => {
    it('在非严格模式下应自动去除pp并进行换算', () => {
      const parser = new NumberParser({ style: 'percentage-point', strict: false });
      const result = parser.parse('12.3pp');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.123);
    });

    it('在严格模式下应要求存在pp后缀', () => {
      const parser = new NumberParser({ style: 'percentage-point', strict: true });
      const withSuffix = parser.parse('12.3pp');
      const withoutSuffix = parser.parse('12.3');

      expect(withSuffix.success).toBe(true);
      expect(withSuffix.value).toBeCloseTo(0.123);
      expect(withoutSuffix.success).toBe(false);
    });
  });
});
