import { formatSpecifier, type FormatSpecifier } from 'd3-format';
import type { UseFormatOptions } from './types';
import type { TemplateHandler, TemplatePluginHandler, TemplatePluginRegistration } from './template-types';
export type { TemplateHandler, TemplatePluginHandler, TemplatePluginRegistration } from './template-types';
import { builtinTemplateIntegrations } from '../plugins/template-integrations';

interface RuntimeFormatSpecifier extends FormatSpecifier {
  precision?: number;
  trim?: boolean;
  comma?: boolean;
  zero?: boolean;
  width?: number;
  sign?: string;
  symbol?: string;
}

export interface FormatTemplateResolution {
  /** D3 模板解析结果，便于外部调试与复用 */
  readonly specifier: FormatSpecifier;
  /** 模板类型（例如 f、% 等） */
  readonly type: string;
  /** 结合模板、配置和覆盖项生成的最终格式化配置 */
  readonly options: UseFormatOptions;
}

export interface FormatTemplateConfig {
  /** 全局默认选项，优先级最低 */
  defaults?: UseFormatOptions;
  /** 指定默认货币，供货币模板在未设置 currency 时兜底 */
  defaultCurrency?: string;
  /** 按类型设置默认选项，null 表示清除该类型默认值 */
  typeDefaults?: Record<string, UseFormatOptions | null>;
  /** 直接覆写模板处理器（较少使用，仅供特殊场景） */
  typeHandlers?: Record<string, TemplateHandler>;
}

const DEFAULT_TEMPLATE_TYPE = 'g';

interface InternalTemplateConfig {
  defaults: UseFormatOptions;
  defaultCurrency?: string;
  typeDefaults: Map<string, UseFormatOptions>;
  typeHandlers: Map<string, TemplateHandler>;
}

interface PluginRecord {
  handlers: {
    readonly type: string;
    readonly previous?: TemplateHandler;
    readonly existed: boolean;
  }[];
  defaults: {
    readonly type: string;
    readonly previous?: UseFormatOptions;
    readonly existed: boolean;
  }[];
}

const BASE_TYPE_HANDLERS: Record<string, TemplateHandler> = {
  // 固定小数场景：f/F，默认使用 fraction digits
  f: createFixedHandler('decimal'),
  F: createFixedHandler('decimal'),
  // 百分比：% 和 p
  '%': createFixedHandler('percent'),
  p: createFixedHandler('percent'),
  // 指数形式：e/E
  e: createScientificHandler(),
  E: createScientificHandler(),
  // 通用形式：g/G/r/R，优先使用有效数字
  g: createGenericHandler(),
  G: createGenericHandler(),
  r: createGenericHandler(),
  R: createGenericHandler(),
  // 整数：d/i
  d: createIntegerHandler(),
  i: createIntegerHandler(),
};

let templateConfig: InternalTemplateConfig = createEmptyConfig();

// 记录插件注册前的状态，便于在卸载时回滚
const pluginStates = new Map<string, PluginRecord>();
// 手动注册的处理器优先级最高
const manualHandlers = new Map<string, TemplateHandler>();
// 缓存模板解析结果，避免重复 formatSpecifier 计算
const templateSpecifierCache = new Map<string, { specifier: FormatSpecifier; type: string }>();

function createEmptyConfig(): InternalTemplateConfig {
  return {
    defaults: {},
    defaultCurrency: undefined,
    typeDefaults: new Map(),
    typeHandlers: new Map(),
  };
}

function cloneOptions(options: UseFormatOptions | undefined): UseFormatOptions {
  return options ? { ...options } : {};
}

function readPrecision(spec: RuntimeFormatSpecifier): number | undefined {
  const { precision } = spec;
  if (typeof precision === 'number' && Number.isFinite(precision)) {
    return precision;
  }
  if (precision == null) {
    return undefined;
  }
  const parsed = Number(precision);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isTrimEnabled(spec: RuntimeFormatSpecifier): boolean {
  return !!spec.trim;
}

function applyFractionDigits(base: UseFormatOptions, digits: number, trim: boolean): UseFormatOptions {
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

function applySignificantDigits(base: UseFormatOptions, digits: number, trim: boolean): UseFormatOptions {
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

function createScientificHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'decimal', notation: 'scientific' };
    if (precision !== undefined) {
      options = applySignificantDigits(options, precision + 1, trim);
    }
    return options;
  };
}

function createGenericHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'decimal' };
    if (precision !== undefined) {
      options = applySignificantDigits(options, precision, trim);
    }
    return options;
  };
}

function createIntegerHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const options: UseFormatOptions = { style: 'decimal' };
    const trim = isTrimEnabled(runtime);

    return applyFractionDigits(options, 0, trim);
  };
}

function mergeOptions(base: UseFormatOptions, extra?: UseFormatOptions): UseFormatOptions {
  return extra ? { ...base, ...extra } : base;
}

function resolveTypeHandler(type: string): TemplateHandler | undefined {
  return manualHandlers.get(type) ?? templateConfig.typeHandlers.get(type) ?? BASE_TYPE_HANDLERS[type];
}

function resolveTypeDefaults(type: string): UseFormatOptions | undefined {
  return templateConfig.typeDefaults.get(type);
}

function applyCommonFlags(options: UseFormatOptions, specifier: RuntimeFormatSpecifier): UseFormatOptions {
  const next = { ...options } as UseFormatOptions;

  if (specifier.sign === '+') {
    next.includeSign = true;
    next.signDisplay = 'always';
  }
  if (specifier.comma) {
    next.useGrouping = true;
  }
  if (specifier.zero) {
    next.useGrouping ??= false;
  }
  if (specifier.width && specifier.width > 0) {
    next.minimumIntegerDigits = Math.min(21, Math.max(1, Math.floor(specifier.width)));
  }

  return next;
}

function ensureCurrencyDefaults(options: UseFormatOptions): UseFormatOptions {
  if (options.style === 'currency' && !options.currency && templateConfig.defaultCurrency) {
    return { ...options, currency: templateConfig.defaultCurrency };
  }
  return options;
}

function applySymbolOverrides(
  options: UseFormatOptions,
  specifier: RuntimeFormatSpecifier,
): UseFormatOptions {
  if (specifier.symbol === '$') {
    const next = { ...options, style: 'currency' } as UseFormatOptions;
    if (!next.currency && templateConfig.defaultCurrency) {
      next.currency = templateConfig.defaultCurrency;
    }
    return next;
  }
  return options;
}

function buildOptions(
  specifier: RuntimeFormatSpecifier,
  type: string,
  overrides?: UseFormatOptions,
): UseFormatOptions {
  // 1. 基础默认值
  let options = cloneOptions(templateConfig.defaults);

  // 2. 类型默认值
  const defaults = resolveTypeDefaults(type);
  if (defaults) {
    options = mergeOptions(options, defaults);
  }

  if (options.style === undefined) {
    options = { ...options, style: 'decimal' };
  }
  if (options.useGrouping === undefined) {
    options = { ...options, useGrouping: false };
  }

  // 3. 类型处理器
  const handler = resolveTypeHandler(type);
  if (handler) {
    options = mergeOptions(options, handler(specifier, type));
  }
  if (options.style === undefined) {
    options = { ...options, style: 'decimal' };
  }

  // 4. 根据符号、分组等常规标记补充参数
  options = applyCommonFlags(options, specifier);

  // 5. 根据 $ 符号切换货币样式
  options = applySymbolOverrides(options, specifier);

  // 6. 补全默认货币
  options = ensureCurrencyDefaults(options);

  // 7. 外部覆盖项优先级最高
  if (overrides) {
    options = mergeOptions(options, overrides);
  }

  return options;
}

function parseSpecifier(template: string): { specifier: FormatSpecifier; type: string } {
  const cached = templateSpecifierCache.get(template);
  if (cached) {
    return cached;
  }
  const specifier = formatSpecifier(template);
  const type = specifier.type || DEFAULT_TEMPLATE_TYPE;
  const record = { specifier, type } as const;
  templateSpecifierCache.set(template, record);
  return record;
}

function clearCaches(): void {
  templateSpecifierCache.clear();
}

function internalRegisterPlugin(registration: TemplatePluginRegistration, track = true): void {
  if (track && pluginStates.has(registration.plugin)) {
    unregisterPluginTemplateHandlers(registration.plugin);
  }

  const record: PluginRecord = { handlers: [], defaults: [] };

  for (const definition of registration.handlers) {
    const { type, handler, defaults } = definition;

    const previousHandler = templateConfig.typeHandlers.get(type);
    const existedHandler = templateConfig.typeHandlers.has(type);
    templateConfig.typeHandlers.set(type, handler);
    record.handlers.push({ type, previous: previousHandler, existed: existedHandler });

    if (defaults !== undefined) {
      const previousDefaults = templateConfig.typeDefaults.get(type);
      const existedDefaults = templateConfig.typeDefaults.has(type);

      if (defaults === null) {
        templateConfig.typeDefaults.delete(type);
      } else {
        templateConfig.typeDefaults.set(type, { ...defaults });
      }

      record.defaults.push({
        type,
        previous: previousDefaults,
        existed: existedDefaults,
      });
    }
  }

  if (track) {
    pluginStates.set(registration.plugin, record);
  }

  clearCaches();
}

