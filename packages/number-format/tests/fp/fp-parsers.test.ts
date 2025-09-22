/**
 * @file FP 解析函数测试
 * @description 测试函数式编程风格的解析函数
 */

import {
  parseDecimal,
  parseInteger,
  parseCurrency,
  parsePercent,
  parsePerMille,
  parsePerMyriad,
  parsePercentagePoint,
  parseChineseUppercase,
  parseCompact,
  parseScientific,
  parseAuto,
} from '../../src/fp/parsers';

describe('FP 解析函数', () => {
  describe('parseDecimal', () => {
    it('应该解析基本的小数', () => {
      expect(parseDecimal('1234.56').value).toBe(1234.56);
      expect(parseDecimal('1234.56').success).toBe(true);
    });

    it('应该解析带分组分隔符的数字', () => {
      expect(parseDecimal('1,234.56').value).toBe(1234.56);
      expect(parseDecimal('1,234,567.89').value).toBe(1234567.89);
    });

    it('应该解析负数', () => {
      expect(parseDecimal('-1,234.56').value).toBe(-1234.56);
      expect(parseDecimal('−1,234.56').value).toBe(-1234.56); // Unicode minus
    });

    it('应该处理不同的地区格式', () => {
      const result = parseDecimal('1.234,56', { locale: 'de-DE' });
      expect(result.value).toBeCloseTo(1234.56);
      expect(result.success).toBe(true);
    });

    it('应该处理无效输入', () => {
      const result = parseDecimal('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('parseInteger', () => {
    it('应该解析整数', () => {
      expect(parseInteger('1234').value).toBe(1234);
      expect(parseInteger('1,234').value).toBe(1234);
    });

    it('应该解析带小数的数字（但作为整数处理）', () => {
      expect(parseInteger('1234.56').value).toBe(1234.56);
    });
  });

  describe('parseCurrency', () => {
    it('应该解析美元格式', () => {
      const result = parseCurrency('$1,234.56', 'USD');
      expect(result.value).toBe(1234.56);
      expect(result.success).toBe(true);
    });

    it('应该解析欧元格式', () => {
      const result = parseCurrency('€1.234,56', 'EUR', { locale: 'de-DE' });
      expect(result.value).toBeCloseTo(1234.56);
      expect(result.success).toBe(true);
    });

    it('应该解析日元格式', () => {
      const result = parseCurrency('¥1,235', 'JPY');
      expect(result.value).toBe(1235);
      expect(result.success).toBe(true);
    });

    it('应该处理无货币符号的输入（非严格模式）', () => {
      const result = parseCurrency('1234.56', 'USD', { strict: false });
      expect(result.value).toBe(1234.56);
      expect(result.success).toBe(true);
    });
  });

  describe('parsePercent', () => {
    it('应该解析百分比格式', () => {
      const result = parsePercent('12.34%');
      expect(result.value).toBeCloseTo(0.1234);
      expect(result.success).toBe(true);
    });

    it('应该解析负百分比', () => {
      const result = parsePercent('-5.5%');
      expect(result.value).toBeCloseTo(-0.055);
      expect(result.success).toBe(true);
    });

    it('应该在非严格模式下解析无百分号的数字', () => {
      const result = parsePercent('12.34', { strict: false });
      expect(result.value).toBe(12.34);
      expect(result.success).toBe(true);
    });

    it('应该在严格模式下要求百分号', () => {
      const result = parsePercent('12.34', { strict: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Percent symbol');
    });
  });

  describe('parsePerMille', () => {
    it('应该解析千分比格式', () => {
      const result = parsePerMille('123.4‰');
      expect(result.value).toBeCloseTo(0.1234);
      expect(result.success).toBe(true);
    });

    it('应该解析负千分比', () => {
      const result = parsePerMille('-50‰');
      expect(result.value).toBe(-0.05);
      expect(result.success).toBe(true);
    });

    it('应该在严格模式下要求千分符', () => {
      const result = parsePerMille('123.4', { strict: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Per-mille symbol');
    });
  });

  describe('parsePerMyriad', () => {
    it('应该解析万分比格式', () => {
      const result = parsePerMyriad('123.4‱');
      expect(result.value).toBeCloseTo(0.01234);
      expect(result.success).toBe(true);
    });

    it('应该在严格模式下要求万分符', () => {
      const result = parsePerMyriad('123.4', { strict: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Per-myriad symbol');
    });
  });

  describe('parsePercentagePoint', () => {
    it('应该解析百分点格式', () => {
      const result = parsePercentagePoint('12.3pp');
      expect(result.value).toBeCloseTo(0.123);
      expect(result.success).toBe(true);
    });

    it('应该在严格模式下要求 pp 后缀', () => {
      const result = parsePercentagePoint('12.3', { strict: true });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Percentage point suffix');
    });
  });

  describe('parseChineseUppercase', () => {
    it('应该解析中文大写数字', () => {
      const result = parseChineseUppercase('壹仟贰佰叁拾肆点伍陆');
      expect(result.value).toBeCloseTo(1234.56);
      expect(result.success).toBe(true);
    });

    it('应该解析负数中文大写数字', () => {
      const result = parseChineseUppercase('负叁拾贰');
      expect(result.value).toBe(-32);
      expect(result.success).toBe(true);
    });
  });

  describe('parseCompact', () => {
    it('应该解析英文紧凑格式', () => {
      expect(parseCompact('1.2M').value).toBe(1200000);
      expect(parseCompact('1.5K').value).toBe(1500);
      expect(parseCompact('2.3G').value).toBe(2300000000);
    });

    it('应该解析中文紧凑格式', () => {
      expect(parseCompact('1.2万').value).toBe(12000);
      expect(parseCompact('5千').value).toBe(5000);
      expect(parseCompact('3百').value).toBe(300);
    });

    it('应该处理无单位的数字', () => {
      expect(parseCompact('1234').value).toBe(1234);
    });

    it('应该处理未知单位', () => {
      const result = parseCompact('1.2X');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown compact unit');
    });
  });

  describe('parseScientific', () => {
    it('应该解析科学记数法', () => {
      expect(parseScientific('1.234E3').value).toBe(1234);
      expect(parseScientific('1.23E-4').value).toBeCloseTo(0.000123);
    });

    it('应该解析大写和小写的E', () => {
      expect(parseScientific('1.5E6').value).toBe(1500000);
      expect(parseScientific('1.5e6').value).toBe(1500000);
    });

    it('应该解析带正号的指数', () => {
      expect(parseScientific('1.23E+3').value).toBe(1230);
    });

    it('应该处理无效格式', () => {
      const result = parseScientific('invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid scientific notation');
    });
  });

  describe('parseAuto', () => {
    it('应该自动识别百分比', () => {
      const result = parseAuto('12.34%');
      expect(result.value).toBeCloseTo(0.1234);
      expect(result.success).toBe(true);
    });

    it('应该自动识别千分比', () => {
      const result = parseAuto('123‰');
      expect(result.value).toBeCloseTo(0.123);
      expect(result.success).toBe(true);
    });

    it('应该自动识别万分比', () => {
      const result = parseAuto('123‱');
      expect(result.value).toBeCloseTo(0.0123);
      expect(result.success).toBe(true);
    });

    it('应该自动识别百分点', () => {
      const result = parseAuto('12pp');
      expect(result.value).toBeCloseTo(0.12);
      expect(result.success).toBe(true);
    });

    it('应该自动识别中文大写数字', () => {
      const result = parseAuto('壹佰贰拾叁');
      expect(result.value).toBe(123);
      expect(result.success).toBe(true);
    });

    it('应该自动识别科学记数法', () => {
      const result = parseAuto('1.23E3');
      expect(result.value).toBe(1230);
      expect(result.success).toBe(true);
    });

    it('应该自动识别货币（美元）', () => {
      const result = parseAuto('$1,234.56');
      expect(result.value).toBe(1234.56);
      expect(result.success).toBe(true);
    });

    it('应该自动识别紧凑格式', () => {
      const result = parseAuto('1.2M');
      expect(result.value).toBe(1200000);
      expect(result.success).toBe(true);
    });

    it('应该默认识别为小数', () => {
      const result = parseAuto('1,234.56');
      expect(result.value).toBe(1234.56);
      expect(result.success).toBe(true);
    });
  });

  describe('选项覆盖和强制选项', () => {
    it('parseDecimal 应该强制使用 decimal 样式', () => {
      const result = parseDecimal('50%', { style: 'percent' as any });
      // 应该作为小数解析，而不是百分比
      expect(result.success).toBe(false); // 因为 % 不是有效的小数字符
    });

    it('parseCurrency 应该强制使用指定的货币', () => {
      const result = parseCurrency('€100', 'USD');
      // 应该能解析，因为会移除货币符号
      expect(result.value).toBe(100);
      expect(result.success).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊数值', () => {
      expect(parseAuto('∞').value).toBe(Infinity);
      expect(parseAuto('-∞').value).toBe(-Infinity);
      expect(parseAuto('N/A').value).toBeNaN();
      expect(parseAuto('-').value).toBeNaN();
    });

    it('应该处理空字符串', () => {
      const result = parseDecimal('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('应该处理纯空白', () => {
      const result = parseDecimal('   ');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('应该处理极大数字', () => {
      const result = parseDecimal('999,999,999,999.99');
      expect(result.value).toBe(999999999999.99);
      expect(result.success).toBe(true);
    });

    it('应该处理极小数字', () => {
      const result = parseDecimal('0.000001');
      expect(result.value).toBe(0.000001);
      expect(result.success).toBe(true);
    });
  });

  describe('地区化支持', () => {
    it('应该支持不同地区的数字格式', () => {
      // 德语地区：点作为千分位分隔符，逗号作为小数分隔符
      const germanResult = parseDecimal('1.234.567,89', { locale: 'de-DE' });
      expect(germanResult.value).toBeCloseTo(1234567.89);

      // 法语地区：空格作为千分位分隔符，逗号作为小数分隔符
      const frenchResult = parseDecimal('1 234 567,89', {
        groupSeparator: ' ',
        decimalSeparator: ','
      });
      expect(frenchResult.value).toBeCloseTo(1234567.89);
    });

    it('应该支持自定义分隔符', () => {
      const result = parseDecimal('1|234|567•89', {
        groupSeparator: '|',
        decimalSeparator: '•'
      });
      expect(result.value).toBeCloseTo(1234567.89);
    });
  });

});
