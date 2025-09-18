import { formatSpecifier, type FormatSpecifier } from 'd3-format';
import type { UseFormatOptions } from './types';

type RuntimeFormatSpecifier = FormatSpecifier & {
  precision?: number;
  width?: number;
  comma?: boolean;
  zero?: boolean;
  trim?: boolean;
};

export interface FormatTemplateResolution {
  /** 原始的 D3 模板解析结果 */
  readonly specifier: FormatSpecifier;
  /** 模板类型（例如 f、% 等） */
  readonly type: string;
  /** 根据模板和配置解析得到的格式化选项 */
  readonly options: UseFormatOptions;
}

export interface FormatTemplateConfig {
  /** 全局默认配置，优先级最低 */
  defaults?: UseFormatOptions;
  /** 货币模板的默认货币代码 */
  defaultCurrency?: string;
  /** 针对特定类型的默认配置 */
  typeDefaults?: Record<string, UseFormatOptions | null>;
  /** 注册或覆盖特定类型的解析处理器 */
  typeHandlers?: Record<string, TemplateHandler>;
}

export interface TemplateConfigSnapshot {
  /** 当前的全局默认配置 */
  readonly defaults: UseFormatOptions;
  /** 默认货币代码 */
  readonly defaultCurrency?: string;
  /** 每个类型的默认配置（浅拷贝） */
  readonly typeDefaults: Record<string, UseFormatOptions>;
  /** 已注册的类型处理器列表 */
  readonly registeredTypes: string[];
}

export type TemplateHandler = (specifier: FormatSpecifier, type: string) => UseFormatOptions;

interface InternalTemplateConfig {
  defaults: UseFormatOptions;
  defaultCurrency?: string;
  typeDefaults: Map<string, UseFormatOptions>;
  typeHandlers: Map<string, TemplateHandler>;
}

const DEFAULT_TEMPLATE_TYPE = 'g';

function cloneOptions(options: UseFormatOptions | undefined): UseFormatOptions {
  if (!options) {
    return {};
  }
  return { ...options };
}

function cloneConfig(config: InternalTemplateConfig): InternalTemplateConfig {
  return {
    defaults: cloneOptions(config.defaults),
    defaultCurrency: config.defaultCurrency,
    typeDefaults: new Map(
      Array.from(config.typeDefaults.entries()).map(([key, value]) => [key, cloneOptions(value)]),
    ),
    typeHandlers: new Map(config.typeHandlers.entries()),
  };
}

function readPrecision(spec: RuntimeFormatSpecifier): number | undefined {
  const { precision } = spec;
  if (typeof precision === 'number' && Number.isFinite(precision)) {
    return precision;
  }
  if (precision === undefined) {
    return undefined;
  }
  const parsed = Number(precision);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isTrimEnabled(spec: RuntimeFormatSpecifier): boolean {
  return !!spec.trim;
}

function applyFractionDigits(
  base: UseFormatOptions,
  digits: number,
  trim: boolean,
): UseFormatOptions {
  const safeDigits = Math.max(0, Math.floor(digits));
  const next = { ...base } as UseFormatOptions;

  delete (next as Partial<UseFormatOptions>).minimumSignificantDigits;
  delete (next as Partial<UseFormatOptions>).maximumSignificantDigits;

  next.maximumFractionDigits = safeDigits;
  if (trim) {
    next.minimumFractionDigits = 0;
    delete (next as Partial<UseFormatOptions>).extend_fixDecimals;
    next.trailingZeroDisplay = 'stripIfInteger';
  } else {
    next.minimumFractionDigits = safeDigits;
    next.extend_fixDecimals = safeDigits;
  }

  return next;
}

function applySignificantDigits(
  base: UseFormatOptions,
  digits: number,
  trim: boolean,
): UseFormatOptions {
  const safeDigits = Math.max(1, Math.floor(digits));
  const next = { ...base } as UseFormatOptions;

  delete (next as Partial<UseFormatOptions>).minimumFractionDigits;
  delete (next as Partial<UseFormatOptions>).maximumFractionDigits;
  delete (next as Partial<UseFormatOptions>).extend_fixDecimals;

  next.maximumSignificantDigits = safeDigits;
  if (trim) {
    next.minimumSignificantDigits = 1;
    next.trailingZeroDisplay = 'stripIfInteger';
  } else {
    next.minimumSignificantDigits = safeDigits;
  }

  return next;
}

function createFixedHandler(style: UseFormatOptions['style']): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style };
    if (precision !== undefined) {
      options = applyFractionDigits(options, precision, trim);
    }
    return options;
  };
}

function createIntegerHandler(): TemplateHandler {
  return () => ({
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    extend_fixDecimals: 0,
  });
}

function createPercentHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'percent' };
    if (precision !== undefined) {
      options = applyFractionDigits(options, precision, trim);
    }
    return options;
  };
}

