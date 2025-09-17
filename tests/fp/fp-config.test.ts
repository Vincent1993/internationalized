/**
 * @file FP 配置管理功能测试
 * @description 统一测试配置相关功能，包括 config()、defaults 等
 */

import {
  configTestHelpers,
  testHelpers,
  formatters,
} from './test-utils';

describe('FP 配置管理功能', () => {
  beforeEach(() => {
    configTestHelpers.resetConfigs();
  });

  afterEach(() => {
    configTestHelpers.resetConfigs();
  });

  describe('config() 统一接口', () => {
    describe('基础操作', () => {
      it('无参数调用应该返回当前配置', () => {
        const configs = configTestHelpers.getCurrentConfigs();
        configTestHelpers.expectDefaultStructure(configs);

        // 验证默认精度设置
        expect(configs.percent.maximumFractionDigits).toBe(2);
        expect(configs.perMille.maximumFractionDigits).toBe(2);
        expect(configs.compact.maximumFractionDigits).toBe(1);
        expect(configs.scientific.maximumFractionDigits).toBe(3);
      });

      it('有参数调用应该更新配置并返回新配置', () => {
        const newConfigs = configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 1 },
          perMille: { maximumFractionDigits: 3 },
        });

        expect(newConfigs.percent.maximumFractionDigits).toBe(1);
        expect(newConfigs.perMille.maximumFractionDigits).toBe(3);

        // 验证配置已持久化
        configTestHelpers.expectConfigUpdate('percent', 'maximumFractionDigits', 1);
        configTestHelpers.expectConfigUpdate('perMille', 'maximumFractionDigits', 3);
      });

      it('应该支持渐进式配置更新', () => {
        // 第一次更新
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 1 }
        });

        // 第二次更新，不应该覆盖之前的设置
        configTestHelpers.updateConfigs({
          perMille: { maximumFractionDigits: 0 }
        });

        configTestHelpers.expectConfigUpdate('percent', 'maximumFractionDigits', 1);
        configTestHelpers.expectConfigUpdate('perMille', 'maximumFractionDigits', 0);
      });
    });

    describe('配置数据完整性', () => {
      it('返回的配置对象应该是深拷贝', () => {
        const configs1 = configTestHelpers.getCurrentConfigs();
        const configs2 = configTestHelpers.getCurrentConfigs();

        expect(configs1).not.toBe(configs2); // 不是同一个引用
        expect(configs1).toEqual(configs2); // 但内容相同

        // 修改其中一个不应该影响另一个
        configs1.percent.maximumFractionDigits = 99;
        expect(configs2.percent.maximumFractionDigits).toBe(2);
      });

      it('应该处理空配置对象', () => {
        const originalConfigs = configTestHelpers.getCurrentConfigs();
        configTestHelpers.updateConfigs({});
        const newConfigs = configTestHelpers.getCurrentConfigs();
        expect(newConfigs).toEqual(originalConfigs);
      });

      it('应该忽略无效的配置类型', () => {
        const originalConfigs = configTestHelpers.getCurrentConfigs();

        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 1 },
          invalidType: { someOption: true } as any,
        });

        configTestHelpers.expectConfigUpdate('percent', 'maximumFractionDigits', 1);
        // 其他配置应该保持不变
        const newConfigs = configTestHelpers.getCurrentConfigs();
        expect(newConfigs.decimal).toEqual(originalConfigs.decimal);
        expect(newConfigs.currency).toEqual(originalConfigs.currency);
      });
    });

    describe('复杂配置场景', () => {
      it('应该支持部分属性更新', () => {
        // 先设置一个复杂配置
        configTestHelpers.updateConfigs({
          currency: {
            minimumFractionDigits: 1,
            maximumFractionDigits: 3,
            useGrouping: false,
          }
        });

        // 只更新其中一个属性
        configTestHelpers.updateConfigs({
          currency: {
            maximumFractionDigits: 1
          }
        });

        const configs = configTestHelpers.getCurrentConfigs();
        expect(configs.currency.minimumFractionDigits).toBe(1); // 保持不变
        expect(configs.currency.maximumFractionDigits).toBe(1); // 已更新
        expect(configs.currency.useGrouping).toBe(false); // 保持不变
      });

      it('应该处理复杂的嵌套配置', () => {
        configTestHelpers.updateConfigs({
          currency: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
            useGrouping: true,
            currencyDisplay: 'code',
          },
          compact: {
            notation: 'compact', // 这应该被强制选项覆盖
            maximumFractionDigits: 0,
            compactDisplay: 'short',
          }
        });

        const configs = configTestHelpers.getCurrentConfigs();
        expect(configs.currency.minimumFractionDigits).toBe(0);
        expect(configs.currency.maximumFractionDigits).toBe(4);
        expect(configs.currency.useGrouping).toBe(true);
        expect(configs.currency.currencyDisplay).toBe('code');

        expect(configs.compact.maximumFractionDigits).toBe(0);
        expect(configs.compact.compactDisplay).toBe('short');
      });
    });
  });

  describe('默认配置影响', () => {
    describe('格式化函数集成', () => {
      it('百分比精度配置应该生效', () => {
        // 测试默认2位小数
        expect(formatters.percent(0.123456)).toBe('12.35%');

        // 修改为1位小数
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 1 }
        });
        expect(formatters.percent(0.123456)).toBe('12.3%');

        // 修改为0位小数
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 0 }
        });
        expect(formatters.percent(0.123456)).toBe('12%');
      });

      it('千分比精度配置应该生效', () => {
        // 测试默认2位小数
        expect(formatters.perMille(0.012345)).toBe('12.35‰');

        // 修改为3位小数
        configTestHelpers.updateConfigs({
          perMille: { maximumFractionDigits: 3 }
        });
        expect(formatters.perMille(0.012345)).toBe('12.345‰');
      });

      it('科学记数法精度配置应该生效', () => {
        // 测试默认3位小数
        expect(formatters.scientific(1234567)).toMatch(/1\.235E[+]?6/);

        // 修改为1位小数
        configTestHelpers.updateConfigs({
          scientific: { maximumFractionDigits: 1 }
        });
        expect(formatters.scientific(1234567)).toMatch(/1\.2E[+]?6/);
      });

      it('用户传递的选项应该能覆盖全局配置', () => {
        // 设置全局配置
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 0 }
        });

        // 全局配置生效
        expect(formatters.percent(0.123456)).toBe('12%');

        // 用户选项覆盖全局配置
        expect(formatters.percent(0.123456, { maximumFractionDigits: 2 })).toBe('12.35%');
      });
    });

    describe('多类型同时配置', () => {
      it('应该支持同时配置多个格式化类型', () => {
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 1 },
          perMille: { maximumFractionDigits: 3 },
          compact: { maximumFractionDigits: 2 },
        });

        expect(formatters.percent(0.123456)).toBe('12.3%');
        expect(formatters.perMille(0.012345)).toBe('12.345‰');

        const compactResult = formatters.compact(1234.567);
        expect(typeof compactResult).toBe('string');
        expect(compactResult.length).toBeGreaterThan(0);
      });

      it('配置修改应该立即生效', () => {
        // 修改前
        const result1 = formatters.percent(0.123456);
        expect(result1).toBe('12.35%');

        // 修改全局配置
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 0 }
        });

        // 修改后立即生效
        const result2 = formatters.percent(0.123456);
        expect(result2).toBe('12%');
      });
    });

    describe('强制覆盖优先级', () => {
      it('强制属性不应该被默认配置覆盖', () => {
        // 尝试在默认配置中设置错误的 style
        configTestHelpers.updateConfigs({
          percent: {
            style: 'decimal' as any,  // 这将被强制覆盖
            maximumFractionDigits: 1
          }
        });

        const result = formatters.percent(0.12345);
        // 仍然应该输出百分比格式，不受默认配置中错误 style 的影响
        expect(result).toContain('%');
        expect(result).toBe('12.3%'); // 但精度配置应该生效
      });
    });
  });

  describe('配置重置功能', () => {
    it('resetDefaultConfigs应该重置所有配置', () => {
      // 修改配置
      configTestHelpers.updateConfigs({
        percent: { maximumFractionDigits: 5 },
        currency: { minimumFractionDigits: 0 },
        compact: { maximumFractionDigits: 3 },
      });

      // 验证配置已修改
      configTestHelpers.expectConfigUpdate('percent', 'maximumFractionDigits', 5);
      configTestHelpers.expectConfigUpdate('currency', 'minimumFractionDigits', 0);
      configTestHelpers.expectConfigUpdate('compact', 'maximumFractionDigits', 3);

      // 重置配置
      configTestHelpers.resetConfigs();

      // 验证配置已重置
      configTestHelpers.expectConfigUpdate('percent', 'maximumFractionDigits', 2);
      configTestHelpers.expectConfigUpdate('currency', 'minimumFractionDigits', 2);
      configTestHelpers.expectConfigUpdate('compact', 'maximumFractionDigits', 1);
    });
  });

  describe('配置验证和错误处理', () => {
    describe('边界情况处理', () => {
      it('应该处理 undefined 和 null 配置值', () => {
        testHelpers.expectNoThrow(() => {
          configTestHelpers.updateConfigs({ percent: undefined as any });
        }, 'undefined config');

        testHelpers.expectNoThrow(() => {
          configTestHelpers.updateConfigs({ percent: null as any });
        }, 'null config');
      });

      it('应该处理空配置对象', () => {
        testHelpers.expectNoThrow(() => {
          configTestHelpers.updateConfigs({ percent: {} });
        }, 'empty config object');

        // 原有配置应该保持
        const configs = configTestHelpers.getCurrentConfigs();
        expect(configs.percent.style).toBe('percent');
      });
    });

    describe('类型安全验证', () => {
      it('应该提供正确的TypeScript类型提示', () => {
        // 这主要是编译时测试，运行时验证基本功能
        const configs = configTestHelpers.updateConfigs({
          percent: {
            maximumFractionDigits: 1,
            // style: 'percent' // 应该被强制覆盖
          },
          currency: {
            minimumFractionDigits: 0,
            // currency: 'USD' // 这个会被函数参数覆盖
          }
        });

        expect(configs.percent.maximumFractionDigits).toBe(1);
        expect(configs.currency.minimumFractionDigits).toBe(0);
      });
    });
  });

  describe('实际应用场景', () => {
    describe('主题切换', () => {
      it('应该支持精简主题配置', () => {
        const setMinimalTheme = () => {
          configTestHelpers.updateConfigs({
            percent: { maximumFractionDigits: 0 },
            perMille: { maximumFractionDigits: 0 },
            compact: { maximumFractionDigits: 0 },
            scientific: { maximumFractionDigits: 1 }
          });
        };

        setMinimalTheme();

        expect(formatters.percent(0.123456)).toBe('12%');
        expect(formatters.perMille(0.012345)).toBe('12‰');
        expect(formatters.scientific(1234567)).toMatch(/1\.2E[+]?6/);
      });

      it('应该支持详细主题配置', () => {
        const setDetailedTheme = () => {
          configTestHelpers.updateConfigs({
            percent: { maximumFractionDigits: 3 },
            perMille: { maximumFractionDigits: 4 },
            compact: { maximumFractionDigits: 2 },
            scientific: { maximumFractionDigits: 5 }
          });
        };

        setDetailedTheme();

        expect(formatters.percent(0.123456)).toBe('12.346%');
        // 调试千分比格式化
        const perMilleResult = formatters.perMille(0.012345);
        console.log('perMille result:', perMilleResult);
        expect(perMilleResult).toBe('12.3450‰');
        expect(formatters.scientific(1234567)).toMatch(/1\.23457E[+]?6/);
      });
    });

    describe('地区化配置', () => {
      it('应该支持地区化精度配置', () => {
        // 模拟中国地区配置
        configTestHelpers.updateConfigs({
          decimal: { locale: 'zh-CN' },
          currency: { locale: 'zh-CN', currency: 'CNY' },
          percent: { locale: 'zh-CN', maximumFractionDigits: 1 },
          compact: { locale: 'zh-CN', maximumFractionDigits: 1 },
        });

        // 验证配置生效（主要验证配置能正确保存）
        const configs = configTestHelpers.getCurrentConfigs();
        expect(configs.decimal.locale).toBe('zh-CN');
        expect(configs.currency.locale).toBe('zh-CN');
        expect(configs.currency.currency).toBe('CNY');
        expect(configs.percent.locale).toBe('zh-CN');
        expect(configs.percent.maximumFractionDigits).toBe(1);
      });
    });

    describe('配置备份与恢复', () => {
      it('应该支持配置的备份和恢复', () => {
        // 备份当前配置
        const backupConfig = configTestHelpers.getCurrentConfigs();

        // 应用临时配置
        configTestHelpers.updateConfigs({
          percent: { maximumFractionDigits: 0 },
          compact: { maximumFractionDigits: 0 }
        });

        // 验证临时配置生效
        expect(formatters.percent(0.123456)).toBe('12%');

        // 恢复配置
        configTestHelpers.updateConfigs(backupConfig);

        // 验证配置已恢复
        expect(formatters.percent(0.123456)).toBe('12.35%');
      });
    });
  });
});
