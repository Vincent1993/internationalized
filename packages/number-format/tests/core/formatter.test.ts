/**
 * @file 核心格式化器 (formatter) 测试
 * @description 验证 createFormatterCore 和 resolveFormatOptions 的功能，
 *   包括配置合并、插件应用和对不同输入的处理。
 */

import Big from 'big.js';
import { createFormatterCore, resolveFormatOptions } from '../../src/core/formatter';
import { resetPlugins, registerPlugin } from '../../src/plugins';
import type { FormatPlugin } from '../../src/plugins/types';

// 模拟插件，用于测试插件执行流程
const preProcessPlugin: FormatPlugin = {
  name: 'pre-process-test',
  version: '1.0.0',
  phase: 'pre-process',
  isApplicable: () => true,
  processValue: (value) => {
    return Big(value).times(10).toNumber();
  },
  processOptions: (options) => ({ ...options, maximumFractionDigits: 2 }),
};

const postProcessPlugin: FormatPlugin = {
  name: 'post-process-test',
  version: '1.0.0',
  phase: 'post-process',
  isApplicable: () => true,
  processResult: (formatted, parts) => ({
    formattedValue: `[post] ${formatted}`,
    parts: [{ type: 'literal', value: '[post] ' }, ...parts],
  }),
};

describe('核心格式化器 (formatter)', () => {
  beforeEach(() => {
    resetPlugins([]); // 每个测试前清空插件
  });

  describe('resolveFormatOptions', () => {
    it('应能正确解析基础选项', () => {
      const options = resolveFormatOptions({ style: 'currency', currency: 'USD' });
      expect(options.style).toBe('currency');
      expect(options.currency).toBe('USD');
      expect(options.locale).toBe('zh-CN'); // 默认 locale
    });

    it('应能合并上下文默认配置', () => {
      const contextDefaults = { locale: 'en-US', useGrouping: false };
      const options = resolveFormatOptions({ style: 'decimal' }, contextDefaults);
      expect(options.locale).toBe('en-US');
      expect(options.useGrouping).toBe(false);
    });

    it('本地选项应覆盖上下文默认配置', () => {
      const contextDefaults = { locale: 'en-US', maximumFractionDigits: 2 };
      const options = resolveFormatOptions({ locale: 'fr-FR' }, contextDefaults);
      expect(options.locale).toBe('fr-FR');
      expect(options.maximumFractionDigits).toBe(2);
    });

    it('当 style 为插件扩展类型时，应回退到 decimal', () => {
      const options = resolveFormatOptions({ style: 'per-mille' });
      expect(options.originalStyle).toBe('per-mille');
      // Intl.ResolvedNumberFormatOptions 中 style 会是 decimal
      expect(options.style).toBe('decimal');
    });

    it('应支持新的插件扩展样式', () => {
      const perMyriad = resolveFormatOptions({ style: 'per-myriad' });
      expect(perMyriad.originalStyle).toBe('per-myriad');
      expect(perMyriad.style).toBe('decimal');

      const percentagePoint = resolveFormatOptions({ style: 'percentage-point' });
      expect(percentagePoint.originalStyle).toBe('percentage-point');
      expect(percentagePoint.style).toBe('decimal');

      const chineseUpper = resolveFormatOptions({ style: 'cn-upper' });
      expect(chineseUpper.originalStyle).toBe('cn-upper');
      expect(chineseUpper.style).toBe('decimal');
    });
  });

  describe('createFormatterCore', () => {
    it('应能创建一个功能完备的格式化函数', () => {
      const formatter = createFormatterCore({ style: 'currency', currency: 'JPY' });
      const result = formatter.format(12345);
      expect(result.formattedValue).toBe('JP¥12,345');
      expect(result.isNaN).toBe(false);
    });

    it('应能正确处理无效值并短路到 fallback 插件', () => {
      // 注册一个 fallback 插件来处理 null
      const fallbackForNull: FormatPlugin = {
        name: 'fallback-null',
        version: '1.0.0',
        phase: 'post-process',
        isApplicable: (ctx) => ctx.valueState === 'null',
        processResult: () => ({ formattedValue: 'NULL_FALLBACK', parts: [] }),
      };
      registerPlugin(fallbackForNull);

      const formatter = createFormatterCore({ style: 'decimal' });
      const result = formatter.format(null as unknown as number);

      expect(result.formattedValue).toBe('NULL_FALLBACK');
      expect(result.isNaN).toBe(true);
    });

    it('应能按 pre-process -> base -> post-process 的顺序应用插件', () => {
      registerPlugin(preProcessPlugin);
      registerPlugin(postProcessPlugin);

      const formatter = createFormatterCore({ style: 'decimal' });
      // 原始值: 1.2345
      // pre-process * 10 => 12.345
      // base format with minFractionDigits: 2 => 12.35
      // post-process prepend => [post] 12.35
      const result = formatter.format(1.2345);

      expect(result.formattedValue).toBe('[post] 12.35');
    });

    it('当没有适用的 fallback 插件时，应返回默认的 NaN 展示', () => {
      const formatter = createFormatterCore({ style: 'decimal' });
      const result = formatter.format('invalid-string' as unknown as number);
      expect(result.formattedValue).toBe('NaN');
      expect(result.isNaN).toBe(true);
    });
  });
});
