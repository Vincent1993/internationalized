import { render, screen } from '@testing-library/react';
import React from 'react';
import { NumberFormat, AutoMetricNumber } from '../../src/components';
import { NumberFormatProvider } from '../../src/core';
import type { MetricFormatRule } from '../../src/core/types';

describe('集成测试', () => {
  describe('完整的格式化流程', () => {
    it('应该支持从基础数字到复杂格式化的完整流程', () => {
      const TestApp = () => (
        <NumberFormatProvider
          options={{
            locale: 'en-US',
            useGrouping: true,
          }}
        >
          <div>
            {/* 基础数字格式化 */}
            <NumberFormat
              value={1234567.89}
              options={{ style: 'decimal', maximumFractionDigits: 2 }}
              data-testid='basic-decimal'
            />

            {/* 货币格式化 */}
            <NumberFormat
              value={1234.56}
              options={{ style: 'currency', currency: 'USD' }}
              data-testid='currency'
            />

            {/* 百分比格式化 */}
            <NumberFormat
              value={0.1234}
              options={{ style: 'percent', maximumFractionDigits: 1 }}
              data-testid='percent'
            />

            {/* 单位格式化 */}
            <NumberFormat
              value={123}
              options={{ style: 'unit', unit: 'meter' }}
              data-testid='unit'
            />
          </div>
        </NumberFormatProvider>
      );

      render(<TestApp />);

      // 验证所有格式化结果
      expect(screen.getByTestId('basic-decimal')).toHaveTextContent('1,234,567.89');
      expect(screen.getByTestId('currency')).toHaveTextContent('$1,234.56');
      expect(screen.getByTestId('percent')).toHaveTextContent('12.3%');
      expect(screen.getByTestId('unit')).toHaveTextContent('123 m');
    });

    it('应该支持自动指标格式化完整流程', () => {
      const rules: MetricFormatRule[] = [
        {
          pattern: /conversion|rate|percentage/i,
          options: { style: 'percent', maximumFractionDigits: 2 },
        },
        {
          pattern: /revenue|price|cost|amount/i,
          options: { style: 'currency', currency: 'USD' },
        },
        {
          pattern: /count|users|views|clicks/i,
          options: { style: 'decimal', maximumFractionDigits: 0 },
        },
      ];

      const TestAutoMetrics = () => (
        <NumberFormatProvider
          options={{
            locale: 'en-US',
            rules,
          }}
        >
          <div>
            <AutoMetricNumber name='conversion_rate' value={0.1234} data-testid='auto-conversion' />

            <AutoMetricNumber name='total_revenue' value={12345.67} data-testid='auto-revenue' />

            <AutoMetricNumber name='user_count' value={1234.56} data-testid='auto-count' />

            <AutoMetricNumber
              name='unknown_metric'
              value={123.456}
              options={{ style: 'decimal', maximumFractionDigits: 2 }}
              data-testid='auto-unknown'
            />
          </div>
        </NumberFormatProvider>
      );

      render(<TestAutoMetrics />);

      expect(screen.getByTestId('auto-conversion')).toHaveTextContent('12.34%');
      expect(screen.getByTestId('auto-revenue')).toHaveTextContent('$12,345.67');
      expect(screen.getByTestId('auto-count')).toHaveTextContent('1,235');
      expect(screen.getByTestId('auto-unknown')).toHaveTextContent('123.456');
    });
  });

  describe('Context层级与优先级', () => {
    it('应该正确处理多层Context的配置优先级', () => {
      const TestNestedContext = () => (
        <NumberFormatProvider
          options={{
            locale: 'en-US',
            style: 'decimal',
            useGrouping: true,
            maximumFractionDigits: 2,
          }}
        >
          <NumberFormat value={1234.5678} data-testid='outer-context' />

          <NumberFormatProvider
            options={{
              locale: 'de-DE',
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 1,
            }}
          >
            <NumberFormat value={1234.5678} data-testid='inner-context' />

            <NumberFormat
              value={1234.5678}
              options={{
                style: 'decimal', // 组件props覆盖Context
                maximumFractionDigits: 3, // 组件props覆盖Context
              }}
              data-testid='override-inner'
            />
          </NumberFormatProvider>
        </NumberFormatProvider>
      );

      render(<TestNestedContext />);

      // 外层Context效果
      expect(screen.getByTestId('outer-context')).toHaveTextContent('1,234.57');

      // 内层Context效果（德语货币格式）
      const innerElement = screen.getByTestId('inner-context');
      expect(innerElement.textContent).toMatchSnapshot('nested-inner-context');

      // 组件props覆盖内层Context
      const overrideElement = screen.getByTestId('override-inner');
      expect(overrideElement.textContent).toMatchSnapshot('nested-override');
    });
  });

  describe('性能和大量数据处理', () => {
    it('应该能处理大量数字格式化', () => {
      const numbers = Array.from({ length: 100 }, (_, i) => i * 123.45);

      const TestManyNumbers = () => (
        <NumberFormatProvider
          options={{
            locale: 'en-US',
            style: 'decimal',
            maximumFractionDigits: 2,
          }}
        >
          <div>
            {numbers.map((num, index) => (
              <NumberFormat key={index} value={num} data-testid={`number-${index}`} />
            ))}
          </div>
        </NumberFormatProvider>
      );

      const startTime = performance.now();
      render(<TestManyNumbers />);
      const endTime = performance.now();

      // 性能测试：100个数字格式化应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(1000); // 1秒内

      // 抽查几个结果
      expect(screen.getByTestId('number-0')).toHaveTextContent('0');
      expect(screen.getByTestId('number-1')).toHaveTextContent('123.45');
      expect(screen.getByTestId('number-10')).toHaveTextContent('1,234.5');
    });
  });

  describe('完整功能快照测试', () => {
    it('应该为完整的应用场景生成快照', () => {
      const rules: MetricFormatRule[] = [
        {
          name: 'financial',
          pattern: /revenue|profit|cost/i,
          options: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        },
        {
          name: 'performance',
          pattern: /rate|ratio|percentage/i,
          options: { style: 'percent', maximumFractionDigits: 1 },
        },
      ];

      const FullFeaturedApp = () => (
        <NumberFormatProvider
          options={{
            locale: 'en-US',
            useGrouping: true,
            rules,
          }}
        >
          <div data-testid='full-app'>
            <h1>Financial Dashboard</h1>

            <section>
              <h2>Revenue Metrics</h2>
              <AutoMetricNumber name='total_revenue' value={1234567.89} />
              <AutoMetricNumber name='operating_cost' value={456789.12} />
            </section>

            <section>
              <h2>Performance Metrics</h2>
              <AutoMetricNumber name='conversion_rate' value={0.1234} />
              <AutoMetricNumber name='growth_rate' value={0.0567} />
            </section>

            <section>
              <h2>Custom Formats</h2>
              <NumberFormat
                value={123456789}
                options={{
                  style: 'decimal',
                  notation: 'compact',
                  compactDisplay: 'short',
                }}
              />
              <NumberFormat
                value={0.123}
                options={{ style: 'per-mille' as any, maximumFractionDigits: 1 }}
              />
            </section>
          </div>
        </NumberFormatProvider>
      );

      const { container } = render(<FullFeaturedApp />);
      expect(container.firstChild).toMatchSnapshot('full-featured-app');
    });
  });
});
