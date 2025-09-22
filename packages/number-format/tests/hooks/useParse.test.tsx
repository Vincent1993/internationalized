/**
 * @file useParse Hook 测试
 * @description 测试解析 Hook 功能
 */

import { renderHook } from '@testing-library/react';
import { useParse } from '../../src/hooks/useParse';
import { NumberFormatProvider } from '../../src/core/context';
import type { ReactNode } from 'react';

describe('useParse', () => {
  it('应该返回解析函数和解析器实例', () => {
    const { result } = renderHook(() => useParse());

    expect(result.current.parse).toBeInstanceOf(Function);
    expect(result.current.parser).toBeTruthy();
    expect(result.current.options).toBeTruthy();
  });

  it('应该解析基本数字', () => {
    const { result } = renderHook(() => useParse());
    const parseResult = result.current.parse('1,234.56');

    expect(parseResult.success).toBe(true);
    expect(parseResult.value).toBe(1234.56);
    expect(parseResult.mathSign).toBe(1);
    expect(parseResult.isInteger).toBe(false);
  });

  it('应该使用指定的解析选项', () => {
    const { result } = renderHook(() =>
      useParse({ style: 'percent' })
    );

    const parseResult = result.current.parse('12.34%');
    expect(parseResult.success).toBe(true);
    expect(parseResult.value).toBeCloseTo(0.1234);
  });

  it('应该继承上下文选项', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NumberFormatProvider options={{ locale: 'de-DE' }}>
        {children}
      </NumberFormatProvider>
    );

    const { result } = renderHook(() => useParse(), { wrapper });

    expect(result.current.options.locale).toBe('de-DE');
  });

  it('应该合并格式化选项', () => {
    const { result } = renderHook(() =>
      useParse({
        formatOptions: { style: 'currency', currency: 'USD' }
      })
    );

    const parseResult = result.current.parse('$100.00');
    expect(parseResult.success).toBe(true);
    expect(parseResult.value).toBe(100);
  });

  it('应该在选项变化时重新创建解析器', () => {
    const { result, rerender } = renderHook(
      ({ strict }) => useParse({ strict }),
      { initialProps: { strict: false } }
    );

    const firstParser = result.current.parser;

    rerender({ strict: true });
    const secondParser = result.current.parser;

    expect(firstParser).not.toBe(secondParser);
  });
});
