import {
  formatAsDecimal,
  formatAsInteger,
  formatAsCurrency,
  formatAsPercent,
  formatAsPerMille,
  formatAsCompact,
  formatAsScientific,
  config,
  resetDefaultConfigs,
  clearCache,
} from '../../src/fp';

/**
 * 所有格式化函数的映射
 */
export const formatters = {
  decimal: formatAsDecimal,
  integer: formatAsInteger,
  currency: formatAsCurrency,
  percent: formatAsPercent,
  perMille: formatAsPerMille,
  compact: formatAsCompact,
  scientific: formatAsScientific,
} as const;

/**
 * 测试用的边界值数据
 */
export const boundaryValues = [
  0, -0,
  Infinity, -Infinity,
  Number.MAX_VALUE, Number.MIN_VALUE,
  Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER,
  null, undefined,
  NaN,
  '', '0', 'invalid',
  {}, [],
  true, false,
] as const;

/**
 * 有效的数值测试数据
 */
export const validNumbers = [
  { value: 1234.567, description: '正常小数' },
  { value: 0, description: '零' },
  { value: -1234.567, description: '负数' },
  { value: 123, description: '整数' },
  { value: 0.123, description: '小于1的小数' },
  { value: 1234567890, description: '大数字' },
] as const;

/**
 * 无效输入测试数据
 */
export const invalidInputs = [
  { value: null, expected: 'N/A', description: 'null值' },
  { value: undefined, expected: 'N/A', description: 'undefined' },
  { value: 'invalid', expected: 'N/A', description: '无效字符串' },
  { value: {}, expected: 'N/A', description: '空对象' },
  { value: [], expected: 'N/A', description: '空数组' },
] as const;

/**
 * 货币相关测试数据
 */
export const currencyTestData = [
  { currency: 'USD', symbol: '$', description: '美元' },
  { currency: 'EUR', symbol: '€', description: '欧元' },
  { currency: 'JPY', symbol: '¥', description: '日元' },
  { currency: 'CNY', symbol: '¥', description: '人民币' },
] as const;

/**
 * 测试选项组合
 */
export const testOptions = {
  precision1: { maximumFractionDigits: 1 },
  precision2: { maximumFractionDigits: 2 },
  precision3: { maximumFractionDigits: 3 },
  noGrouping: { useGrouping: false },
  germanLocale: { locale: 'de-DE' },
  usLocale: { locale: 'en-US' },
  chineseLocale: { locale: 'zh-CN' },
} as const;

/**
 * 通用测试辅助函数
 */
export const testHelpers = {
  /**
   * 测试函数是否返回字符串
   */
  expectStringResult: (fn: () => unknown, description: string) => {
    const result = fn();
    expect(typeof result).toBe('string');
    expect(result).toBeDefined();
  },

  /**
   * 测试函数是否不抛出错误
   */
  expectNoThrow: (fn: () => unknown, description: string) => {
    expect(fn).not.toThrow();
  },

  /**
   * 测试强制覆盖行为
   */
  expectForceOverride: <T>(
    formatter: (value: unknown, ...args: any[]) => string,
    value: unknown,
    args: any[],
    conflictOptions: Record<string, any>,
    expectedPattern: RegExp,
    notExpectedPattern?: RegExp
  ) => {
    const result = formatter(value, ...args, conflictOptions);
    expect(result).toMatch(expectedPattern);
    if (notExpectedPattern) {
      expect(result).not.toMatch(notExpectedPattern);
    }
  },

  /**
   * 测试格式化函数的纯函数特性
   */
  expectPureFunction: (fn: () => string, iterations = 3) => {
    const results = Array.from({ length: iterations }, () => fn());
    const firstResult = results[0];
    results.forEach(result => {
      expect(result).toBe(firstResult);
    });
  },

  /**
   * 测试选项对象不被修改
   */
  expectOptionsImmutable: (fn: (options: any) => unknown, options: any) => {
    const originalOptions = JSON.parse(JSON.stringify(options));
    fn(options);
    expect(options).toEqual(originalOptions);
  },

  /**
   * 测试缓存行为
   */
  expectCacheWorking: (createFormatter: () => any, iterations = 100) => {
    // 预热
    const warmupFormatter = createFormatter();

    // 测试缓存性能
    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
      createFormatter();
    }
    const cachedTime = performance.now() - start1;

    // 清除缓存
    clearCache();

    // 测试无缓存性能
    const start2 = performance.now();
    for (let i = 0; i < iterations; i++) {
      createFormatter();
    }
    const uncachedTime = performance.now() - start2;

    // 缓存至少不应该显著变慢（允许最多慢20%）
    expect(cachedTime).toBeLessThan(uncachedTime * 1.2);
  },
};



/**
 * 配置相关测试辅助函数
 */
export const configTestHelpers = {
  /**
   * 重置配置状态
   */
  resetConfigs: () => {
    resetDefaultConfigs();
  },

  /**
   * 获取当前配置
   */
  getCurrentConfigs: () => {
    return config();
  },

  /**
   * 更新配置
   */
  updateConfigs: (configs: any) => {
    return config(configs);
  },

  /**
   * 验证配置更新
   */
  expectConfigUpdate: (type: string, property: string, expectedValue: any) => {
    const configs = configTestHelpers.getCurrentConfigs();
    expect(configs[type][property]).toBe(expectedValue);
  },

  /**
   * 验证默认配置结构
   */
  expectDefaultStructure: (configs: any) => {
    const expectedTypes = ['decimal', 'integer', 'currency', 'percent', 'perMille', 'compact', 'scientific'];
    expectedTypes.forEach(type => {
      expect(configs).toHaveProperty(type);
      expect(typeof configs[type]).toBe('object');
    });
  },
};

/**
 * 性能测试辅助函数
 */
export const performanceTestHelpers = {
  /**
   * 批量性能测试
   */
  batchPerformanceTest: (operations: (() => unknown)[], maxTime = 1000) => {
    const start = performance.now();
    operations.forEach(op => op());
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(maxTime);
    return duration;
  },

  /**
   * 创建大量测试数据
   */
  createLargeDataset: (size = 1000) => {
    return Array.from({ length: size }, (_, i) => i * 1.23456);
  },
};

/**
 * 集成测试辅助函数
 */
export const integrationTestHelpers = {
  /**
   * 测试所有格式化函数的一致性
   */
  expectConsistentBehavior: (testFn: (formatter: any) => void) => {
    Object.entries(formatters).forEach(([name, formatter]) => {
      testFn({ name, formatter });
    });
  },

  /**
   * 测试与核心模块的集成
   */
  expectCoreIntegration: (fpResult: string, coreResult: string) => {
    expect(fpResult).toBe(coreResult);
  },
};