function createPercentRoundedHandler(): TemplateHandler {
  return (specifier, type) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);
    const defaultPrecision = precision ?? (type === 'p' ? 6 : 6);

    return applySignificantDigits({ style: 'percent' }, defaultPrecision, trim);
  };
}

function createPerMilleHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'per-mille' };
    if (precision !== undefined) {
      options = applyFractionDigits(options, precision, trim);
    }
    return options;
  };
}

function createScientificHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime) ?? 6;
    const trim = isTrimEnabled(runtime);

    return applyFractionDigits({ style: 'decimal', notation: 'scientific' }, precision, trim);
  };
}

function createCompactHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime) ?? 3;
    const trim = isTrimEnabled(runtime);

    return applySignificantDigits(
      { style: 'decimal', notation: 'compact', compactDisplay: 'short' },
      precision,
      trim,
    );
  };
}

function createGeneralHandler(defaultPrecision: number): TemplateHandler {
  return (specifier, type) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    const fallbackPrecision = precision ?? (type === '' ? 12 : defaultPrecision);
    return applySignificantDigits({ style: 'decimal' }, fallbackPrecision, trim);
  };
}

function createRoundedDecimalHandler(): TemplateHandler {
  return (specifier, type) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);
    const fallbackPrecision = precision ?? (type === '' ? 12 : 6);

    const options = applySignificantDigits({ style: 'decimal', notation: 'standard' }, fallbackPrecision, trim);
    return options;
  };
}

function createDefaultHandlers(): Map<string, TemplateHandler> {
  const handlers = new Map<string, TemplateHandler>();
  handlers.set('f', createFixedHandler('decimal'));
  handlers.set('F', createFixedHandler('decimal'));
  handlers.set('d', createIntegerHandler());
  handlers.set('%', createPercentHandler());
  handlers.set('p', createPercentRoundedHandler());
  handlers.set('P', createPerMilleHandler());
  handlers.set('e', createScientificHandler());
  handlers.set('E', createScientificHandler());
  handlers.set('s', createCompactHandler());
  handlers.set('S', createCompactHandler());
  handlers.set('g', createGeneralHandler(6));
  handlers.set('G', createGeneralHandler(6));
  handlers.set('', createGeneralHandler(6));
  handlers.set('n', createGeneralHandler(6));
  handlers.set('N', createGeneralHandler(6));
  handlers.set('r', createRoundedDecimalHandler());
  handlers.set('R', createRoundedDecimalHandler());
  return handlers;
}

const INITIAL_CONFIG: InternalTemplateConfig = {
  defaults: {},
  defaultCurrency: undefined,
  typeDefaults: new Map<string, UseFormatOptions>([['n', { useGrouping: true }]]),
  typeHandlers: createDefaultHandlers(),
};

let templateConfig: InternalTemplateConfig = cloneConfig(INITIAL_CONFIG);

function getHandlerForType(type: string): TemplateHandler | undefined {
  const direct = templateConfig.typeHandlers.get(type);
  if (direct) {
    return direct;
  }
  const lower = type.toLowerCase();
  if (lower !== type) {
    return templateConfig.typeHandlers.get(lower);
  }
  return undefined;
}

function getTypeDefaults(type: string): UseFormatOptions | undefined {
  const direct = templateConfig.typeDefaults.get(type);
  if (direct) {
    return cloneOptions(direct);
  }
  const lower = type.toLowerCase();
  if (lower !== type) {
    const fallback = templateConfig.typeDefaults.get(lower);
    if (fallback) {
      return cloneOptions(fallback);
    }
  }
  return undefined;
}

function applySpecifierAdjustments(
  baseOptions: UseFormatOptions,
  specifier: FormatSpecifier,
  type: string,
  overrides?: UseFormatOptions,
): UseFormatOptions {
  const runtime = specifier as RuntimeFormatSpecifier;
  const next: UseFormatOptions = { ...baseOptions };

  if (runtime.comma) {
    next.useGrouping = true;
  } else if (next.useGrouping === undefined) {
    next.useGrouping = false;
  }

  switch (runtime.sign) {
    case '+':
      next.signDisplay = 'always';
      break;
    case ' ':
      next.signDisplay = 'exceptZero';
      break;
    case '(':
      if (next.style === 'currency') {
        next.currencySign = 'accounting';
      } else {
        next.signDisplay = 'always';
      }
      break;
    default:
      break;
  }

  if (runtime.trim && next.trailingZeroDisplay === undefined) {
    next.trailingZeroDisplay = 'stripIfInteger';
  }

  if (runtime.symbol === '$') {
    const resolvedCurrency =
      overrides?.currency ?? next.currency ?? templateConfig.defaultCurrency;
    if (!resolvedCurrency) {
      throw new Error(
        `Format template "${specifier.toString()}" requires a currency code. ` +
          'Provide one via overrides or configureFormatTemplate({ defaultCurrency }).',
      );
    }
    next.style = 'currency';
    next.currency = resolvedCurrency;
  }

  // 零填充使用最小整数位数做近似处理
  if (runtime.zero && typeof runtime.width === 'number' && runtime.width > 0) {
    const minimumIntegerDigits = Math.max(1, Math.floor(runtime.width));
    if (!Number.isNaN(minimumIntegerDigits)) {
      next.minimumIntegerDigits = Math.max(next.minimumIntegerDigits ?? 0, minimumIntegerDigits);
    }
  }

  if (!next.style) {
    next.style = type === '%' ? 'percent' : 'decimal';
  }

  return next;
}

