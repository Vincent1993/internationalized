/**
 * @file FP 模块核心功能测试
 * @description 按功能分类测试，减少重复代码
 */

import {
  formatters,
  boundaryValues,
  validNumbers,
  invalidInputs,
  currencyTestData,
  testOptions,
  testHelpers,
  performanceTestHelpers,
  integrationTestHelpers,
} from './test-utils';

describe('FP 格式化器 - 核心功能', () => {
  describe('基础格式化功能', () => {
    describe('有效数值格式化', () => {
      validNumbers.forEach(({ value, description }) => {
        it(`应该正确格式化${description}: ${value}`, () => {
          testHelpers.expectStringResult(() => formatters.decimal(value), description);
          testHelpers.expectStringResult(() => formatters.integer(value), description);
          testHelpers.expectStringResult(() => formatters.percent(value), description);
          testHelpers.expectStringResult(() => formatters.perMille(value), description);
          testHelpers.expectStringResult(() => formatters.compact(value), description);
          testHelpers.expectStringResult(() => formatters.scientific(value), description);

          // 货币格式化需要额外的currency参数
          testHelpers.expectStringResult(() => formatters.currency(value, 'USD'), description);
        });
      });
    });

    describe('无效输入处理', () => {
      invalidInputs.forEach(({ value, expected, description }) => {
        it(`应该正确处理${description}: ${value}`, () => {
          // 大多数格式化函数对无效输入返回 'N/A'
          const decimalResult = formatters.decimal(value);
          const integerResult = formatters.integer(value);
          const compactResult = formatters.compact(value);
          const scientificResult = formatters.scientific(value);

          expect(decimalResult).toContain('N/A');
          expect(integerResult).toContain('N/A');
          expect(compactResult).toContain('N/A');
          expect(scientificResult).toContain('N/A');

          // 百分比和千分比有特殊的错误格式
          const percentResult = formatters.percent(value);
          const perMilleResult = formatters.perMille(value);
          expect(percentResult).toContain('--');
          expect(perMilleResult).toContain('--');

          // 货币格式化也有特殊的错误格式
          const currencyResult = formatters.currency(value, 'USD');
          expect(currencyResult).toContain('--');
        });
      });
    });

    describe('边界值处理', () => {
      it('所有格式化函数应该优雅处理边界值', () => {
        boundaryValues.forEach(value => {
          testHelpers.expectNoThrow(() => formatters.decimal(value), `decimal with ${value}`);
          testHelpers.expectNoThrow(() => formatters.integer(value), `integer with ${value}`);
          testHelpers.expectNoThrow(() => formatters.percent(value), `percent with ${value}`);
          testHelpers.expectNoThrow(() => formatters.perMille(value), `perMille with ${value}`);
          testHelpers.expectNoThrow(() => formatters.compact(value), `compact with ${value}`);
          testHelpers.expectNoThrow(() => formatters.scientific(value), `scientific with ${value}`);
          testHelpers.expectNoThrow(() => formatters.currency(value, 'USD'), `currency with ${value}`);
        });
      });
    });
  });

  describe('选项处理和覆盖', () => {
    describe('选项合并', () => {
      it('应该正确处理精度选项', () => {
        const value = 1234.56789;

        // 测试不同精度
        expect(formatters.decimal(value, testOptions.precision1)).toContain('1,234.6');
        expect(formatters.decimal(value, testOptions.precision2)).toContain('1,234.57');
        expect(formatters.percent(value / 100, testOptions.precision1)).toContain('1,234.6%');
        expect(formatters.perMille(value / 100000, testOptions.precision1)).toContain('12.3‰');
      });

      it('应该正确处理分组选项', () => {
        const value = 1234567;

        const withGrouping = formatters.decimal(value);
        const withoutGrouping = formatters.decimal(value, testOptions.noGrouping);

        expect(withGrouping).toContain(',');
        expect(withoutGrouping).not.toContain(',');
      });

      it('应该正确处理地区选项', () => {
        const value = 1234.56;

        const usFormat = formatters.decimal(value, testOptions.usLocale);
        const germanFormat = formatters.decimal(value, testOptions.germanLocale);

        expect(usFormat).toContain('1,234.56');
        expect(germanFormat).toContain('1.234,56');
      });
    });

    describe('强制覆盖行为', () => {
      it('应该强制覆盖 style 属性', () => {
        const conflictOptions = { style: 'currency' as any, currency: 'USD' as any };

        // decimal 应该强制使用 decimal style
        const decimalResult = formatters.decimal(1234, conflictOptions);
        expect(decimalResult).not.toContain('$');
        expect(decimalResult).toContain('1,234');

        // percent 应该强制使用 percent style
        const percentResult = formatters.percent(0.123, { style: 'decimal' as any });
        expect(percentResult).toContain('%');
      });

      it('应该强制覆盖 notation 属性', () => {
        const conflictOptions = { notation: 'scientific' as any };

        // compact 应该强制使用 compact notation
        const compactResult = formatters.compact(1234567, conflictOptions);
        expect(typeof compactResult).toBe('string');
        expect(compactResult.length).toBeGreaterThan(0);
      });

      it('应该强制覆盖 maximumFractionDigits（integer）', () => {
        const conflictOptions = { maximumFractionDigits: 5 as any };

        // integer 应该强制使用 0 位小数
        const integerResult = formatters.integer(123.456, conflictOptions);
        expect(integerResult).toBe('123');
      });
    });

    describe('选项不变性', () => {
      it('格式化函数不应该修改输入选项', () => {
        const options = { maximumFractionDigits: 2, useGrouping: true };

        testHelpers.expectOptionsImmutable((opts) => formatters.decimal(123, opts), options);
        testHelpers.expectOptionsImmutable((opts) => formatters.currency(123, 'USD', opts), options);
        testHelpers.expectOptionsImmutable((opts) => formatters.percent(0.123, opts), options);
      });
    });
  });

  describe('货币格式化特性', () => {
    describe('不同货币支持', () => {
      currencyTestData.forEach(({ currency, symbol, description }) => {
        it(`应该正确格式化${description} (${currency})`, () => {
          const result = formatters.currency(1234.56, currency);
          expect(result).toContain(symbol);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });
    });

    describe('货币参数优先级', () => {
      it('函数参数应该优先于选项中的货币设置', () => {
        const result = formatters.currency(123.45, 'JPY', { currency: 'USD' as any });
        expect(result).toContain('¥'); // 应该使用 JPY
        expect(result).not.toContain('$'); // 不应该使用选项中的 USD
      });
    });

    describe('无效货币处理', () => {
      it('应该优雅处理无效货币代码', () => {
        testHelpers.expectNoThrow(() => formatters.currency(100, 'INVALID'), 'invalid currency');
        const result = formatters.currency(100, 'INVALID');
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('函数式编程特性', () => {
    describe('纯函数特性', () => {
      it('相同输入应该产生相同输出', () => {
        const value = 1234.567;
        const options = { maximumFractionDigits: 2 };

        testHelpers.expectPureFunction(() => formatters.decimal(value, options));
        testHelpers.expectPureFunction(() => formatters.currency(value, 'USD', options));
        testHelpers.expectPureFunction(() => formatters.percent(value / 100, options));
      });
    });

    describe('函数组合', () => {
      it('应该支持函数组合', () => {
        const value = 1234.567;

        const formatPipeline = [
          (v: number) => formatters.decimal(v, { maximumFractionDigits: 2 }),
          (v: number) => formatters.integer(v),
          (v: number) => formatters.percent(v / 100),
          (v: number) => formatters.compact(v),
        ];

        formatPipeline.forEach(formatter => {
          const result = formatter(value);
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });
    });

    describe('柯里化风格使用', () => {
      it('应该支持部分应用', () => {
        // 创建专门的格式化函数
        const formatUSD = (value: unknown) => formatters.currency(value, 'USD');
        const formatEUR = (value: unknown) => formatters.currency(value, 'EUR');
        const formatWithDecimals = (value: unknown) =>
          formatters.percent(value, { maximumFractionDigits: 2 });

        expect(formatUSD(1234.56)).toContain('$');
        expect(formatEUR(1234.56)).toContain('€');
        expect(formatWithDecimals(0.1234)).toContain('12.34%');
      });
    });
  });

  describe('类型安全和约束', () => {
    describe('返回类型一致性', () => {
      it('所有格式化函数都应该返回字符串', () => {
        const testValue = 123.456;

        integrationTestHelpers.expectConsistentBehavior(({ name, formatter }) => {
          let result: string;
          if (name === 'currency') {
            result = formatter(testValue, 'USD');
          } else {
            result = formatter(testValue);
          }
          expect(typeof result).toBe('string');
        });
      });
    });

    describe('参数类型处理', () => {
      it('应该处理 BigInt 类型', () => {
        const bigIntValue = BigInt(123);

        testHelpers.expectStringResult(() => formatters.decimal(bigIntValue), 'BigInt decimal');
        testHelpers.expectStringResult(() => formatters.integer(bigIntValue), 'BigInt integer');
        testHelpers.expectStringResult(() => formatters.currency(bigIntValue, 'USD'), 'BigInt currency');
      });

      it('应该处理字符串数字', () => {
        const stringNumber = '1234.567';

        testHelpers.expectStringResult(() => formatters.decimal(stringNumber), 'string decimal');
        testHelpers.expectStringResult(() => formatters.percent(stringNumber), 'string percent');
      });
    });

    describe('特殊数值处理', () => {
      it('应该正确处理特殊数值', () => {
        // 测试 Infinity
        const infResult = formatters.scientific(Infinity);
        expect(infResult).toBe('∞');

        // 测试 -Infinity
        const negInfResult = formatters.scientific(-Infinity);
        expect(negInfResult).toBe('-∞');

        // 测试 NaN
        const nanResult = formatters.scientific(NaN);
        expect(nanResult).toBe('N/A');
      });

      it('应该处理零值的不同表示', () => {
        expect(formatters.decimal(0)).toBe('0');
        expect(formatters.decimal(-0)).toBe('-0');
        expect(formatters.decimal(+0)).toBe('0');
      });
    });
  });

  describe('性能特性', () => {
    describe('批量操作性能', () => {
      it('应该在批量操作中保持良好性能', () => {
        const testData = performanceTestHelpers.createLargeDataset(100);

        const operations = testData.map(value => () => ({
          decimal: formatters.decimal(value),
          integer: formatters.integer(value),
          currency: formatters.currency(value, 'USD'),
          percent: formatters.percent(value / 100),
          compact: formatters.compact(value),
        }));

        const duration = performanceTestHelpers.batchPerformanceTest(operations, 800);
        expect(duration).toBeLessThan(800);
      });
    });

    describe('极值处理性能', () => {
      it('应该高效处理极大和极小数字', () => {
        const extremeValues = [
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_VALUE,
          Number.MIN_VALUE,
        ];

        const operations = extremeValues.flatMap(value => [
          () => formatters.decimal(value),
          () => formatters.scientific(value),
          () => formatters.compact(value),
        ]);

        performanceTestHelpers.batchPerformanceTest(operations, 150);
      });
    });
  });
});