function restorePluginRecord(record: PluginRecord): void {
  for (const item of record.handlers) {
    if (item.existed && item.previous) {
      templateConfig.typeHandlers.set(item.type, item.previous);
    } else {
      templateConfig.typeHandlers.delete(item.type);
    }
  }

  for (const item of record.defaults) {
    if (item.existed && item.previous) {
      templateConfig.typeDefaults.set(item.type, { ...item.previous });
    } else {
      templateConfig.typeDefaults.delete(item.type);
    }
  }
}

function reapplyBuiltinPlugins(): void {
  for (const integration of builtinTemplateIntegrations) {
    internalRegisterPlugin(integration, false);
  }
}

// 初始化时加载默认配置与内置插件
resetFormatTemplateConfig();

/**
 * 解析模板并返回核心消费所需的配置。
 *
 * @param template D3-format 风格模板字符串
 * @param overrides 同步传入的覆盖选项
 */
export function resolveFormatTemplate(
  template: string,
  overrides?: UseFormatOptions,
): FormatTemplateResolution {
  const { specifier, type } = parseSpecifier(template);
  const runtime = specifier as RuntimeFormatSpecifier;

  // 通过缓存避免重复解析模板，提高性能
  const options = buildOptions(runtime, type, overrides);

  return {
    specifier,
    type,
    options,
  };
}

/**
 * 使用配置模块批量调整模板默认行为。
 */
export function configureFormatTemplate(config: FormatTemplateConfig): void {
  if (config.defaults) {
    templateConfig.defaults = { ...config.defaults };
  }
  if (config.defaultCurrency !== undefined) {
    templateConfig.defaultCurrency = config.defaultCurrency;
  }
  if (config.typeDefaults) {
    for (const [type, value] of Object.entries(config.typeDefaults)) {
      if (value === null) {
        templateConfig.typeDefaults.delete(type);
      } else {
        templateConfig.typeDefaults.set(type, { ...value });
      }
    }
  }
  if (config.typeHandlers) {
    for (const [type, handler] of Object.entries(config.typeHandlers)) {
      templateConfig.typeHandlers.set(type, handler);
    }
  }

  clearCaches();
}

/**
 * 设置特定类型的默认选项。
 */
export function setTemplateTypeDefaults(type: string, defaults?: UseFormatOptions): void {
  if (defaults) {
    templateConfig.typeDefaults.set(type, { ...defaults });
  } else {
    templateConfig.typeDefaults.delete(type);
  }
  clearCaches();
}

/**
 * 注册自定义模板处理器，通常用于业务插件。
 */
export function registerTemplateHandler(type: string, handler: TemplateHandler): void {
  if (!type) {
    return;
  }
  manualHandlers.set(type, handler);
  clearCaches();
}

/**
 * 注销自定义模板处理器，恢复到注册前的状态。
 */
export function unregisterTemplateHandler(type: string): void {
  if (!manualHandlers.has(type)) {
    return;
  }
  manualHandlers.delete(type);
  clearCaches();
}

/**
 * 注册插件声明的一组模板处理器。
 */
export function registerPluginTemplateHandlers(
  plugin: string,
  handlers: readonly TemplatePluginHandler[],
): void {
  if (!plugin) {
    return;
  }
  const registration: TemplatePluginRegistration = { plugin, handlers };
  internalRegisterPlugin(registration, true);
}

/**
 * 注销插件模板处理器。
 */
export function unregisterPluginTemplateHandlers(plugin: string): void {
  if (!plugin) {
    return;
  }
  const record = pluginStates.get(plugin);
  if (!record) {
    return;
  }
  pluginStates.delete(plugin);
  restorePluginRecord(record);
  clearCaches();
}

/**
 * 重置模板配置，保留内置插件处理能力。
 */
export function resetFormatTemplateConfig(): void {
  templateConfig = createEmptyConfig();
  pluginStates.clear();
  manualHandlers.clear();
  clearCaches();
  reapplyBuiltinPlugins();
}
