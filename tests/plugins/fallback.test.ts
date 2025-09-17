/**
 * @file Fallback 插件集成测试
 * @description 验证 fallback 插件在不同的格式化样式和配置下，能否正确处理各种无效输入。
 */

import { createNumberFormat } from '../../src/core/formatter';
import { resetPlugins } from '../../src/plugins/registry';
import { perMillePluginGroup } from '../../src/plugins/per-mille';
import { fallbackPlugin, createFallbackPlugin } from '../../src/plugins/fallback';

// 辅助函数：重置为默认插件
const setupDefaultPlugins = () => {
  resetPlugins([perMillePluginGroup, fallbackPlugin]);
};

describe('Fallback 插件集成测试', () => {
  beforeEach(() => {
    setupDefaultPlugins();
  });

  describe('默认配置下的多种格式化场景', () => {
    const testCases = [
      // 货币
      {
        style: 'currency',
        options: { currency: 'CNY', currencyDisplay: 'narrowSymbol' },
        value: null,
        expected: '¥--',
        expectedParts: [
          { type: 'currency', value: '¥' },
          { type: 'literal', value: '--' },
        ],
      },
      {
        style: 'currency',
        options: { currency: 'CNY', currencyDisplay: 'narrowSymbol' },
        value: undefined,
        expected: '¥--',
      },
      {
        style: 'currency',
        options: { currency: 'CNY', currencyDisplay: 'narrowSymbol' },
        value: NaN,
        expected: '¥--',
      },
      {
        style: 'currency',
        options: { currency: 'CNY', currencyDisplay: 'narrowSymbol' },
        value: Infinity,
        expected: '¥--',
      },

      // 百分比
      { style: 'percent', options: {}, value: null, expected: '--%' },
      { style: 'percent', options: {}, value: NaN, expected: '--%' },

      // 小数
      { style: 'decimal', options: {}, value: null, expected: 'N/A' },
      { style: 'decimal', options: {}, value: undefined, expected: 'N/A' },

      // 千分比
      { style: 'per-mille', options: {}, value: null, expected: '--‰' },

      // 单位
      {
        style: 'unit',
        options: { unit: 'kilometer-per-hour', unitDisplay: 'short' },
        value: null,
        expected: 'N/A km/h',
      },
    ];

    it.each(testCases)(
      '当样式为 $style, 输入值为 $value 时, 应格式化为 "$expected"',
      // eslint-disable-next-line @typescript-eslint/no-shadow
      ({ style, options, value, expected, expectedParts }) => {
        const formatter = createNumberFormat({ style, ...options } as any);
        const result = formatter.format(value);
        expect(result.formattedValue).toBe(expected);
        if (expectedParts) {
          expect(result.parts).toEqual(expectedParts);
        }
      },
    );
  });

  describe('特殊无效字符串指示符处理', () => {
    const testCases = [
      ['', '¥--'],
      ['-', '¥--'],
      ['--', '¥--'],
      ['NULL', '¥--'],
      ['NaN', '¥--'],
      ['Infinity', '¥--'],
      ['invalid-string', '¥--'],
    ];

    it.for(testCases)(
      '当输入为字符串 "$value" 时, 应作为无效货币值处理并返回 "$expected"',
      ([value, expected]) => {
        const formatter = createNumberFormat({
          style: 'currency',
          currency: 'CNY',
          currencyDisplay: 'narrowSymbol',
        });
        const result = formatter.format(value);
        expect(result.formattedValue).toBe(expected);
      },
    );
  });

  describe('自定义 Fallback 配置', () => {
    beforeEach(() => {
      const customFallbackPlugin = createFallbackPlugin({
        defaultStrategy: {
          onNull: 'N/A',
          onNaN: 'Error',
        },
        styleStrategies: [
          {
            style: 'currency',
            strategy: {
              onNull: '空金额',
              onNaN: '无效金额',
              preserveFormatting: true,
            },
          },
        ],
      });
      resetPlugins([perMillePluginGroup, customFallbackPlugin]);
    });

    it('小数格式应使用自定义的默认策略', () => {
      const formatter = createNumberFormat({ style: 'decimal' });
      expect(formatter.format(null).formattedValue).toBe('N/A');
      expect(formatter.format(NaN).formattedValue).toBe('Error');
    });

    it('货币格式应使用自定义的样式特定策略', () => {
      const formatter = createNumberFormat({ style: 'currency', currency: 'USD' });
      expect(formatter.format(null).formattedValue).toBe('$空金额');
      expect(formatter.format(NaN).formattedValue).toBe('$无效金额');
    });
  });

  describe('API 一致性与健壮性', () => {
    it('对任何输入都应始终返回相同的对象结构', () => {
      const formatter = createNumberFormat({ style: 'currency', currency: 'USD' });
      const validResult = formatter.format(123);
      const nullResult = formatter.format(null);

      const expectedKeys = ['value', 'formattedValue', 'parts', 'sign', 'isNaN', 'resolvedOptions'];
      expect(Object.keys(validResult)).toEqual(expect.arrayContaining(expectedKeys));
      expect(Object.keys(nullResult)).toEqual(expect.arrayContaining(expectedKeys));
    });

    it('对任何输入都不应抛出错误', () => {
      const formatter = createNumberFormat({ style: 'currency', currency: 'CNY' });
      const testValues = [
        123,
        0,
        null,
        undefined,
        NaN,
        Infinity,
        -Infinity,
        '',
        '-',
        '--',
        'NULL',
        'NaN',
        'Infinity',
        {},
        [],
        true,
      ];

      testValues.forEach((value) => {
        expect(() => {
          const result = formatter.format(value);
          expect(typeof result.formattedValue).toBe('string');
          expect(Array.isArray(result.parts)).toBe(true);
        }).not.toThrow();
      });
    });
  });
});
