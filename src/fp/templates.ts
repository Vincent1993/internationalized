import { formatSpecifier, type FormatSpecifier } from 'd3-format';
import type { UseFormatOptions, UseFormatResult } from '../core/types';
import { throwIntlError } from '../utils/errors';
import { mergeOptionsWithDefaults, type FormatterDefaults } from './defaults';
import { getMemoizedFormatter } from './memoize';

interface TemplateDerivationContext {
  specifier: FormatSpecifier;
  template: string;
  token?: string;
}

export interface TemplateConfigEntry {
  targetType: keyof FormatterDefaults;
  defaults?: UseFormatOptions;
  forced?: UseFormatOptions;
  deriveOptions?: (context: TemplateDerivationContext) => UseFormatOptions;
  respectGrouping?: boolean;
  respectSign?: boolean;
}

export interface TemplateConfigState {
  specifiers: Record<string, TemplateConfigEntry>;
  tokens: Record<string, TemplateConfigEntry>;
  settings: {
    currency: string;
  };
}

function normalizeTokenKey(token: string): string {
  return token.trim().toLowerCase();
}

function cloneEntry(entry: TemplateConfigEntry | undefined): TemplateConfigEntry | undefined {
  if (!entry) {
    return undefined;
  }

  return {
    targetType: entry.targetType,
    defaults: entry.defaults ? { ...entry.defaults } : undefined,
    forced: entry.forced ? { ...entry.forced } : undefined,
    deriveOptions: entry.deriveOptions,
    respectGrouping: entry.respectGrouping,
    respectSign: entry.respectSign,
  };
}

function cloneEntryMap(source: Record<string, TemplateConfigEntry>): Record<string, TemplateConfigEntry> {
  const cloned: Record<string, TemplateConfigEntry> = {};
  for (const key of Object.keys(source)) {
    const entry = source[key];
    cloned[key] = cloneEntry(entry)!;
  }
  return cloned;
}

function resolvePrecision(
  specifier: FormatSpecifier,
  fallback?: number,
): number | undefined {
  if (typeof specifier.precision === 'number') {
    return specifier.precision;
  }
  if (typeof fallback === 'number') {
    return fallback;
  }
  return undefined;
}

function deriveFractionPrecision(
  specifier: FormatSpecifier,
  fallback?: number,
): UseFormatOptions {
  const precision = resolvePrecision(specifier, fallback);
  if (precision === undefined) {
    return {};
  }

  const safePrecision = Math.max(0, precision);
  if (specifier.trim) {
    return { maximumFractionDigits: safePrecision };
  }

  return { extend_fixDecimals: safePrecision };
}

function deriveSignificantPrecision(
  specifier: FormatSpecifier,
  fallback?: number,
  lockBothSides = false,
): UseFormatOptions {
  const precision = resolvePrecision(specifier, fallback);
  if (precision === undefined) {
    return {};
  }

  const safePrecision = Math.max(1, precision);
  const options: UseFormatOptions = {
    maximumSignificantDigits: safePrecision,
  };

  if (lockBothSides) {
    options.minimumSignificantDigits = safePrecision;
  }

  return options;
}

function makeDecimalEntry(): TemplateConfigEntry {
  return {
    targetType: 'decimal',
    forced: { style: 'decimal' },
    deriveOptions: ({ specifier }) => deriveFractionPrecision(specifier),
  };
}

function makeIntegerEntry(): TemplateConfigEntry {
  return {
    targetType: 'integer',
    defaults: { extend_fixDecimals: 0 },
    forced: { style: 'decimal' },
  };
}

function makePercentLikeEntry(target: keyof FormatterDefaults, style: UseFormatOptions['style']): TemplateConfigEntry {
  return {
    targetType: target,
    forced: { style },
    deriveOptions: ({ specifier }) => deriveFractionPrecision(specifier, 0),
  };
}

function makeCompactEntry(): TemplateConfigEntry {
  return {
    targetType: 'compact',
    forced: { style: 'decimal', notation: 'compact' },
    deriveOptions: ({ specifier }) => deriveSignificantPrecision(specifier, 3),
  };
}

function makeScientificEntry(): TemplateConfigEntry {
  return {
    targetType: 'scientific',
    forced: { style: 'decimal', notation: 'scientific' },
    deriveOptions: ({ specifier }) => deriveFractionPrecision(specifier, 6),
  };
}

function makeChineseUppercaseEntry(): TemplateConfigEntry {
  return {
    targetType: 'cnUpper',
    forced: { style: 'cn-upper' },
    respectGrouping: false,
  };
}

