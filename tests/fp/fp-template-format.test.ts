import { afterEach, describe, expect, it } from 'vitest';

import {
  configTemplates,
  formatWithTemplate,
  formatWithTemplateEx,
  resetTemplateConfig,
} from '../../src/fp';

describe('formatWithTemplate 模板格式化能力', () => {
  afterEach(() => {
    resetTemplateConfig();
  });

  it('默认使用精度格式化十进制且不分组', () => {
    const result = formatWithTemplate('.2f', 1234.567);
    expect(result).toBe('1234.57');
  });

  it('存在逗号标记时启用分组', () => {
    const result = formatWithTemplate(',.2f', 1234.567);
    expect(result).toBe('1,234.57');
  });

  it('支持货币符号快捷方式并应用默认货币', () => {
    configTemplates({ settings: { currency: 'USD' } });
    const formatted = formatWithTemplate('$.2f', 1234.5, { locale: 'en-US' });
    expect(formatted).toBe('$1,234.50');
  });

  it('支持通过 token 启用货币格式而非依赖符号', () => {
    configTemplates({ settings: { currency: 'JPY' } });
    const formatted = formatWithTemplate('currency|.0f', 1234.5, { locale: 'ja-JP' });
    expect(formatted).toBe('￥1,235');
  });

  it('支持 ~ 标记去除多余的尾随零', () => {
    const formatted = formatWithTemplate('.2~f', 12.3);
    expect(formatted).toBe('12.3');
  });

  it('能够使用精度格式化百分比模板', () => {
    const formatted = formatWithTemplate('.1p', 0.1234);
    expect(formatted).toBe('12.3%');
  });

  it('支持结合地区覆盖的紧凑和科学计数法', () => {
    const compact = formatWithTemplate('.3s', 1234000, { locale: 'en-US' });
    const scientific = formatWithTemplate('.2e', 1234, { locale: 'en-US' });

    expect(compact).toBe('1.23M');
    expect(scientific).toBe('1.23E3');
  });

  it('支持千分比、万分比与百分点 token', () => {
    const perMille = formatWithTemplate('perMille|.1f', 0.1234);
    const perMyriad = formatWithTemplate('perMyriad|.1f', 0.01234);
    const percentagePoint = formatWithTemplate('percentagePoint|.2f', 0.1234);

    expect(perMille).toBe('123.4‰');
    expect(perMyriad).toBe('123.4‱');
    expect(percentagePoint).toBe('12.34pp');
  });

  it('支持使用符号 token 表示千分比与万分比', () => {
    const permilleSymbol = formatWithTemplate('‰|.0f', 0.256);
    const permyriadSymbol = formatWithTemplate('‱|.1f', 0.00042);

    expect(permilleSymbol).toBe('256‰');
    expect(permyriadSymbol).toBe('4.2‱');
  });

  it('支持通过 token 输出中文大写数字', () => {
    const formatted = formatWithTemplate('cnUpper|', 1234.56);
    expect(formatted).toBe('壹仟贰佰叁拾肆点伍陆');
  });

  it('formatWithTemplateEx 返回完整的格式化结果对象', () => {
    const result = formatWithTemplateEx('.1f', 1.2345);

    expect(result.formattedValue).toBe('1.2');
    expect(result.resolvedOptions.style).toBe('decimal');
    expect(result.sign.isPositive).toBe(true);
  });

  it('支持注册自定义 specifier 并复用插件', () => {
    configTemplates({
      specifiers: {
        m: {
          targetType: 'perMille',
          forced: { style: 'per-mille' },
        },
      },
    });

    const formatted = formatWithTemplate('m', 0.1234, { maximumFractionDigits: 1 });
    expect(formatted).toBe('123.4‰');
  });

  it('支持注册可复用动态精度插件的自定义 token', () => {
    const base = formatWithTemplate('.2f', 0.0001234);

    configTemplates({
      tokens: {
        'decimal-auto': {
          targetType: 'decimal',
          forced: {
            style: 'decimal',
            extend_dynamicDecimals: { maxFractionDigits: 8, additionalDigits: 1 },
          },
        },
      },
    });

    const enhanced = formatWithTemplate('decimal-auto|f', 0.0001234, {
      maximumFractionDigits: 2,
    });

    expect(base).toBe('0.00');
    expect(enhanced).toBe('0.00012');
  });

  it('未匹配到模板配置时抛出包含包信息的错误', () => {
    expect(() => formatWithTemplate('|z', 1)).toThrowError(
      '[internationalized@0.0.1][fp.templates.resolveTemplate] 未支持的模板类型 "z"',
    );
  });
});
