import { renderHook } from '@testing-library/react';
import React from 'react';
import { useFormat } from '../../src/hooks/useFormat';
import { NumberFormatProvider } from '../../src/core/context';
import type { UseFormatOptions } from '../../src/core/types';

describe('hooks/useFormat', () => {
  it('应该返回NumberFormatter对象', () => {
    const { result } = renderHook(() => useFormat());

    expect(result.current).toHaveProperty('format');
    expect(result.current).toHaveProperty('resolveOptions');
    expect(typeof result.current.format).toBe('function');
    expect(typeof result.current.resolveOptions).toBe('function');
  });

  it('应该使用默认配置格式化数值', () => {
    const { result } = renderHook(() => useFormat());

    const formatResult = result.current.format(1234.56);
    expect(formatResult).toMatchSnapshot();
  });

  it('应该支持自定义配置', () => {
    const options: UseFormatOptions = {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    };

    const { result } = renderHook(() => useFormat(options));

    const formatResult = result.current.format(1234.5);
    expect(formatResult).toMatchSnapshot();
  });

  describe('与Context集成测试', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NumberFormatProvider
        options={{
          locale: 'en-US',
          useGrouping: false,
          minimumFractionDigits: 1,
        }}
      >
        {children}
      </NumberFormatProvider>
    );

    it('应该使用Context提供的默认配置', () => {
      const { result } = renderHook(() => useFormat(), { wrapper });

      const resolved = result.current.resolveOptions();
      expect(resolved.locale).toBe('en-US');
      expect(resolved.useGrouping).toBe(false);
      expect(resolved.minimumFractionDigits).toBe(1);
    });

    it('应该允许局部配置覆盖Context配置', () => {
      const { result } = renderHook(
        () =>
          useFormat({
            style: 'percent',
            minimumFractionDigits: 2, // 覆盖Context的1
          }),
        { wrapper },
      );

      const resolved = result.current.resolveOptions();
      expect(resolved.locale).toBe('en-US'); // 从Context
      expect(resolved.style).toBe('percent'); // 局部配置
      expect(resolved.minimumFractionDigits).toBe(2); // 局部覆盖Context
    });
  });

  describe('性能测试', () => {
    it('应该在配置不变时重用formatter', () => {
      const options = { style: 'decimal' as const };

      const { result, rerender } = renderHook(() => useFormat(options));
      const firstFormatter = result.current;

      rerender();
      const secondFormatter = result.current;

      // 因为使用了useMemo，配置相同时应该返回相同的引用
      expect(firstFormatter).toStrictEqual(secondFormatter);
    });

    it('应该在配置改变时创建新formatter', () => {
      let options = { style: 'decimal' as const };

      const { result, rerender } = renderHook(() => useFormat(options));
      const firstFormatter = result.current;

      options = { style: 'percent' };
      rerender();
      const secondFormatter = result.current;

      // 配置改变时应该返回新的引用
      expect(firstFormatter).not.toBe(secondFormatter);
    });
  });

  describe('resolveOptions功能测试', () => {
    it('应该返回正确的解析选项', () => {
      const { result } = renderHook(() =>
        useFormat({
          style: 'currency',
          currency: 'JPY',
          locale: 'ja-JP',
        }),
      );

      const resolved = result.current.resolveOptions();

      expect(resolved.style).toBe('currency');
      expect(resolved.currency).toBe('JPY');
      expect(resolved.locale).toBe('ja-JP');
      expect(resolved).toMatchSnapshot();
    });

    it('format结果和resolveOptions应该一致', () => {
      const { result } = renderHook(() =>
        useFormat({
          style: 'percent',
          maximumFractionDigits: 1,
        }),
      );

      const formatResult = result.current.format(0.1234);
      const resolved = result.current.resolveOptions();

      expect(formatResult.resolvedOptions).toEqual(resolved);
    });
  });
});
