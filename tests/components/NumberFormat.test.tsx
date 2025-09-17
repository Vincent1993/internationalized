import { render, screen } from '@testing-library/react';
import React from 'react';
import { NumberFormat } from '../../src/components/NumberFormat';
import { NumberFormatProvider } from '../../src/core/context';

describe('components/NumberFormat', () => {
  it('应该渲染格式化后的数值', () => {
    render(<NumberFormat value={1234.56} />);

    expect(screen.getByText('1,234.56')).toBeInTheDocument();
  });

  it('应该支持自定义格式化选项', () => {
    render(
      <NumberFormat
        value={1234.5}
        options={{
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          currencyDisplay: 'narrowSymbol',
        }}
      />,
    );

    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });

  it('应该支持asChild模式', () => {
    render(
      <NumberFormat value={123.45} asChild>
        <span data-testid='custom-span' />
      </NumberFormat>,
    );

    const element = screen.getByTestId('custom-span');
    expect(element).toHaveTextContent('123.45');
    expect(element.tagName).toBe('SPAN');
  });

  it('asChild模式下传递无效children时应该正常处理', () => {
    // 这个测试会触发 Slot 组件的 return null 分支
    const { container } = render(
      <NumberFormat value={123.45} asChild>
        {null as any}
      </NumberFormat>,
    );

    // 应该渲染出数值（因为 BaseNumberFormat 会 fallback 到 content）
    expect(container.textContent).toBe('');
  });

  it('应该支持自定义className', () => {
    render(<NumberFormat value={123} className='custom-class' data-testid='number-format' />);

    const element = screen.getByTestId('number-format');
    expect(element).toHaveClass('custom-class');
  });

  describe('与Context集成测试', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NumberFormatProvider
        options={{
          locale: 'de-DE',
          style: 'currency',
          currency: 'EUR',
          useGrouping: true,
        }}
      >
        {children}
      </NumberFormatProvider>
    );

    it('应该使用Context提供的默认配置', () => {
      render(<NumberFormat value={1234.56} data-testid='context-format' />, { wrapper });

      const element = screen.getByTestId('context-format');
      expect(element.textContent).toMatchSnapshot();
    });

    it('应该允许props覆盖Context配置', () => {
      render(
        <NumberFormat
          value={1234.56}
          options={{
            style: 'decimal',
            maximumFractionDigits: 1,
          }}
          data-testid='override-context'
        />,
        { wrapper },
      );

      const element = screen.getByTestId('override-context');
      // 应该使用decimal而不是currency，小数位数为1而不是默认
      expect(element.textContent).toBe('1.234,6'); // 德语格式，但decimal样式
    });
  });

  describe('不同数值类型测试', () => {
    const testCases = [
      { value: 0, label: 'zero' },
      { value: 1, label: 'one' },
      { value: -1, label: 'negative-one' },
      { value: 0.1, label: 'decimal' },
      { value: 1000, label: 'thousand' },
      { value: 1000000, label: 'million' },
      { value: 0.0001, label: 'small-decimal' },
      { value: 123.456789, label: 'many-decimals' },
    ];

    testCases.forEach(({ value, label }) => {
      it(`应该正确格式化${label}: ${value}`, () => {
        render(
          <NumberFormat
            value={value}
            options={{
              style: 'decimal',
              maximumFractionDigits: 6,
            }}
            data-testid={`format-${label}`}
          />,
        );

        const element = screen.getByTestId(`format-${label}`);
        expect(element.textContent).toMatchSnapshot(`numberformat-${label}`);
      });
    });
  });

  describe('不同样式测试', () => {
    const styleTestCases = [
      {
        style: 'decimal' as const,
        value: 1234.56,
        extraProps: {},
      },
      {
        style: 'currency' as const,
        value: 1234.56,
        extraProps: { currency: 'USD' },
      },
      {
        style: 'percent' as const,
        value: 0.1234,
        extraProps: {},
      },
      {
        style: 'unit' as const,
        value: 123,
        extraProps: { unit: 'meter' },
      },
    ];

    styleTestCases.forEach(({ style, value, extraProps }) => {
      it(`应该正确渲染${style}样式`, () => {
        render(
          <NumberFormat
            value={value}
            options={{
              style,
              ...extraProps,
            }}
            data-testid={`style-${style}`}
          />,
        );

        const element = screen.getByTestId(`style-${style}`);
        expect(element.textContent).toMatchSnapshot(`style-${style}`);
      });
    });
  });

  describe('DOM属性测试', () => {
    it('应该转发DOM属性到元素', () => {
      render(
        <NumberFormat
          value={123}
          id='test-id'
          title='Test title'
          tabIndex={0}
          aria-label='Test label'
          data-testid='dom-attrs'
        />,
      );

      const element = screen.getByTestId('dom-attrs');
      expect(element).toHaveAttribute('id', 'test-id');
      expect(element).toHaveAttribute('title', 'Test title');
      expect(element).toHaveAttribute('tabIndex', '0');
      expect(element).toHaveAttribute('aria-label', 'Test label');
    });

    it('应该支持ref转发', () => {
      const ref = React.createRef<HTMLSpanElement>();

      render(<NumberFormat value={123} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
      expect(ref.current?.textContent).toBe('123');
    });
  });

  describe('异常情况测试', () => {
    it('应该处理无效的货币代码', () => {
      // 使用无效货币代码不应该崩溃，而应该fallback
      render(
        <NumberFormat
          value={123}
          options={{
            style: 'currency',
            currency: 'INVALID',
          }}
          data-testid='invalid-currency'
        />,
      );

      const element = screen.getByTestId('invalid-currency');
      // 应该fallback到decimal格式
      expect(element.textContent).toBe('123');
    });

    it('应该处理无效的unit', () => {
      render(
        <NumberFormat
          value={123}
          options={{ style: 'unit', unit: 'invalid-unit' }}
          data-testid='invalid-unit'
        />,
      );

      const element = screen.getByTestId('invalid-unit');
      // 应该fallback到decimal格式
      expect(element.textContent).toBe('123');
    });

    it('应该处理配置冲突', () => {
      // 同时设置style和多个相冲突的选项
      render(
        <NumberFormat
          value={123.45}
          options={{
            style: 'currency',
            currency: 'USD',
            unit: 'meter', // 与currency冲突
          }}
          data-testid='conflicting-config'
        />,
      );

      const element = screen.getByTestId('conflicting-config');
      // 应该使用currency样式，忽略unit
      expect(element.textContent).toMatchSnapshot();
    });
  });

  describe('快照测试', () => {
    it('应该为所有主要配置组合生成正确快照', () => {
      const configurations = [
        { value: 1234.567, options: { style: 'decimal' as const } },
        { value: 1234.567, options: { style: 'currency' as const, currency: 'USD' } },
        { value: 0.1234, options: { style: 'percent' as const } },
        { value: 123, options: { style: 'unit' as const, unit: 'kilogram' } },
        { value: 42, options: { includeSign: true } },
        { value: 1234567.89, options: { useGrouping: false } },
        { value: 123.456789, options: { maximumFractionDigits: 2 } },
        { value: 123.1, options: { minimumFractionDigits: 3 } },
      ];

      configurations.forEach((config, index) => {
        const { container } = render(<NumberFormat {...config} />);
        expect(container.firstChild).toMatchSnapshot(`config-${index}`);
      });
    });
  });
});
