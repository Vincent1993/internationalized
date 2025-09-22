import type { MetricFormatRule } from '../../src/core/types';

describe('MetricFormatRule 类型互斥验证', () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('类型安全测试', () => {
    it('应该允许只使用 name 的规则', () => {
      const nameRule: MetricFormatRule = {
        name: 'revenue',
        options: { style: 'currency', currency: 'USD' },
      };

      expect(nameRule.name).toBe('revenue');
      expect(nameRule.options.style).toBe('currency');
    });

    it('应该允许只使用 pattern 的规则（字符串）', () => {
      const patternRule: MetricFormatRule = {
        pattern: '.*_rate$',
        options: { style: 'percent' },
      };

      expect(patternRule.pattern).toBe('.*_rate$');
      expect(patternRule.options.style).toBe('percent');
    });

    it('应该允许只使用 pattern 的规则（RegExp）', () => {
      const regexRule: MetricFormatRule = {
        pattern: /.*_count$/i,
        options: { style: 'decimal', maximumFractionDigits: 0 },
      };

      expect(regexRule.pattern).toBeInstanceOf(RegExp);
      expect(regexRule.options.style).toBe('decimal');
    });
  });

  describe('边界测试', () => {
    it('应该处理空字符串 name', () => {
      // 这在类型上是允许的，但逻辑上可能需要特殊处理
      const emptyNameRule: MetricFormatRule = {
        name: '',
        options: { style: 'decimal' },
      };

      expect(emptyNameRule.name).toBe('');
    });

    it('应该处理复杂的 RegExp pattern', () => {
      const complexRegexRule: MetricFormatRule = {
        pattern: /^(revenue|profit|income)_\d{4}_(q[1-4]|annual)$/i,
        options: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
      };

      expect(complexRegexRule.pattern).toBeInstanceOf(RegExp);
      expect(complexRegexRule.pattern.test('revenue_2024_q1')).toBe(true);
      expect(complexRegexRule.pattern.test('revenue_2024_annual')).toBe(true);
      expect(complexRegexRule.pattern.test('invalid_metric')).toBe(false);
    });
  });

  describe('规则数组组合测试', () => {
    it('应该支持混合类型的规则数组', () => {
      const rules: MetricFormatRule[] = [
        { name: 'revenue', options: { style: 'currency', currency: 'USD' } },
        { pattern: '.*_rate$', options: { style: 'percent' } },
        { pattern: /.*_count$/i, options: { style: 'decimal', maximumFractionDigits: 0 } },
        { name: 'profit', options: { style: 'currency', currency: 'EUR' } },
      ];

      expect(rules).toHaveLength(4);

      // 验证第一个规则（name）
      expect('name' in rules[0]).toBe(true);
      expect(rules[0].name).toBe('revenue');

      // 验证第二个规则（string pattern）
      expect('pattern' in rules[1]).toBe(true);
      expect(rules[1].pattern).toBe('.*_rate$');

      // 验证第三个规则（RegExp pattern）
      expect('pattern' in rules[2]).toBe(true);
      expect(rules[2].pattern).toBeInstanceOf(RegExp);

      // 验证第四个规则（name）
      expect('name' in rules[3]).toBe(true);
      expect(rules[3].name).toBe('profit');
    });
  });

  describe('实际应用场景测试', () => {
    it('应该支持财务指标规则配置', () => {
      const financialRules: MetricFormatRule[] = [
        // 精确匹配重要指标
        {
          name: 'revenue',
          options: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        },
        {
          name: 'profit',
          options: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        },
        { name: 'cost', options: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },

        // 模式匹配百分比指标
        {
          pattern: '.*_(rate|ratio|percentage)$',
          options: { style: 'percent', maximumFractionDigits: 2 },
        },

        // 模式匹配计数指标
        {
          pattern: /.*_(count|total|number)$/i,
          options: { style: 'decimal', maximumFractionDigits: 0, useGrouping: true },
        },
      ];

      expect(financialRules).toHaveLength(5);
      expect(
        financialRules.every(
          (rule) =>
            ('name' in rule && typeof rule.name === 'string') ||
            ('pattern' in rule &&
              (typeof rule.pattern === 'string' || rule.pattern instanceof RegExp)),
        ),
      ).toBe(true);
    });

    it('应该支持国际化货币规则', () => {
      const currencyRules: MetricFormatRule[] = [
        { name: 'usd_amount', options: { style: 'currency', currency: 'USD', locale: 'en-US' } },
        { name: 'eur_amount', options: { style: 'currency', currency: 'EUR', locale: 'de-DE' } },
        { name: 'cny_amount', options: { style: 'currency', currency: 'CNY', locale: 'zh-CN' } },
        { name: 'jpy_amount', options: { style: 'currency', currency: 'JPY', locale: 'ja-JP' } },
      ];

      currencyRules.forEach((rule) => {
        expect('name' in rule).toBe(true);
        expect(rule.options.style).toBe('currency');
        expect(rule.options.currency).toBeDefined();
      });
    });
  });
});
