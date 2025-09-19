import { createNumberFormat } from '../../src/core/formatter';
import { resetPlugins } from '../../src/plugins/registry';
import { dynamicDecimalPrecisionPlugin } from '../../src/plugins/dynamic-decimals';
import { fallbackPlugin } from '../../src/plugins/fallback';

describe('动态小数位插件', () => {
  beforeEach(() => {
    resetPlugins([dynamicDecimalPrecisionPlugin, fallbackPlugin]);
  });

  it('应在需要时扩展小数位直到遇到第一个非零数字', () => {
    const formatter = createNumberFormat({
      style: 'decimal',
      maximumFractionDigits: 2,
      extend_dynamicDecimals: { maxFractionDigits: 8 },
    });

    expect(formatter.format(0.000456).formattedValue).toBe('0.0005');
  });

  it('允许通过 additionalDigits 保留更多有效小数位', () => {
    const formatter = createNumberFormat({
      style: 'decimal',
      maximumFractionDigits: 2,
      extend_dynamicDecimals: { maxFractionDigits: 8, additionalDigits: 2 },
    });

    expect(formatter.format(0.0004567).formattedValue).toBe('0.000457');
  });

  it('超出阈值时应回退到科学计数法', () => {
    const formatter = createNumberFormat({
      style: 'decimal',
      maximumFractionDigits: 2,
      extend_dynamicDecimals: { maxFractionDigits: 4, fallbackMaximumFractionDigits: 4 },
    });

    expect(formatter.format(1e-7).formattedValue).toBe('1E-7');
  });
});
