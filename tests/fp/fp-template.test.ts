import { afterEach, describe, expect, it } from 'vitest';
import {
  formatWithTemplate,
  formatWithTemplateEx,
  resolveTemplateOptions,
  configureFormatTemplate,
  getFormatTemplateConfig,
  registerTemplateHandler,
  resetFormatTemplateConfig,
} from '../../src/fp';

describe('FP 模板格式化能力', () => {
  afterEach(() => {
    resetFormatTemplateConfig();
  });

  it('应该支持 D3 风格的小数与符号控制', () => {
    const result = formatWithTemplate('+.2f', 12.3456, { locale: 'en-US' });
    expect(result).toBe('+12.35');
  });

  it('应该返回完整的格式化结果用于后续处理', () => {
    const result = formatWithTemplateEx('0.1%', 0.1234, { locale: 'en-US' });

    expect(result.formattedValue).toBe('12.3%');
    expect(result.resolvedOptions.style).toBe('percent');
    expect(result.resolvedOptions.maximumFractionDigits).toBe(1);
  });

  it('应该自动支持内置插件样式（per-mille）', () => {
    const formatted = formatWithTemplate('0.1P', 0.456, { locale: 'en-US' });
    expect(formatted).toBe('456.0‰');
  });

  it('应该解析模板并返回核心可消费的选项', () => {
    const { options } = resolveTemplateOptions('$.2f', { currency: 'USD', locale: 'en-US' });

    expect(options).toMatchObject({
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      extend_fixDecimals: 2,
      useGrouping: false,
    });
  });

  it('应该允许通过配置模块设定默认货币', () => {
    configureFormatTemplate({ defaultCurrency: 'CNY' });

    const { options } = resolveTemplateOptions('$.0f');
    expect(options.currency).toBe('CNY');
    expect(getFormatTemplateConfig().defaultCurrency).toBe('CNY');
  });

  it('应该允许注册自定义模板处理器以支持插件样式', () => {
    registerTemplateHandler('Z', () => ({ style: 'per-mille', extend_fixDecimals: 2 }));

    const formatted = formatWithTemplate('Z', 0.25, { locale: 'en-US' });
    expect(formatted).toBe('250.00‰');
  });
});