const DEFAULT_TEMPLATE_CONFIG: TemplateConfigState = {
  specifiers: {
    default: makeDecimalEntry(),
    '%': makePercentLikeEntry('percent', 'percent'),
    p: makePercentLikeEntry('percent', 'percent'),
    d: makeIntegerEntry(),
    i: makeIntegerEntry(),
    f: makeDecimalEntry(),
    g: {
      targetType: 'decimal',
      forced: { style: 'decimal' },
      deriveOptions: ({ specifier }) => deriveSignificantPrecision(specifier, 6),
    },
    r: {
      targetType: 'decimal',
      forced: { style: 'decimal' },
      deriveOptions: ({ specifier }) => deriveSignificantPrecision(specifier, 6, true),
    },
    s: makeCompactEntry(),
    e: makeScientificEntry(),
    n: {
      targetType: 'decimal',
      defaults: { useGrouping: true },
      forced: { style: 'decimal' },
      deriveOptions: ({ specifier }) => deriveFractionPrecision(specifier),
    },
  },
  tokens: {
    decimal: makeDecimalEntry(),
    integer: makeIntegerEntry(),
    currency: { targetType: 'currency', forced: { style: 'currency' } },
    percent: makePercentLikeEntry('percent', 'percent'),
    permille: makePercentLikeEntry('perMille', 'per-mille'),
    'per-mille': makePercentLikeEntry('perMille', 'per-mille'),
    '‰': makePercentLikeEntry('perMille', 'per-mille'),
    permyriad: makePercentLikeEntry('perMyriad', 'per-myriad'),
    'per-myriad': makePercentLikeEntry('perMyriad', 'per-myriad'),
    '‱': makePercentLikeEntry('perMyriad', 'per-myriad'),
    percentagepoint: makePercentLikeEntry('percentagePoint', 'percentage-point'),
    'percentage-point': makePercentLikeEntry('percentagePoint', 'percentage-point'),
    pp: makePercentLikeEntry('percentagePoint', 'percentage-point'),
    cnupper: makeChineseUppercaseEntry(),
    'cn-upper': makeChineseUppercaseEntry(),
  },
  settings: {
    currency: 'CNY',
  },
};

function cloneTemplateConfig(config: TemplateConfigState): TemplateConfigState {
  return {
    specifiers: cloneEntryMap(config.specifiers),
    tokens: cloneEntryMap(config.tokens),
    settings: { ...config.settings },
  };
}

let templateManagerState: TemplateConfigState = cloneTemplateConfig(DEFAULT_TEMPLATE_CONFIG);

function applySharedFlags(
  specifier: FormatSpecifier,
  options: UseFormatOptions,
  entry: TemplateConfigEntry,
): UseFormatOptions {
  const next: UseFormatOptions = { ...options };

  if (entry.respectGrouping !== false && specifier.comma) {
    next.useGrouping = true;
  } else if (entry.respectGrouping !== false && next.useGrouping === undefined) {
    next.useGrouping = false;
  }

  if (entry.respectSign !== false && specifier.sign === '+') {
    next.extend_includeSign = true;
  }

  if (!specifier.trim) {
    return next;
  }

  if ('minimumFractionDigits' in next) {
    delete (next as Record<string, unknown>).minimumFractionDigits;
  }
  if ('minimumSignificantDigits' in next && specifier.precision === undefined) {
    delete (next as Record<string, unknown>).minimumSignificantDigits;
  }

  return next;
}

function applyCurrencyEnhancements(
  specifier: FormatSpecifier,
  resolution: TemplateResolution,
  token?: string,
): TemplateResolution {
  const wantsCurrency =
    specifier.symbol === '$' || resolution.targetType === 'currency' || token === 'currency';

  if (!wantsCurrency) {
    return resolution;
  }

  const currencyCode = templateManagerState.settings.currency || 'CNY';
  const defaults: UseFormatOptions = { ...resolution.defaults };
  const forced: UseFormatOptions = { ...resolution.forced, style: 'currency' };

  if (!defaults.currency) {
    defaults.currency = currencyCode;
  }
  defaults.useGrouping = true;

  const precision = resolvePrecision(specifier);
  if (precision !== undefined) {
    const clamped = Math.max(0, precision);
    if (specifier.trim) {
      delete (defaults as Record<string, unknown>).extend_fixDecimals;
      defaults.maximumFractionDigits = clamped;
    } else if (defaults.extend_fixDecimals === undefined) {
      defaults.extend_fixDecimals = clamped;
    }
  } else if (defaults.extend_fixDecimals === undefined) {
    defaults.extend_fixDecimals = 2;
  }

  return {
    targetType: 'currency',
    defaults,
    forced,
  };
}

interface TemplateResolution {
  targetType: keyof FormatterDefaults;
  defaults: UseFormatOptions;
  forced: UseFormatOptions;
}

/**
 * 解析模板字符串，拆分出可选的 token 和 d3 格式化符号
 * @param template 模板字符串，例如 `currency|$.2f`
 * @returns 解析后的 token、格式化描述符以及原始片段
 */
function parseTemplate(template: string): {
  token?: string;
  specifier: FormatSpecifier;
  specFragment: string;
} {
  const trimmed = template.trim();
  const delimiterIndex = trimmed.indexOf('|');
  let token: string | undefined;
  let specFragment = trimmed;

  if (delimiterIndex >= 0) {
    token = trimmed.slice(0, delimiterIndex).trim();
    specFragment = trimmed.slice(delimiterIndex + 1);
  }

  const specifier = formatSpecifier(specFragment || '');
  return { token: token ? normalizeTokenKey(token) : undefined, specifier, specFragment };
}