function mergeOptionsChain(optionsList: UseFormatOptions[]): UseFormatOptions {
  return optionsList.reduce<UseFormatOptions>((acc, current) => {
    if (!current || Object.keys(current).length === 0) {
      return acc;
    }
    return { ...acc, ...current };
  }, {});
}

export function resolveFormatTemplate(
  template: string,
  overrides?: UseFormatOptions,
): FormatTemplateResolution {
  if (typeof template !== 'string' || template.trim().length === 0) {
    throw new Error('Format template must be a non-empty string.');
  }

  const specifier = formatSpecifier(template);
  const type = (specifier.type ?? DEFAULT_TEMPLATE_TYPE).toString();

  const handler =
    getHandlerForType(type) ??
    getHandlerForType(type.toLowerCase()) ??
    getHandlerForType(DEFAULT_TEMPLATE_TYPE);

  if (!handler) {
    throw new Error(`No format template handler registered for type "${type}".`);
  }

  const optionsChain: UseFormatOptions[] = [];
  optionsChain.push(cloneOptions(templateConfig.defaults));

  const typeDefault = getTypeDefaults(type);
  if (typeDefault) {
    optionsChain.push(typeDefault);
  }

  const handlerOptions = handler(specifier, type);
  optionsChain.push(handlerOptions);

  let merged = mergeOptionsChain(optionsChain);
  merged = applySpecifierAdjustments(merged, specifier, type, overrides);

  if (overrides) {
    merged = { ...merged, ...overrides };
  }

  return {
    specifier,
    type,
    options: merged,
  };
}

export function getFormatTemplateConfig(): TemplateConfigSnapshot {
  const snapshot = cloneConfig(templateConfig);
  const typeDefaults: Record<string, UseFormatOptions> = {};
  snapshot.typeDefaults.forEach((value, key) => {
    typeDefaults[key] = value;
  });

  return {
    defaults: snapshot.defaults,
    defaultCurrency: snapshot.defaultCurrency,
    typeDefaults,
    registeredTypes: Array.from(new Set(snapshot.typeHandlers.keys())).sort(),
  };
}

export function configureFormatTemplate(config: FormatTemplateConfig): TemplateConfigSnapshot {
  if (config.defaults) {
    templateConfig = {
      ...templateConfig,
      defaults: { ...templateConfig.defaults, ...config.defaults },
    };
  }

  if (config.defaultCurrency !== undefined) {
    templateConfig = {
      ...templateConfig,
      defaultCurrency: config.defaultCurrency || undefined,
    };
  }

  if (config.typeDefaults) {
    const updated = new Map(templateConfig.typeDefaults.entries());
    Object.entries(config.typeDefaults).forEach(([type, value]) => {
      if (value === null) {
        updated.delete(type);
      } else if (value) {
        updated.set(type, cloneOptions(value));
      }
    });
    templateConfig = { ...templateConfig, typeDefaults: updated };
  }

  if (config.typeHandlers) {
    const updated = new Map(templateConfig.typeHandlers.entries());
    Object.entries(config.typeHandlers).forEach(([type, handler]) => {
      if (typeof handler === 'function') {
        updated.set(type, handler);
      }
    });
    templateConfig = { ...templateConfig, typeHandlers: updated };
  }

  return getFormatTemplateConfig();
}

export function registerTemplateHandler(type: string, handler: TemplateHandler): void {
  if (!type) {
    throw new Error('Template type must be a non-empty string.');
  }
  templateConfig.typeHandlers.set(type, handler);
}

export function unregisterTemplateHandler(type: string): boolean {
  return templateConfig.typeHandlers.delete(type);
}

export function setTemplateTypeDefaults(type: string, defaults: UseFormatOptions | null): void {
  if (!type) {
    throw new Error('Template type must be a non-empty string.');
  }
  if (!defaults) {
    templateConfig.typeDefaults.delete(type);
    return;
  }
  templateConfig.typeDefaults.set(type, cloneOptions(defaults));
}

export function resetFormatTemplateConfig(): void {
  templateConfig = cloneConfig(INITIAL_CONFIG);
}

