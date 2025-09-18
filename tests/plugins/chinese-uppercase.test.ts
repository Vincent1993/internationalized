/**
 * @file 中文大写数字插件组测试
 */

import { createNumberFormat } from '../../src/core/formatter';
import { NumberParser } from '../../src/core/parser';
import { resetPlugins } from '../../src/plugins/registry';
import { chineseUppercasePluginGroup } from '../../src/plugins/chinese-uppercase';
import { fallbackPlugin } from '../../src/plugins/fallback';

describe('中文大写数字插件组', () => {
  beforeEach(() => {
    resetPlugins([chineseUppercasePluginGroup, fallbackPlugin]);
  });

  it('应能将数字转换为中文大写数字', () => {
    const formatter = createNumberFormat({ style: 'cn-upper' });
    expect(formatter.format(1234).formattedValue).toBe('壹仟贰佰叁拾肆');
  });

  it('应能正确处理小数部分', () => {
    const formatter = createNumberFormat({ style: 'cn-upper' });
    expect(formatter.format(1234.56).formattedValue).toBe('壹仟贰佰叁拾肆点伍陆');
  });

  it('应能正确处理负数', () => {
    const formatter = createNumberFormat({ style: 'cn-upper' });
    expect(formatter.format(-32).formattedValue).toBe('负叁拾贰');
  });

  it('应能与 fallback 插件协同工作，处理无效值', () => {
    const formatter = createNumberFormat({ style: 'cn-upper' });
    expect(formatter.format(null).formattedValue).toBe('N/A');
    expect(formatter.format(undefined).formattedValue).toBe('N/A');
  });

  describe('解析流程', () => {
    it('应能解析中文大写数字', () => {
      const parser = new NumberParser({ style: 'cn-upper' });
      const result = parser.parse('壹仟贰佰叁拾肆点伍陆');
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(1234.56);
    });

    it('应能解析带有负号的中文大写数字', () => {
      const parser = new NumberParser({ style: 'cn-upper' });
      const result = parser.parse('负叁拾贰');
      expect(result.success).toBe(true);
      expect(result.value).toBe(-32);
    });

    it('遇到无法解析的字符应返回失败', () => {
      const parser = new NumberParser({ style: 'cn-upper' });
      const result = parser.parse('壹佰贰拾A');
      expect(result.success).toBe(false);
    });
  });
});
