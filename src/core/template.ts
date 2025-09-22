import { formatSpecifier, type FormatSpecifier } from 'd3-format';
import type { UseFormatOptions } from './types';
import type {
  TemplateHandler,
  TemplatePluginHandler,
  TemplatePluginRegistration,
} from './template-types';
export type {
  TemplateHandler,
  TemplatePluginHandler,
  TemplatePluginRegistration,
} from './template-types';
import { builtinTemplateIntegrations } from '../plugins/template-integrations';

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
  /** 按类型设置默认选项，传入 null 表示清除该类型默认值 */
  typeDefaults?: Record<string, UseFormatOptions | null>;
  /** 直接覆写模板处理器（较少使用，仅供特殊场景） */
  typeHandlers?: Record<string, TemplateHandler | null | undefined>;
}

const DEFAULT_TEMPLATE_TYPE = 'g';

interface TemplateState {
  defaults: UseFormatOptions;
  defaultCurrency?: string;
  typeDefaults: Map<string, UseFormatOptions>;
  configuredHandlers: Map<string, TemplateHandler>;
}

interface PluginEntry {
  handlers: Map<string, TemplateHandler>;
  defaults: Map<string, UseFormatOptions | null>;
}

interface RuntimeFormatSpecifier extends FormatSpecifier {
  precision?: number;
  trim?: boolean;
  comma?: boolean;
  zero?: boolean;
  width?: number;
  sign?: string;
  symbol?: string;
}

const templateState: TemplateState = createInitialState();
const manualHandlers = new Map<string, TemplateHandler>();
const pluginRegistry = new Map<string, PluginEntry>();
let pluginOrder: string[] = [];
const templateSpecifierCache = new Map<string, FormatSpecifier>();

const BASE_TEMPLATE_HANDLERS: Record<string, TemplateHandler> = {
  // 固定小数：f/F，对应 decimal 样式
  f: createFixedHandler('decimal'),
  F: createFixedHandler('decimal'),
  // 百分比：%/p
  '%': createFixedHandler('percent'),
  p: createFixedHandler('percent'),
  // 科学计数法：e/E
  e: createScientificHandler(),
  E: createScientificHandler(),
  // 有效数字：g/G/r/R
  g: createGenericHandler(),
  G: createGenericHandler(),
  r: createGenericHandler(),
  R: createGenericHandler(),
  // 整数：d/i
  d: createIntegerHandler(),
  i: createIntegerHandler(),
  // 紧凑表示：s
  s: createCompactHandler(),
  // 默认兜底
  [DEFAULT_TEMPLATE_TYPE]: () => ({ style: 'decimal' }),
};

function createInitialState(): TemplateState {
  return {
    defaults: {},
    defaultCurrency: undefined,
    typeDefaults: new Map(),
    configuredHandlers: new Map(),
  };
}

function cloneOptions(options: UseFormatOptions | null | undefined): UseFormatOptions {
  return options ? { ...options } : {};
}

function readPrecision(specifier: RuntimeFormatSpecifier): number | undefined {
  const { precision } = specifier;
  if (typeof precision === 'number' && Number.isFinite(precision)) {
    return precision;
  }
  if (precision == null) {
    return undefined;
  }
  const parsed = Number(precision);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isTrimEnabled(specifier: RuntimeFormatSpecifier): boolean {
  return !!specifier.trim;
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

function createScientificHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'decimal', notation: 'scientific' };
    if (precision !== undefined) {
      options = applySignificantDigits(options, precision, trim);
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
  return () => ({
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    extend_fixDecimals: 0,
  });
}

function createCompactHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = {
      style: 'decimal',
      notation: 'compact',
      compactDisplay: 'short',
    };
    if (precision !== undefined) {
      options = applySignificantDigits(options, precision, trim);
    }
    return options;
  };
}

function getSpecifier(template: string): FormatSpecifier {
  const cached = templateSpecifierCache.get(template);
  if (cached) {
    return cached;
  }
  const parsed = formatSpecifier(template);
  templateSpecifierCache.set(template, parsed);
  return parsed;
}

function selectHandler(type: string): TemplateHandler {
  if (manualHandlers.has(type)) {
    return manualHandlers.get(type)!;
  }
  if (templateState.configuredHandlers.has(type)) {
    return templateState.configuredHandlers.get(type)!;
  }
  const pluginHandler = resolvePluginHandler(type);
  if (pluginHandler) {
    return pluginHandler;
  }
  if (BASE_TEMPLATE_HANDLERS[type]) {
    return BASE_TEMPLATE_HANDLERS[type];
  }
  return BASE_TEMPLATE_HANDLERS[DEFAULT_TEMPLATE_TYPE];
}

function resolvePluginHandler(type: string): TemplateHandler | undefined {
  for (let i = pluginOrder.length - 1; i >= 0; i -= 1) {
    const pluginId = pluginOrder[i];
    const entry = pluginRegistry.get(pluginId);
    if (!entry) continue;
    const handler = entry.handlers.get(type);
    if (handler) {
      return handler;
    }
  }
  return undefined;
}

function resolvePluginDefaults(type: string): UseFormatOptions | undefined {
  let merged: UseFormatOptions | undefined;
  for (const pluginId of pluginOrder) {
    const entry = pluginRegistry.get(pluginId);
    if (!entry) continue;
    if (!entry.defaults.has(type)) continue;
    const defaults = entry.defaults.get(type);
    if (defaults === null) {
      merged = undefined;
      continue;
    }
    merged = { ...(merged ?? {}), ...cloneOptions(defaults) };
  }
  return merged;
}

