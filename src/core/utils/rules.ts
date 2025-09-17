import type { MetricFormatRule } from '../types';

/**
 * 验证和规范化规则，确保 name 和 pattern 互斥
 */
function normalizeRule(rule: MetricFormatRule): MetricFormatRule {
  const ruleObj = rule as any;
  const hasName = ruleObj.name != null && ruleObj.name !== '';
  const hasPattern = ruleObj.pattern != null;

  if (hasName && hasPattern) {
    console.warn(
      `MetricFormatRule: name 和 pattern 不应同时存在。优先使用 name="${ruleObj.name}"，忽略 pattern。`,
      { rule: ruleObj },
    );
    // 返回只包含 name 的规则，移除 pattern
    const { pattern, ...rest } = ruleObj;
    return rest as MetricFormatRule;
  }

  return rule;
}

function getRuleKey(rule: MetricFormatRule): string {
  const normalizedRule = normalizeRule(rule);
  if ('name' in normalizedRule) {
    return `name:${normalizedRule.name}`;
  }
  if ('pattern' in normalizedRule) {
    const { pattern } = normalizedRule;
    if (pattern instanceof RegExp) {
      return `pattern:${pattern.source}:${pattern.flags}`;
    }
    return `pattern:${pattern}`;
  }
  return `content:${JSON.stringify(normalizedRule)}`;
}

export function mergeRules(
  left: MetricFormatRule[],
  right: MetricFormatRule[],
): MetricFormatRule[] {
  const ruleMap = new Map<string, MetricFormatRule>();
  const insertOrder: string[] = [];

  (left || []).forEach((rule) => {
    const normalizedRule = normalizeRule(rule);
    const key = getRuleKey(normalizedRule);
    ruleMap.set(key, normalizedRule);
    insertOrder.push(key);
  });

  (right || []).forEach((rule) => {
    const normalizedRule = normalizeRule(rule);
    const key = getRuleKey(normalizedRule);
    const existing = ruleMap.get(key);
    if (existing) {
      // @ts-ignore
      const mergedRule: MetricFormatRule = {
        ...existing,
        ...normalizedRule,
        options: {
          ...existing.options,
          ...normalizedRule.options,
        },
      };
      ruleMap.set(key, mergedRule);
    } else {
      ruleMap.set(key, normalizedRule);
      insertOrder.push(key);
    }
  });

  return insertOrder.map((key) => ruleMap.get(key)!);
}
