import type { MetricFormatRule } from '../../src/core/types';
import type { NumberFormatProps } from '../../src/components/NumberFormat';
import type { AutoMetricNumberProps } from '../../src/components/AutoMetricNumber';

describe('类型验证测试', () => {
  describe('MetricFormatRule 类型支持', () => {
    it('应该支持字符串正则模式', () => {
      const rule: MetricFormatRule = {
        pattern: '.*_rate$',
        options: { style: 'percent', maximumFractionDigits: 2 },
      };

      expect(rule.pattern).toBe('.*_rate$');
      expect(typeof rule.pattern).toBe('string');
    });

    it('应该支持 RegExp 对象模式', () => {
      const rule: MetricFormatRule = {
        pattern: /price|cost/i,
        options: { style: 'currency', currency: 'USD' },
      };

      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.pattern.test('product_price')).toBe(true);
      expect(rule.pattern.test('shipping_cost')).toBe(true);
      expect(rule.pattern.test('total_amount')).toBe(false);
    });

    it('应该支持精确名称匹配', () => {
      const rule: MetricFormatRule = {
        name: 'revenue',
        options: { style: 'currency', currency: 'CNY' },
      };

      expect(rule.name).toBe('revenue');
      expect(rule.options.style).toBe('currency');
      expect(rule.options.currency).toBe('CNY');
    });

    it('应该确保 name 和 pattern 类型互斥', () => {
      // ✅ 正确：只使用 name
      const nameRule: MetricFormatRule = {
        name: 'revenue',
        options: { style: 'currency', currency: 'USD' },
      };

      // ✅ 正确：只使用 pattern（字符串）
      const stringPatternRule: MetricFormatRule = {
        pattern: '.*_rate$',
        options: { style: 'percent' },
      };

      // ✅ 正确：只使用 pattern（RegExp）
      const regexPatternRule: MetricFormatRule = {
        pattern: /.*_count$/i,
        options: { style: 'decimal' },
      };

      expect(nameRule.name).toBe('revenue');
      expect(stringPatternRule.pattern).toBe('.*_rate$');
      expect(regexPatternRule.pattern).toBeInstanceOf(RegExp);

      // @ts-expect-error - 应该在 TypeScript 编译时产生错误
      const invalidRule: MetricFormatRule = {
        name: 'revenue',
        pattern: '.*revenue.*',
        options: { style: 'currency' },
      };
    });

    it('应该支持复杂的配置组合', () => {
      const rule: MetricFormatRule = {
        pattern: /.*_(count|total)$/i,
        options: {
          style: 'decimal',
          useGrouping: true,
          maximumFractionDigits: 0,
          minimumIntegerDigits: 1,
        },
      };

      expect(rule.pattern).toBeInstanceOf(RegExp);
      expect(rule.options.style).toBe('decimal');
      expect(rule.options.useGrouping).toBe(true);
    });

    it('应该支持插件扩展样式', () => {
      const rule: MetricFormatRule = {
        pattern: /.*_permille$/,
        options: { style: 'per-mille' as any },
      };

      expect(rule.options.style).toBe('per-mille');
    });

    it('应该构建有效的规则数组', () => {
      const rules: MetricFormatRule[] = [
        {
          name: 'revenue',
          options: { style: 'currency', currency: 'CNY' },
        },
        {
          pattern: '.*_rate$',
          options: { style: 'percent', maximumFractionDigits: 2 },
        },
        {
          pattern: /count|total/i,
          options: { style: 'decimal', useGrouping: true },
        },
      ];

      expect(rules).toHaveLength(3);
      expect(rules[0].name).toBe('revenue');
      expect(rules[1].pattern).toBe('.*_rate$');
      expect(rules[2].pattern).toBeInstanceOf(RegExp);
    });
  });

  describe('多态组件类型验证', () => {
    it('NumberFormat 应该支持正确的元素类型推导', () => {
      // 默认 span 类型
      const spanProps: NumberFormatProps = {
        value: 123,
        className: 'text-red-500',
        onClick: () => {},
      };

      // div 类型
      const divProps: NumberFormatProps<'div'> = {
        value: 123,
        as: 'div',
        className: 'container',
        style: { display: 'block' },
      };

      // button 类型
      const buttonProps: NumberFormatProps<'button'> = {
        value: 123,
        as: 'button',
        type: 'button',
        disabled: true,
        onClick: () => {},
      };

      // input 类型（这应该会有 TypeScript 错误，因为 input 需要特殊处理）
      const inputProps: NumberFormatProps<'input'> = {
        value: 123,
        as: 'input',
        type: 'text',
        placeholder: 'Enter number',
      };

      expect(spanProps.value).toBe(123);
      expect(divProps.as).toBe('div');
      expect(buttonProps.as).toBe('button');
      expect(inputProps.as).toBe('input');
    });

    it('AutoMetricNumber 应该支持正确的元素类型推导', () => {
      // 默认 span 类型
      const spanProps: AutoMetricNumberProps = {
        value: 123,
        name: 'test-metric',
        className: 'text-green-500',
      };

      // div 类型
      const divProps: AutoMetricNumberProps<'div'> = {
        value: 123,
        name: 'test-metric',
        as: 'div',
        className: 'metric-container',
      };

      // 自定义元素类型
      const customProps: AutoMetricNumberProps<'article'> = {
        value: 123,
        name: 'test-metric',
        as: 'article',
        role: 'presentation',
      };

      expect(spanProps.name).toBe('test-metric');
      expect(divProps.as).toBe('div');
      expect(customProps.as).toBe('article');
    });

    it('应该支持函数式 children 的类型推导', () => {
      const functionChildrenProps: NumberFormatProps = {
        value: 123.45,
        children: (result) => {
          // result 应该有正确的类型推导
          expect(typeof result.formattedValue).toBe('string');
          expect(typeof result.isNaN).toBe('boolean');
          expect(typeof result.sign.isPositive).toBe('boolean');
          expect(typeof result.resolvedOptions).toBe('object');
          return result.formattedValue;
        },
      };

      expect(typeof functionChildrenProps.children).toBe('function');
    });

    it('应该支持 asChild 模式的类型安全', () => {
      const asChildProps: NumberFormatProps = {
        value: 123,
        asChild: true,
        // 使用 asChild 时，其他 DOM 属性仍然应该可用
        className: 'injected-class',
        'data-testid': 'injected-content',
      };

      expect(asChildProps.asChild).toBe(true);
      expect(asChildProps.className).toBe('injected-class');
    });
  });
});