function applyGeneralSpecifier(meta: RuntimeFormatSpecifier, base: UseFormatOptions): UseFormatOptions {
  const next = { ...base } as UseFormatOptions;

  // 是否启用千分位分隔符（D3 模板默认关闭，显式 `,` 才会开启）
  if (meta.comma) {
    next.useGrouping = true;
  } else {
    next.useGrouping = false;
  }

  // `+` 标识需要显示符号，`(` 代表负数用括号包裹（通过插件扩展 signDisplay）
  if (meta.sign === '+') {
    next.includeSign = true;
    next.signDisplay = 'always';
  } else if (meta.sign === '(') {
    next.signDisplay = 'exceptZero';
  }

  // 宽度参数用于补零对齐，遵循 Intl 限制将范围控制在 1-21
  if (typeof meta.width === 'number' && Number.isFinite(meta.width) && meta.width > 0) {
    const width = Math.max(1, Math.min(21, Math.floor(meta.width)));
    next.minimumIntegerDigits = Math.max(next.minimumIntegerDigits ?? 0, width);
  }

  if (meta.zero) {
    next.useGrouping = false;
  }

  // `$` 符号自动转换为货币样式
  if (meta.symbol === '$') {
    next.style = 'currency';
  }

  return next;
}

function applyDefaultCurrency(options: UseFormatOptions, overrides?: UseFormatOptions): UseFormatOptions {
  if (options.style !== 'currency') {
    return options;
  }
  if (overrides?.currency) {
    return { ...options, currency: overrides.currency };
  }
  if (options.currency) {
    return options;
  }
  if (templateState.defaultCurrency) {
    return { ...options, currency: templateState.defaultCurrency };
  }
  return options;
}

function resolveTypeDefaults(type: string): UseFormatOptions {
  const pluginDefaults = resolvePluginDefaults(type);
  const configuredDefaults = templateState.typeDefaults.get(type);
  return {
    ...cloneOptions(templateState.defaults),
    ...(pluginDefaults ? cloneOptions(pluginDefaults) : {}),
    ...(configuredDefaults ? cloneOptions(configuredDefaults) : {}),
  };
}

export function resolveFormatTemplate(
  template: string,
  overrides?: UseFormatOptions,
): FormatTemplateResolution {
  const specifier = getSpecifier(template) as RuntimeFormatSpecifier;
  const type = specifier.type && specifier.type.length > 0 ? specifier.type : DEFAULT_TEMPLATE_TYPE;

  const handler = selectHandler(type);
  const defaults = resolveTypeDefaults(type);
  const handled = handler(specifier, type) ?? {};

  let options = {
    ...defaults,
    ...cloneOptions(handled),
  } as UseFormatOptions;

  options = applyGeneralSpecifier(specifier, options);
  options = applyDefaultCurrency(options, overrides);

  if (overrides) {
    options = { ...options, ...cloneOptions(overrides) };
    options = applyDefaultCurrency(options, overrides);
  }

  if (!options.style) {
    options.style = 'decimal';
  }

  return {
    specifier,
    type,
    options,
  };
}

export function configureFormatTemplate(config: FormatTemplateConfig): void {
  if (!config) return;

  if (config.defaults) {
    templateState.defaults = { ...templateState.defaults, ...cloneOptions(config.defaults) };
  }

  if (config.defaultCurrency !== undefined) {
    templateState.defaultCurrency = config.defaultCurrency || undefined;
  }

  if (config.typeDefaults) {
    for (const [type, value] of Object.entries(config.typeDefaults)) {
      if (value == null) {
        templateState.typeDefaults.delete(type);
      } else {
        templateState.typeDefaults.set(type, cloneOptions(value));
      }
    }
  }

  if (config.typeHandlers) {
    for (const [type, handler] of Object.entries(config.typeHandlers)) {
      if (!handler) {
        templateState.configuredHandlers.delete(type);
      } else {
        templateState.configuredHandlers.set(type, handler);
      }
    }
  }
}

export function setTemplateTypeDefaults(type: string, defaults?: UseFormatOptions | null): void {
  if (!defaults) {
    templateState.typeDefaults.delete(type);
    return;
  }
  templateState.typeDefaults.set(type, cloneOptions(defaults));
}

export function registerTemplateHandler(type: string, handler: TemplateHandler): void {
  manualHandlers.set(type, handler);
}

export function unregisterTemplateHandler(type: string): void {
  manualHandlers.delete(type);
}

export function registerPluginTemplateHandlers(
  plugin: string,
  handlers: readonly TemplatePluginHandler[],
): void {
  if (pluginRegistry.has(plugin)) {
    unregisterPluginTemplateHandlers(plugin);
  }

  const handlerMap = new Map<string, TemplateHandler>();
  const defaultsMap = new Map<string, UseFormatOptions | null>();

  handlers.forEach((item) => {
    handlerMap.set(item.type, item.handler);
    if ('defaults' in item) {
      defaultsMap.set(item.type, item.defaults ?? null);
    }
  });

  pluginRegistry.set(plugin, { handlers: handlerMap, defaults: defaultsMap });
  pluginOrder = [...pluginOrder.filter((id) => id !== plugin), plugin];
}

export function unregisterPluginTemplateHandlers(plugin: string): void {
  if (!pluginRegistry.has(plugin)) {
    return;
  }
  pluginRegistry.delete(plugin);
  pluginOrder = pluginOrder.filter((id) => id !== plugin);
}

export function resetFormatTemplateConfig(): void {
  manualHandlers.clear();
  templateState.defaults = {};
  templateState.defaultCurrency = undefined;
  templateState.typeDefaults.clear();
  templateState.configuredHandlers.clear();
  templateSpecifierCache.clear();
}

function initializeBuiltinPlugins(): void {
  builtinTemplateIntegrations.forEach((registration: TemplatePluginRegistration) => {
    registerPluginTemplateHandlers(registration.plugin, registration.handlers);
  });
}

initializeBuiltinPlugins();