/**
 * 根据模板字符串推导格式化配置
 * @param template 模板字符串
 * @returns 目标类型、默认选项和强制选项的解析结果
 */
function findTemplateEntry(
  token: string | undefined,
  rawType: string,
  normalizedType: string,
): TemplateConfigEntry | undefined {
  if (token) {
    const tokenEntry = templateManagerState.tokens[token];
    if (tokenEntry) {
      return tokenEntry;
    }
  }

  if (!normalizedType) {
    return templateManagerState.specifiers.default;
  }

  const rawEntry = templateManagerState.specifiers[rawType];
  if (rawEntry) {
    return rawEntry;
  }

  return templateManagerState.specifiers[normalizedType];
}

function resolveTemplate(template: string): TemplateResolution {
  const { token, specifier } = parseTemplate(template);
  const rawType = specifier.type ?? '';
  const normalizedType = rawType === '%' ? '%' : rawType.toLowerCase();

  const entry = findTemplateEntry(token, rawType, normalizedType);

  if (!entry) {
    throwIntlError({
      module: 'fp.templates.resolveTemplate',
      message: token
        ? `未支持的模板 token "${token}"`
        : `未支持的模板类型 "${specifier.type ?? ''}"`,
    });
  }

  const baseDefaults = entry.defaults ? { ...entry.defaults } : {};
  const derivedFromEntry = entry.deriveOptions ? entry.deriveOptions({ specifier, template, token }) : {};

  const defaults =
    entry.respectGrouping === false && entry.respectSign === false
      ? { ...baseDefaults, ...derivedFromEntry }
      : applySharedFlags(specifier, { ...baseDefaults, ...derivedFromEntry }, entry);

  const forced = entry.forced ? { ...entry.forced } : {};

  const baseResolution: TemplateResolution = {
    targetType: entry.targetType,
    defaults,
    forced,
  };

  return applyCurrencyEnhancements(specifier, baseResolution, token);
}

/**
 * 按照模板执行格式化流程，输出完整的 UseFormatResult
 * @param template 模板字符串
 * @param value 被格式化的值
 * @param overrides 用户传入的覆盖选项
 */
function runFormatterWithTemplate(
  template: string,
  value: unknown,
  overrides?: UseFormatOptions,
): UseFormatResult {
  const resolution = resolveTemplate(template);
  const mergedUserOptions: UseFormatOptions = {
    ...resolution.defaults,
    ...(overrides ?? {}),
  };

  const finalOptions = mergeOptionsWithDefaults(
    resolution.targetType,
    mergedUserOptions,
    resolution.forced,
  );
  const formatter = getMemoizedFormatter(finalOptions);
  return formatter.format(value);
}

/**
 * 模板格式化的快捷方法，直接返回格式化后的字符串
 * @param template 模板字符串
 * @param value 被格式化的值
 * @param overrides 用户传入的覆盖选项
 */
export function formatWithTemplate(
  template: string,
  value: unknown,
  overrides?: UseFormatOptions,
): string {
  return runFormatterWithTemplate(template, value, overrides).formattedValue;
}

/**
 * 模板格式化的增强方法，保留完整的格式化上下文
 * @param template 模板字符串
 * @param value 被格式化的值
 * @param overrides 用户传入的覆盖选项
 */
export function formatWithTemplateEx(
  template: string,
  value: unknown,
  overrides?: UseFormatOptions,
): UseFormatResult {
  return runFormatterWithTemplate(template, value, overrides);
}

export interface TemplateConfigurationInput {
  specifiers?: Partial<Record<string, TemplateConfigEntry>>;
  tokens?: Partial<Record<string, TemplateConfigEntry>>;
  settings?: Partial<TemplateConfigState['settings']>;
}

export function configTemplates(): TemplateConfigState;
export function configTemplates(update: TemplateConfigurationInput): TemplateConfigState;
/**
 * 配置模板系统，可用于读取当前配置或动态扩展 specifier/token
 * @param update 可选的配置更新对象
 * @returns 最新的模板配置快照
 */
export function configTemplates(update?: TemplateConfigurationInput): TemplateConfigState {
  if (!update) {
    return cloneTemplateConfig(templateManagerState);
  }

  if (update.specifiers) {
    for (const key of Object.keys(update.specifiers)) {
      const entry = update.specifiers[key];
      if (!entry) {
        continue;
      }
      templateManagerState.specifiers[key] = cloneEntry(entry)!;
    }
  }

  if (update.tokens) {
    for (const key of Object.keys(update.tokens)) {
      const entry = update.tokens[key];
      if (!entry) {
        continue;
      }
      templateManagerState.tokens[normalizeTokenKey(key)] = cloneEntry(entry)!;
    }
  }

  if (update.settings) {
    templateManagerState.settings = {
      ...templateManagerState.settings,
      ...update.settings,
    };
  }

  return cloneTemplateConfig(templateManagerState);
}

/**
 * 重置模板配置，恢复到默认状态
 */
export function resetTemplateConfig(): void {
  templateManagerState = cloneTemplateConfig(DEFAULT_TEMPLATE_CONFIG);
}
