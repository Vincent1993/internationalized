/**
 * @file 数字解析器测试
 * @description 测试核心解析功能
 */

import { NumberParser, createNumberParser, parseNumber } from '../../src/core/parser';
import { resetPlugins, clearRegisteredPlugins } from '../../src/plugins/registry';
import type { FormatPlugin } from '../../src/plugins/types';
import { perMillePluginGroup } from '../../src/plugins/per-mille';
import { perMyriadPluginGroup } from '../../src/plugins/per-myriad';
import { percentagePointPluginGroup } from '../../src/plugins/percentage-point';
import { chineseUppercasePluginGroup } from '../../src/plugins/chinese-uppercase';
import { fallbackPlugin } from '../../src/plugins/fallback';
import { validatorPlugin } from '../../src/plugins/validator';
import { fixDecimalsPlugin } from '../../src/plugins/fix-decimals';

const defaultPlugins = [
  validatorPlugin,
  perMillePluginGroup,
  perMyriadPluginGroup,
  percentagePointPluginGroup,
  chineseUppercasePluginGroup,
  fallbackPlugin,
  fixDecimalsPlugin,
];

describe('NumberParser', () => {
  describe('基础解析功能', () => {
    it('应该解析简单的小数', () => {
      const parser = new NumberParser();
      const result = parser.parse('1234.56');

      expect(result.success).toBe(true);
      expect(result.value).toBe(1234.56);
      expect(result.error).toBe(null);
      expect(result.mathSign).toBe(1);
      expect(result.isPositive).toBe(true);
      expect(result.isInteger).toBe(false);
      expect(result.isZero).toBe(false);
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
      expect(result.mathSign).toBe(-1);
      expect(result.isNegative).toBe(true);
      expect(result.isInteger).toBe(false);
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

  describe('万分比解析', () => {
    it('应该解析万分比格式', () => {
      const parser = new NumberParser({ style: 'per-myriad' });
      const result = parser.parse('123.4‱');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.01234);
    });

    it('应该在严格模式下要求万分符', () => {
      const parser = new NumberParser({ style: 'per-myriad', strict: true });
      const result = parser.parse('123.4');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Per-myriad symbol');
    });
  });

  describe('百分点解析', () => {
    it('应该解析百分点格式', () => {
      const parser = new NumberParser({ style: 'percentage-point' });
      const result = parser.parse('12.3pp');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0.123);
    });

    it('应该在严格模式下要求 pp 后缀', () => {
      const parser = new NumberParser({ style: 'percentage-point', strict: true });
      const result = parser.parse('12.3');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Percentage point suffix');
    });
  });

  describe('中文大写数字解析', () => {
    it('应该解析中文大写数字字符串', () => {
      const parser = new NumberParser({ style: 'cn-upper' });
      const result = parser.parse('壹仟贰佰叁拾肆点伍陆');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(1234.56);
    });

    it('应该解析带负号的中文大写数字', () => {
      const parser = new NumberParser({ style: 'cn-upper' });
      const result = parser.parse('负叁拾贰');

      expect(result.success).toBe(true);
      expect(result.value).toBe(-32);
    });
  });

  describe('紧凑和科学记数解析', () => {
    it('应该解析紧凑表示法并处理中文单位', () => {
      const parser = new NumberParser({ notation: 'compact' });
      const result = parser.parse('12.5万');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(125000);
    });

    it('未知紧凑单位应该返回失败', () => {
      const parser = new NumberParser({ notation: 'compact' });
      const result = parser.parse('12.5X');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown compact unit');
    });

    it('应该解析科学记数法', () => {
      const parser = new NumberParser({ notation: 'scientific' });
      const result = parser.parse('1.23E4');

      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(12300);
    });

    it('非法科学记数格式应该返回错误', () => {
      const parser = new NumberParser({ notation: 'scientific' });
      const result = parser.parse('1.23E');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid scientific notation');
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

      const currentOptions = parser.getOptions();
      expect(currentOptions.style).toBe('currency');
      expect(currentOptions.currency).toBe('USD');
    });
  });
});

describe('插件异常处理与极端情况', () => {
  const throwingPrePlugin: FormatPlugin = {
    name: 'throwing-pre-parse-plugin',
    version: '1.0.0',
    description: '用于测试的 pre-parse 插件',
    priority: 10,
    phase: 'pre-parse',
    isApplicable: () => true,
    processParseInput: () => {
      throw new Error('pre-parse failure');
    },
  };

  const throwingPostPlugin: FormatPlugin = {
    name: 'throwing-post-parse-plugin',
    version: '1.0.0',
    description: '用于测试的 post-parse 插件',
    priority: 10,
    phase: 'post-parse',
    isApplicable: () => true,
    processParseResult: () => {
      throw new Error('post-parse failure');
    },
  };

  beforeEach(() => {
    clearRegisteredPlugins();
    resetPlugins([...defaultPlugins, throwingPrePlugin, throwingPostPlugin]);
  });

  afterEach(() => {
    clearRegisteredPlugins();
    resetPlugins(defaultPlugins);
  });

  it('预处理插件抛出异常时应该忽略并继续解析', () => {
    const parser = new NumberParser();
    const result = parser.parse('1234');

    expect(result.success).toBe(true);
    expect(result.value).toBe(1234);
  });

  it('后处理插件抛出异常时应该返回原始结果', () => {
    const parser = new NumberParser();
    const result = parser.parse('5678');

    expect(result.success).toBe(true);
    expect(result.value).toBe(5678);
  });

  it('解析超大数字时应该提示结果非有限', () => {
    const hugeNumber = '9'.repeat(400);
    const parser = new NumberParser();
    const result = parser.parse(hugeNumber);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Parsed value is not finite');
  });

  it('紧凑格式结果溢出时应该提示错误', () => {
    const hugeCompact = `${'9'.repeat(400)}K`;
    const parser = new NumberParser({ notation: 'compact' });
    const result = parser.parse(hugeCompact);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Resulting value is not finite');
  });

  it('科学记数法指数无效时应该提示错误', () => {
    const parser = new NumberParser({ notation: 'scientific' });
    const result = parser.parse('1.2E');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid scientific notation format');
  });

  it('科学记数法结果溢出时应该提示错误', () => {
    const parser = new NumberParser({ notation: 'scientific' });
    const result = parser.parse('9.9E309');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Resulting number is not finite');
  });

  it('内部符号与分隔符辅助方法应该可靠返回', () => {
    const parser = new NumberParser({ style: 'currency', currency: 'USD' }) as any;

    // 正常路径
    expect(parser.getCurrencySymbol()).toBe('$');
    expect(parser.getGroupSeparator('en-US')).toBe(',');
    expect(parser.getDecimalSeparator('en-US')).toBe('.');

    // 强制触发兜底逻辑
    parser.formatter = { formatToParts: () => { throw new Error('fail'); } };
    expect(parser.getCurrencySymbol()).toBe('$');

    const originalNumberFormat = Intl.NumberFormat;
    try {
      // 模拟 Intl.NumberFormat 抛出异常
      (Intl as any).NumberFormat = class {
        constructor() {
          throw new Error('Intl failure');
        }
      };
      expect(parser.getGroupSeparator('en-US')).toBe(',');
      expect(parser.getDecimalSeparator('en-US')).toBe('.');
    } finally {
      (Intl as any).NumberFormat = originalNumberFormat;
    }
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
    const zeroResult = parser.parse('0');
    expect(zeroResult.isZero).toBe(true);
    expect(zeroResult.mathSign).toBe(0);
    const negativeZero = parser.parse('-0');
    expect(negativeZero.isNegativeZero).toBe(true);
    expect(Object.is(negativeZero.value, -0)).toBe(true);
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
