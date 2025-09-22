import { renderHook } from '@testing-library/react';
import React from 'react';
import { useAutoFormat } from '../../src/hooks/useAutoFormat';
import { NumberFormatProvider } from '../../src/core/context';
import type { MetricFormatRule } from '../../src/core/types';

describe('hooks/useAutoFormat', () => {
  const mockRules: MetricFormatRule[] = [
    {
      pattern: /percentage|percent|rate/i,
      options: { style: 'percent', maximumFractionDigits: 2 },
    },
    {
      pattern: /price|cost|amount|money/i,
      options: { style: 'currency', currency: 'CNY' },
    },
    {
      pattern: /count|number|total/i,
      options: { style: 'decimal', maximumFractionDigits: 0 },
    },
  ];

  it('应该返回NumberFormatter对象', () => {
    const { result } = renderHook(() => useAutoFormat({ name: 'test_metric', rules: mockRules }));

    expect(result.current).toHaveProperty('format');
    expect(result.current).toHaveProperty('resolveOptions');
    expect(typeof result.current.format).toBe('function');
    expect(typeof result.current.resolveOptions).toBe('function');
  });

  describe('规则匹配测试', () => {
    it('应该匹配percentage规则', () => {
      const { result } = renderHook(() =>
        useAutoFormat({ name: 'conversion_percentage', rules: mockRules }),
      );

      const formatResult = result.current.format(0.1234);
      const resolved = result.current.resolveOptions();

      expect(resolved.style).toBe('percent');
      expect(resolved.originalStyle).toBe('percent');
      expect(formatResult.formattedValue).toBe('12.34%');
    });

    it('应该匹配currency规则', () => {
      const { result } = renderHook(() =>
        useAutoFormat({ name: 'product_price', rules: mockRules }),
      );

      const formatResult = result.current.format(199.99);
      const resolved = result.current.resolveOptions();

      expect(resolved.style).toBe('currency');
      expect(resolved.currency).toBe('CNY');
      expect(formatResult).toMatchSnapshot();
    });

    it('应该匹配count规则', () => {
      const { result } = renderHook(() => useAutoFormat({ name: 'user_count', rules: mockRules }));

      const formatResult = result.current.format(1234.56);
      const resolved = result.current.resolveOptions();

      expect(resolved.style).toBe('decimal');
      expect(resolved.maximumFractionDigits).toBe(0);
      expect(formatResult.formattedValue).toBe('1,235'); // 四舍五入到整数
    });

    it('应该在无匹配规则时使用默认配置', () => {
      const { result } = renderHook(() =>
        useAutoFormat({
          name: 'unknown_metric',
          rules: mockRules,
        }),
      );

      const formatResult = result.current.format(123.456789);
      const resolved = result.current.resolveOptions();

      expect(resolved.style).toBe('decimal');
      expect(formatResult.formattedValue).toBe('123.457');
    });
  });

  describe('与Context集成测试', () => {
    const contextRules: MetricFormatRule[] = [
      {
        pattern: /temperature/i,
        options: { style: 'unit', unit: 'celsius' },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NumberFormatProvider
        options={{
          locale: 'en-US',
          rules: contextRules,
          useGrouping: false,
        }}
      >
        {children}
      </NumberFormatProvider>
    );

    it('应该合并Context和局部rules', () => {
      const localRules: MetricFormatRule[] = [
        {
          pattern: /speed|velocity/i,
          options: { style: 'unit', unit: 'kilometer-per-hour' },
        },
      ];

      const { result } = renderHook(
        () =>
          useAutoFormat({
            name: 'current_temperature',
            rules: localRules,
          }),
        { wrapper },
      );

      const resolved = result.current.resolveOptions();

      // 应该匹配Context中的temperature规则
      expect(resolved.style).toBe('unit');
      expect(resolved.unit).toBe('celsius');
    });

    it('应该局部rules优先于Context rules', () => {
      const localRules: MetricFormatRule[] = [
        {
          pattern: /temperature/i,
          options: { style: 'unit', unit: 'fahrenheit' }, // 覆盖Context规则
        },
      ];

      const { result } = renderHook(
        () =>
          useAutoFormat({
            name: 'room_temperature',
            rules: localRules,
          }),
        { wrapper },
      );

      const resolved = result.current.resolveOptions();

      // 局部规则应该优先
      expect(resolved.unit).toBe('fahrenheit');
    });
  });

  describe('边缘情况测试', () => {
    it('应该处理空规则数组', () => {
      const { result } = renderHook(() =>
        useAutoFormat({
          name: 'test_metric',
          rules: [],
        }),
      );

      const formatResult = result.current.format(123.45);
      expect(formatResult.formattedValue).toBe('123.45');
    });

    it('应该处理未定义的name', () => {
      const { result } = renderHook(() =>
        useAutoFormat({
          name: '',
          rules: mockRules,
        }),
      );

      const resolved = result.current.resolveOptions();
      expect(resolved.style).toBe('decimal');
    });

    it('应该处理复杂的pattern匹配', () => {
      const complexRules: MetricFormatRule[] = [
        {
          pattern: /^(user|customer)_(count|number)$/i,
          options: { style: 'decimal', useGrouping: true },
        },
      ];

      const { result: matchResult } = renderHook(() =>
        useAutoFormat({ name: 'user_count', rules: complexRules }),
      );

      const { result: noMatchResult } = renderHook(() =>
        useAutoFormat({ name: 'user_count_total', rules: complexRules }),
      );

      expect(matchResult.current.resolveOptions().useGrouping).toBeTruthy();
      expect(noMatchResult.current.resolveOptions().useGrouping).toBe('always');
    });

    it('应该处理无效的规则配置', () => {
      const invalidRules = [
        {
          pattern: /test/i,
          options: { style: 'currency' }, // 缺少required currency
        },
      ] as MetricFormatRule[];

      const { result } = renderHook(() =>
        useAutoFormat({ name: 'test_metric', rules: invalidRules }),
      );

      // 应该fallback并不抛出错误
      expect(() => result.current.format(123)).not.toThrow();
    });
  });

  describe('规则优先级测试', () => {
    it('应该使用最后一个匹配的规则', () => {
      const overlappingRules: MetricFormatRule[] = [
        {
          pattern: /price/i,
          options: { style: 'currency', currency: 'USD' },
        },
        {
          pattern: /price/i,
          options: { style: 'currency', currency: 'EUR' },
        },
      ];

      const { result } = renderHook(() =>
        useAutoFormat({ name: 'product_price', rules: overlappingRules }),
      );

      const resolved = result.current.resolveOptions();
      expect(resolved.currency).toBe('EUR'); // 最后一个规则生效
    });

    it('应该支持规则选项与局部选项合并', () => {
      const rules: MetricFormatRule[] = [
        {
          name: 'merge_test',
          options: { style: 'decimal', maximumFractionDigits: 2 },
        },
      ];

      const { result } = renderHook(() =>
        useAutoFormat({
          name: 'merge_test',
          rules,
        }),
      );

      const resolved = result.current.resolveOptions();
      expect(resolved.style).toBe('decimal'); // 来自规则
      expect(resolved.maximumFractionDigits).toBe(2); // 来自规则
    });
  });

  describe('快照测试', () => {
    it('应该为不同指标类型生成正确格式', () => {
      const testCases = [
        { name: 'conversion_rate', value: 0.1234 },
        { name: 'product_price', value: 299.99 },
        { name: 'user_count', value: 1234.56 },
        { name: 'unknown_metric', value: 42.195 },
      ];

      testCases.forEach(({ name, value }) => {
        const { result } = renderHook(() => useAutoFormat({ name, rules: mockRules }));

        const formatResult = result.current.format(value);
        expect(formatResult).toMatchSnapshot(`auto-format-${name}-${value}`);
      });
    });
  });
});
