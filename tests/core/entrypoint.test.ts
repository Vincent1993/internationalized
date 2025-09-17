import { describe, it, expect } from 'vitest';

import * as pkg from '../../src';
import * as hooks from '../../src/hooks';

describe('包入口导出', () => {
  it('应该暴露核心组件和 API', () => {
    expect(pkg.NumberFormat).toBeDefined();
    expect(pkg.AutoMetricNumber).toBeDefined();
    expect(pkg.NumberFormatProvider).toBeDefined();
    expect(pkg.createNumberFormat).toBeInstanceOf(Function);
    expect(pkg.parseNumber).toBeInstanceOf(Function);
  });

  it('应该暴露 Hooks 入口', () => {
    expect(pkg.useFormat).toBe(hooks.useFormat);
    expect(pkg.useAutoFormat).toBe(hooks.useAutoFormat);
    expect(pkg.useParse).toBe(hooks.useParse);
  });

  it('默认入口不再暴露 legacy Format', () => {
    expect('Format' in pkg).toBe(false);
  });
});
