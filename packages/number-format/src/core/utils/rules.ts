import type { MetricFormatRule } from '../types';

type NamedRule = Extract<MetricFormatRule, { name: string }>;
type PatternRule = Extract<MetricFormatRule, { pattern: string | RegExp }>;

type RuleWithNameAndPattern = NamedRule & PatternRule;

function hasName(rule: MetricFormatRule): rule is NamedRule | RuleWithNameAndPattern {
  return 'name' in rule && typeof rule.name === 'string' && rule.name.length > 0;
}

function hasPattern(rule: MetricFormatRule): rule is PatternRule | RuleWithNameAndPattern {
  return 'pattern' in rule && rule.pattern !== undefined;
}

function stripPattern(rule: RuleWithNameAndPattern): NamedRule {
  const { name, options } = rule;
  return { name, options };
}

/**
 * 验证和规范化规则，确保 name 和 pattern 互斥
 */
function normalizeRule(rule: MetricFormatRule): MetricFormatRule {
  if (hasName(rule) && hasPattern(rule)) {
    console.warn(
      `MetricFormatRule: name 和 pattern 不应同时存在。优先使用 name="${rule.name}"，忽略 pattern。`,
      { rule },
    );
    return stripPattern(rule);
  }

  return rule;
}

function getRuleKey(rule: MetricFormatRule): string {
  const normalizedRule = normalizeRule(rule);
  if (hasName(normalizedRule)) {
    return `name:${normalizedRule.name}`;
  }
  if (hasPattern(normalizedRule)) {
    const { pattern } = normalizedRule;
    if (pattern instanceof RegExp) {
      return `pattern:${pattern.source}:${pattern.flags}`;
    }
    return `pattern:${pattern}`;
  }
  return `content:${JSON.stringify(normalizedRule)}`;
}

function mergeRuleOptions(
  existing: MetricFormatRule,
  incoming: MetricFormatRule,
): MetricFormatRule {
  if (hasName(existing) && hasName(incoming)) {
    return {
      name: existing.name,
      options: {
        ...existing.options,
        ...incoming.options,
      },
    };
  }

  if (hasPattern(existing) && hasPattern(incoming)) {
    return {
      pattern: existing.pattern,
      options: {
        ...existing.options,
        ...incoming.options,
      },
    };
  }

  return incoming;
}

export function mergeRules(
  left: MetricFormatRule[],
  right: MetricFormatRule[],
): MetricFormatRule[] {
  const ruleMap = new Map<string, MetricFormatRule>();
  const insertOrder: string[] = [];

  for (const rule of left ?? []) {
    const normalizedRule = normalizeRule(rule);
    const key = getRuleKey(normalizedRule);
    ruleMap.set(key, normalizedRule);
    insertOrder.push(key);
  }

  for (const rule of right ?? []) {
    const normalizedRule = normalizeRule(rule);
    const key = getRuleKey(normalizedRule);
    const existing = ruleMap.get(key);

    if (existing) {
      ruleMap.set(key, mergeRuleOptions(existing, normalizedRule));
    } else {
      ruleMap.set(key, normalizedRule);
      insertOrder.push(key);
    }
  }

  return insertOrder.map((key) => {
    const normalizedRule = ruleMap.get(key);
    if (!normalizedRule) {
      throw new Error(`Missing rule for key: ${key}`);
    }
    return normalizedRule;
  });
}
