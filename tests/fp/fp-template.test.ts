import { afterEach, describe, expect, it } from 'vitest';
import {
  formatWithTemplate,
  resolveTemplateOptions,
  configureFormatTemplate,
  registerTemplateHandler,
  registerPluginTemplateHandlers,
  unregisterPluginTemplateHandlers,
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

  it('应该允许通过模板解析结果获取完整配置', () => {
    const resolution = resolveTemplateOptions('0.1%', { locale: 'en-US' });

    expect(resolution.options.style).toBe('percent');
    expect(resolution.options.maximumFractionDigits).toBe(1);
  });

  it('应该自动支持内置插件样式（per-mille）', () => {
    const formatted = formatWithTemplate('0.1P', 0.456, { locale: 'en-US' });
    expect(formatted).toBe('456.0‰');
  });

  it('重置配置后仍应保留插件模板处理器', () => {
    resetFormatTemplateConfig();
    const formatted = formatWithTemplate('0.2P', 0.123, { locale: 'en-US' });
    expect(formatted).toBe('123.00‰');
  });

  it('应该支持通过插件注册模板处理器并且可以注销', () => {
    registerPluginTemplateHandlers('test-plugin', [
      {
        type: 'X',
        handler: () => ({ style: 'per-mille', extend_fixDecimals: 1 }),
        defaults: { useGrouping: true },
      },
    ]);

    const formatted = formatWithTemplate('X', 0.12, { locale: 'en-US' });
    expect(formatted).toBe('120.0‰');

    unregisterPluginTemplateHandlers('test-plugin');
    const { options } = resolveTemplateOptions('X', { locale: 'en-US' });
    expect(options.style).toBe('decimal');
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
    const { options: fallbackOptions } = resolveTemplateOptions('$.0f');
    expect(fallbackOptions.currency).toBe('CNY');
  });

  it('应该允许注册自定义模板处理器以支持插件样式', () => {
    registerTemplateHandler('Z', () => ({ style: 'per-mille', extend_fixDecimals: 2 }));

    const formatted = formatWithTemplate('Z', 0.25, { locale: 'en-US' });
    expect(formatted).toBe('250.00‰');
  });
});

