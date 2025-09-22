/**
 * @file 运行时校验插件 (validator) 测试
 * @description 验证 validator 插件在不同环境和配置下的行为。
 */

import { validatorPlugin } from '../../src/plugins/validator';

// 保存原始的 process.env.NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

describe('插件: Validator', () => {
  const processOptions = validatorPlugin.processOptions!;

  describe('开发环境 (development)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('当 minimumFractionDigits > maximumFractionDigits 时应抛出错误', () => {
      const invalidOptions = { minimumFractionDigits: 5, maximumFractionDigits: 2 };
      expect(() => processOptions(invalidOptions)).toThrow(
        /'minimumFractionDigits' \(5\) 不能大于 'maximumFractionDigits' \(2\)/,
      );
    });

    it('当 minimumSignificantDigits > maximumSignificantDigits 时应抛出错误', () => {
      const invalidOptions = { minimumSignificantDigits: 5, maximumSignificantDigits: 4 };
      expect(() => processOptions(invalidOptions)).toThrow(
        /'minimumSignificantDigits' \(5\) 不能大于 'maximumSignificantDigits' \(4\)/,
      );
    });

    it('当 significantDigits 和 fractionDigits 同时存在时应抛出错误', () => {
      const invalidOptions = { maximumSignificantDigits: 3, maximumFractionDigits: 2 };
      expect(() => processOptions(invalidOptions)).toThrow(
        /'maximumSignificantDigits' 和 'maximumFractionDigits' 等小数位配置不能同时使用/,
      );
    });

    it('对于有效的配置不应抛出任何错误', () => {
      const validOptions = { minimumFractionDigits: 2, maximumFractionDigits: 5 };
      expect(() => processOptions(validOptions)).not.toThrow();
    });
  });

  describe('生产环境 (production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('应静默修复 minimumFractionDigits > maximumFractionDigits', () => {
      const invalidOptions = { minimumFractionDigits: 5, maximumFractionDigits: 2 };
      const fixedOptions = processOptions(invalidOptions);
      expect(fixedOptions.maximumFractionDigits).toBe(5);
    });

    it('应静默修复 minimumSignificantDigits > maximumSignificantDigits', () => {
      const invalidOptions = { minimumSignificantDigits: 6, maximumSignificantDigits: 4 };
      const fixedOptions = processOptions(invalidOptions);
      expect(fixedOptions.maximumSignificantDigits).toBe(6);
    });

    it('应静默修复 significantDigits 和 fractionDigits 的冲突', () => {
      const invalidOptions = { maximumSignificantDigits: 3, maximumFractionDigits: 2, style: 'decimal' };
      const fixedOptions = processOptions(invalidOptions);
      expect(fixedOptions).not.toHaveProperty('maximumFractionDigits');
      expect(fixedOptions).not.toHaveProperty('minimumFractionDigits');
      expect(fixedOptions.maximumSignificantDigits).toBe(3);
    });

    it('对于有效的配置，应返回原始对象', () => {
      const validOptions = { style: 'currency', currency: 'USD' };
      const result = processOptions(validOptions);
      expect(result).toEqual(validOptions);
    });
  });
});
