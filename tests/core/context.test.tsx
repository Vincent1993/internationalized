/**
 * @file 数字格式化上下文（Context）测试
 * @description 验证 NumberFormatProvider 和 useNumberFormat 的行为，特别是在插件和配置继承方面。
 */

import { render, screen } from '@testing-library/react';
import { NumberFormatProvider } from '../../src/core/context';
import { useFormat } from '../../src/hooks/useFormat';
import { resetPlugins, registerPlugin } from '../../src/plugins';
import type { FormatPlugin } from '../../src/plugins/types';

// 一个模拟的后处理插件，用于测试插件继承
const suffixPlugin: FormatPlugin = {
  name: 'suffix-plugin',
  version: '1.0.0',
  phase: 'post-process',
  isApplicable: () => true,
  processResult: (formattedValue, parts) => ({
    formattedValue: `${formattedValue} [插件]`,
    parts: [...parts, { type: 'literal', value: ' [插件]' }],
  }),
};

// 一个消费者组件，用于显示格式化结果
const TestConsumer = ({ value, ...options }: any) => {
  const { format } = useFormat(options);
  const result = format(value);
  return <span data-testid='result'>{result.formattedValue}</span>;
};

describe('数字格式化上下文 (NumberFormatProvider)', () => {
  beforeEach(() => {
    // 在每个测试前重置插件，确保环境干净
    resetPlugins([]);
  });

  it('应能为子组件提供默认的格式化配置', () => {
    render(
      <NumberFormatProvider options={{ locale: 'en-US', style: 'currency', currency: 'USD' }}>
        <TestConsumer value={1234.5} />
      </NumberFormatProvider>,
    );
    // 验证 locale 和 currency 是否生效
    expect(screen.getByTestId('result').textContent).toBe('$1,234.50');
  });

  it('子组件的配置应能覆盖 Provider 的默认配置', () => {
    render(
      <NumberFormatProvider options={{ locale: 'en-US', style: 'currency', currency: 'USD' }}>
        <TestConsumer value={1234.5} currency='EUR' />
      </NumberFormatProvider>,
    );
    // 验证子组件的 currency ('EUR') 是否覆盖了 Provider 的 'USD'
    expect(screen.getByTestId('result').textContent).toBe('€1,234.50');
  });

  it('嵌套的 Provider 应能继承并覆盖父级 Provider 的配置', () => {
    render(
      <NumberFormatProvider options={{ locale: 'en-US', style: 'currency', currency: 'USD' }}>
        <NumberFormatProvider options={{ currency: 'JPY', minimumFractionDigits: 0 }}>
          <TestConsumer value={1234} />
        </NumberFormatProvider>
      </NumberFormatProvider>,
    );
    // 验证 locale ('en-US') 被继承，而 currency ('JPY') 被覆盖
    expect(screen.getByTestId('result').textContent).toBe('¥1,234');
  });

  it('Provider 中注册的插件应对子组件生效', () => {
    registerPlugin(suffixPlugin);

    render(
      <NumberFormatProvider options={{ locale: 'zh-CN' }}>
        <TestConsumer value={100} />
      </NumberFormatProvider>,
    );

    // 验证 suffixPlugin 是否被应用
    expect(screen.getByTestId('result').textContent).toBe('100 [插件]');
  });

  it('useNumberFormat 在没有 Provider 时应使用默认配置', () => {
    render(<TestConsumer value={1234.56} style='decimal' maximumFractionDigits={1} />);
    // 验证默认 locale ('zh-CN') 和 useNumberFormat 的本地配置
    expect(screen.getByTestId('result').textContent).toBe('1,234.6');
  });
});