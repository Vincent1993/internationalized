/**
 * @file 数字解析器测试
 * @description 测试核心解析功能
 */

import { NumberParser, createNumberParser, parseNumber } from '../../src/core/parser';

describe('NumberParser', () => {
  describe('基础解析功能', () => {
    it('应该解析简单的小数', () => {
      const parser = new NumberParser();
      const result = parser.parse('1234.56');

      expect(result.success).toBe(true);
      expect(result.value).toBe(1234.56);
      expect(result.error).toBe(null);
    });

    it('应该解析带分组分隔符的数字', () => {
      const parser = new NumberParser();
      const result = parser.parse('1,234,567.89');

      expect(result.success).toBe(true);
      expect(result.value).toBe(1234567.89);
    });

    it('应该解析负数', () => {
      const parser = new NumberParser();
      const result = parser.parse('-1,234.56');

      expect(result.success).toBe(true);
      expect(result.value).toBe(-1234.56);
    });

    it('应该处理空字符串', () => {
      const parser = new NumberParser();
      const result = parser.parse('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('应该处理无效输入', () => {
      const parser = new NumberParser();
      const result = parser.parse('invalid');

      expect(result.success).toBe(false);
      expect(result.value).toBeNaN();
      expect(result.error).toBeTruthy();
    });
  });

  describe('百分比解析', () => {
    it('应该解析百分比格式', () => {
      const parser = new NumberParser({ style: 'percent' });
      const result = parser.parse('12.34%');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.1234);
    });

    it('应该在非严格模式下解析无百分号的数字', () => {
      const parser = new NumberParser({ style: 'percent', strict: false });
      const result = parser.parse('12.34');

      expect(result.success).toBe(true);
      expect(result.value).toBe(12.34);
    });

    it('应该在严格模式下要求百分号', () => {
      const parser = new NumberParser({ style: 'percent', strict: true });
      const result = parser.parse('12.34');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Percent symbol');
    });
  });

  describe('货币解析', () => {
    it('应该解析美元格式', () => {
      const parser = new NumberParser({ style: 'currency', currency: 'USD' });
      const result = parser.parse('$1,234.56');

      expect(result.success).toBe(true);
      expect(result.value).toBe(1234.56);
    });

    it('应该解析欧元格式', () => {
      const parser = new NumberParser({
        style: 'currency',
        currency: 'EUR',
        locale: 'de-DE'
      });
      const result = parser.parse('€1.234,56');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(1234.56);
    });

    it('应该移除货币符号', () => {
      const parser = new NumberParser({ style: 'currency', currency: 'JPY' });
      const result = parser.parse('¥1,235');

      expect(result.success).toBe(true);
      expect(result.value).toBe(1235);
    });
  });

  describe('千分比解析', () => {
    it('应该解析千分比格式', () => {
      const parser = new NumberParser({ style: 'per-mille' });
      const result = parser.parse('123.4‰');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.1234);
    });

    it('应该在严格模式下要求千分符', () => {
      const parser = new NumberParser({ style: 'per-mille', strict: true });
      const result = parser.parse('123.4');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Per-mille symbol');
    });
  });

  describe('地区化支持', () => {
    it('应该支持德语地区格式', () => {
      const parser = new NumberParser({ locale: 'de-DE' });
      const result = parser.parse('1.234,56');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(1234.56);
    });

    it('应该支持自定义分隔符', () => {
      const parser = new NumberParser({
        groupSeparator: ' ',
        decimalSeparator: ','
      });
      const result = parser.parse('1 234,56');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(1234.56);
    });
  });

  describe('选项更新', () => {
    it('应该能更新解析器选项', () => {
      const parser = new NumberParser();

      // 初始解析
      let result = parser.parse('$100');
      expect(result.success).toBe(false);

      // 更新为货币模式
      parser.updateOptions({ style: 'currency', currency: 'USD' });
      result = parser.parse('$100');
      expect(result.success).toBe(true);
      expect(result.value).toBe(100);
    });
  });
});

describe('createNumberParser', () => {
  it('应该创建解析器实例', () => {
    const parser = createNumberParser({ style: 'percent' });
    expect(parser).toBeInstanceOf(NumberParser);

    const result = parser.parse('50%');
    expect(result.success).toBe(true);
    expect(result.value).toBe(0.5);
  });
});

describe('parseNumber 快速函数', () => {
  it('应该快速解析数字', () => {
    const result = parseNumber('1,234.56');
    expect(result.success).toBe(true);
    expect(result.value).toBe(1234.56);
  });

  it('应该支持传入选项', () => {
    const result = parseNumber('50%', { style: 'percent' });
    expect(result.success).toBe(true);
    expect(result.value).toBe(0.5);
  });
});

describe('边界情况和错误处理', () => {
  it('应该处理特殊数值', () => {
    const parser = new NumberParser();

    expect(parser.parse('0').value).toBe(0);
    expect(parser.parse('-0').value).toBe(-0);
    expect(parser.parse('∞').success).toBe(true);
    expect(parser.parse('∞').value).toBe(Infinity);
    expect(parser.parse('N/A').success).toBe(true);
    expect(parser.parse('N/A').value).toBeNaN();
  });

  it('应该处理极大和极小数字', () => {
    const parser = new NumberParser();

    const largeNumber = parser.parse('999,999,999,999.99');
    expect(largeNumber.success).toBe(true);
    expect(largeNumber.value).toBe(999999999999.99);

    const smallNumber = parser.parse('0.000001');
    expect(smallNumber.success).toBe(true);
    expect(smallNumber.value).toBe(0.000001);
  });

  it('应该处理非字符串输入', () => {
    const parser = new NumberParser();
    const result = parser.parse(123 as any);

    expect(result.success).toBe(false);
    expect(result.error).toContain('must be a string');
  });

  it('应该处理多个小数点', () => {
    const parser = new NumberParser();
    const result = parser.parse('12.34.56');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
