import { describe, it, expect, beforeEach } from 'vitest';

import {
  formatAsDecimalEx,
  formatAsInteger,
  formatAsIntegerEx,
  formatAsCurrencyEx,
  formatAsPercentEx,
  formatAsPerMilleEx,
  formatAsPerMyriadEx,
  formatAsPercentagePointEx,
  formatAsChineseUppercaseEx,
  formatAsCompactEx,
  formatAsScientificEx,
  clearCache,
} from '../../src/fp';

describe('FP 格式化器扩展结果', () => {
  beforeEach(() => {
    clearCache();
  });

  it('formatAsDecimalEx 应该返回完整的格式化结果', () => {
    const result = formatAsDecimalEx(1234.5, { maximumFractionDigits: 1 });

    expect(result.formattedValue).toBe('1,234.5');
    expect(result.resolvedOptions.style).toBe('decimal');
    expect(result.sign.isPositive).toBe(true);
  });

  it('formatAsInteger 和 formatAsIntegerEx 应该忽略 maximumFractionDigits', () => {
    const formatted = formatAsInteger(1234.56, { maximumFractionDigits: 4 });
    const result = formatAsIntegerEx(1234.56, { maximumFractionDigits: 4 });

    expect(formatted).toBe('1,235');
    expect(result.formattedValue).toBe('1,235');
    expect(result.resolvedOptions.maximumFractionDigits).toBe(0);
  });

  it('formatAsCurrencyEx 应该返回货币样式的完整信息', () => {
    const result = formatAsCurrencyEx(99.99, 'USD', { minimumFractionDigits: 2 });

    expect(result.formattedValue).toBe('US$99.99');
    expect(result.resolvedOptions.style).toBe('currency');
    expect(result.resolvedOptions.currency).toBe('USD');
  });

  it('formatAsPercentEx 应该正确处理百分比', () => {
    const result = formatAsPercentEx(0.256, { maximumFractionDigits: 1 });

    expect(result.formattedValue).toBe('25.6%');
    expect(result.resolvedOptions.style).toBe('percent');
  });

  it('formatAsPerMilleEx 应该渲染千分比并保留扩展选项', () => {
    const result = formatAsPerMilleEx(0.1234, { maximumFractionDigits: 1 });

    expect(result.formattedValue).toBe('123.4‰');
    expect(result.resolvedOptions.style).toBe('decimal');
    expect(result.resolvedOptions.notation).toBe('standard');
  });

  it('formatAsPerMyriadEx 应该渲染万分比并保留扩展选项', () => {
    const result = formatAsPerMyriadEx(0.01234, { maximumFractionDigits: 1 });

    expect(result.formattedValue).toBe('123.4‱');
    expect(result.resolvedOptions.style).toBe('decimal');
  });

  it('formatAsPercentagePointEx 应该渲染百分点并保留扩展选项', () => {
    const result = formatAsPercentagePointEx(0.1234, { maximumFractionDigits: 2 });

    expect(result.formattedValue).toBe('12.34pp');
    expect(result.resolvedOptions.style).toBe('decimal');
  });

  it('formatAsChineseUppercaseEx 应该返回中文大写数字', () => {
    const result = formatAsChineseUppercaseEx(1234.56);

    expect(result.formattedValue).toBe('壹仟贰佰叁拾肆点伍陆');
    expect(result.resolvedOptions.originalStyle).toBe('cn-upper');
  });

  it('formatAsCompactEx 应该启用紧凑记数法', () => {
    const result = formatAsCompactEx(1234000, { maximumFractionDigits: 1 });

    expect(result.formattedValue).toBe('123.4万');
    expect(result.resolvedOptions.notation).toBe('compact');
  });

  it('formatAsScientificEx 应该启用科学记数法', () => {
    const result = formatAsScientificEx(12345, { maximumFractionDigits: 2 });

    expect(result.formattedValue).toBe('1.23E4');
    expect(result.resolvedOptions.notation).toBe('scientific');
  });
});
