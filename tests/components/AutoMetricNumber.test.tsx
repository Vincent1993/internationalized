import { render, screen } from '@testing-library/react';
import React from 'react';
import { AutoMetricNumber } from '../../src/components/AutoMetricNumber';
import { NumberFormatProvider } from '../../src/core/context';
import type { MetricFormatRule } from '../../src/core/types';

describe('components/AutoMetricNumber', () => {
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

  it('应该根据指标名称自动应用格式化规则', () => {
    render(<AutoMetricNumber name='conversion_percentage' value={0.1234} rules={mockRules} />);

    expect(screen.getByText('12.34%')).toBeInTheDocument();
  });

  it('应该支持货币格式化', () => {
    render(
      <AutoMetricNumber
        name='product_price'
        value={199.99}
        rules={mockRules}
        data-testid='currency-format'
      />,
    );

    const element = screen.getByTestId('currency-format');
    expect(element.textContent).toMatchSnapshot();
  });

  it('应该支持整数计数格式化', () => {
    render(<AutoMetricNumber name='user_count' value={1234.56} rules={mockRules} />);

    expect(screen.getByText('1,235')).toBeInTheDocument(); // 四舍五入到整数
  });

  it('应该在无匹配规则时使用默认配置', () => {
    render(<AutoMetricNumber name='unknown_metric' value={123.456} rules={mockRules} />);

    expect(screen.getByText('123.456')).toBeInTheDocument();
  });

  it('应该支持asChild模式', () => {
    render(
      <AutoMetricNumber name='test_metric' value={123.45} rules={mockRules} asChild>
        {(result) => <span data-testid='auto-child'>{result.formattedValue}</span>}
      </AutoMetricNumber>,
    );

    const element = screen.getByTestId('auto-child');
    expect(element).toHaveTextContent('123.45');
    expect(element.tagName).toBe('SPAN');
  });

  describe('规则匹配测试', () => {
    it('应该匹配复杂的正则表达式模式', () => {
      const complexRules: MetricFormatRule[] = [
        {
          pattern: /^(room|outdoor|indoor)_temp(erature)?$/i,
          options: { style: 'unit', unit: 'celsius' },
        },
        {
          pattern: /(speed|velocity)_(mph|kmh|ms)$/i,
          options: { style: 'unit', unit: 'meter-per-second' },
        },
      ];

      render(
        <AutoMetricNumber
          name='room_temp'
          value={23.5}
          rules={complexRules}
          data-testid='temp-format'
        />,
      );

      const element = screen.getByTestId('temp-format');
      expect(element.textContent).toMatchSnapshot();
    });

    it('应该使用最后一个匹配的规则', () => {
      const overlappingRules: MetricFormatRule[] = [
        {
          pattern: /rate/i,
          options: { style: 'percent', maximumFractionDigits: 1 },
        },
        {
          pattern: /rate/i,
          options: { style: 'percent', maximumFractionDigits: 3 },
        },
      ];

      render(
        <AutoMetricNumber
          name='conversion_rate'
          value={0.12345}
          rules={overlappingRules}
          data-testid='first-match'
        />,
      );

      // 应该使用第一个规则（1位小数）
      expect(screen.getByTestId('first-match')).toHaveTextContent('12.345%');
    });

    it('应该区分大小写敏感性', () => {
      const caseSensitiveRules: MetricFormatRule[] = [
        {
          pattern: /TEST/,
          options: { style: 'decimal', maximumFractionDigits: 0 },
        },
      ];

      render(
        <AutoMetricNumber
          name='test_metric'
          value={123.45}
          rules={caseSensitiveRules}
          data-testid='case-test'
        />,
      );

      // 应该使用默认配置（2位小数）而不是规则（0位小数）
      expect(screen.getByTestId('case-test')).toHaveTextContent('123.45');
    });
  });

  describe('与Context集成测试', () => {
    const contextRules: MetricFormatRule[] = [
      {
        pattern: /global_rate/i,
        options: { style: 'percent', maximumFractionDigits: 1 },
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

    it('应该合并Context和局部规则', () => {
      const localRules: MetricFormatRule[] = [
        {
          pattern: /local_price/i,
          options: { style: 'currency', currency: 'USD' },
        },
      ];

      render(
        <AutoMetricNumber
          name='global_rate'
          value={0.123}
          rules={localRules}
          data-testid='context-rule'
        />,
        { wrapper },
      );

      // 应该匹配Context中的规则
      expect(screen.getByTestId('context-rule')).toHaveTextContent('12.3%');
    });

    it('应该局部规则优先于Context规则', () => {
      const localRules: MetricFormatRule[] = [
        {
          pattern: /global_rate/i,
          options: { style: 'percent', maximumFractionDigits: 3 }, // 覆盖Context的1位小数
        },
      ];

      render(
        <AutoMetricNumber
          name='global_rate'
          value={0.12345}
          rules={localRules}
          data-testid='local-override'
        />,
        { wrapper },
      );

      // 应该使用局部规则（3位小数）
      expect(screen.getByTestId('local-override')).toHaveTextContent('12.345%');
    });
  });

  describe('props传递测试', () => {
    it('应该将额外的props传递给底层组件', () => {
      render(
        <AutoMetricNumber
          name='test_metric'
          value={123}
          rules={mockRules}
          className='custom-class'
          id='test-id'
          title='Test title'
          data-testid='props-forward'
        />,
      );

      const element = screen.getByTestId('props-forward');
      expect(element).toHaveClass('custom-class');
      expect(element).toHaveAttribute('id', 'test-id');
      expect(element).toHaveAttribute('title', 'Test title');
    });

    it('应该支持ref转发', () => {
      const ref = React.createRef<HTMLSpanElement>();

      render(<AutoMetricNumber name='test_metric' value={123} rules={mockRules} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current?.textContent).toBe('123');
    });
  });

  describe('快照测试', () => {
    it('应该为不同指标类型生成正确的快照', () => {
      const testCases = [
        { name: 'conversion_percentage', value: 0.1234 },
        { name: 'product_price', value: 299.99 },
        { name: 'user_count', value: 1234.56 },
        { name: 'unknown_metric', value: 42.195 },
        { name: 'click_through_rate', value: 0.0567 },
        { name: 'average_session_duration', value: 234.67 },
      ];

      testCases.forEach(({ name, value }) => {
        const { container } = render(
          <AutoMetricNumber name={name} value={value} rules={mockRules} />,
        );

        expect(container.firstChild).toMatchSnapshot(`auto-metric-${name}`);
      });
    });

    it('应该为不同的规则配置生成快照', () => {
      const ruleVariations = [
        [], // 空规则
        mockRules, // 基础规则
        [
          ...mockRules,
          {
            pattern: /temp|temperature/i,
            options: { style: 'unit', unit: 'celsius' },
          },
        ], // 扩展规则
      ];

      ruleVariations.forEach((rules, index) => {
        const { container } = render(
          <AutoMetricNumber name='test_metric' value={25.5} rules={rules} />,
        );

        expect(container.firstChild).toMatchSnapshot(`rules-variation-${index}`);
      });
    });
  });
});
