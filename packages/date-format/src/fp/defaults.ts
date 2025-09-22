import type { UseDateFormatOptions } from '../core/types';

/**
 * @description 日期时间格式化函数的默认配置集合。
 */
export interface FormatterDefaults {
  /**
   * @description 纯日期展示的默认选项。
   */
  date: UseDateFormatOptions;
  /**
   * @description 纯时间展示的默认选项。
   */
  time: UseDateFormatOptions;
  /**
   * @description 同时包含日期与时间的默认选项。
   */
  dateTime: UseDateFormatOptions;
  /**
   * @description 含秒数的日期时间默认选项。
   */
  dateTimeWithSeconds: UseDateFormatOptions;
  /**
   * @description 展示星期的默认选项。
   */
  weekday: UseDateFormatOptions;
  /**
   * @description 展示月份与日期的默认选项。
   */
  monthDay: UseDateFormatOptions;
  /**
   * @description 展示月份的默认选项。
   */
  month: UseDateFormatOptions;
  /**
   * @description 日期区间格式化的默认选项。
   */
  range: UseDateFormatOptions;
}

const INITIAL_DEFAULTS: FormatterDefaults = {
  date: {
    locale: 'zh-CN',
    dateStyle: 'short',
  },
  time: {
    locale: 'zh-CN',
    timeStyle: 'short',
  },
  dateTime: {
    locale: 'zh-CN',
    dateStyle: 'short',
    timeStyle: 'short',
  },
  dateTimeWithSeconds: {
    locale: 'zh-CN',
    dateStyle: 'short',
    timeStyle: 'medium',
  },
  weekday: {
    locale: 'zh-CN',
    weekday: 'long',
  },
  monthDay: {
    locale: 'zh-CN',
    month: 'long',
    day: 'numeric',
  },
  month: {
    locale: 'zh-CN',
    month: 'long',
  },
  range: {
    locale: 'zh-CN',
    dateStyle: 'short',
  },
};

function cloneDefaults(): FormatterDefaults {
  return {
    date: { ...INITIAL_DEFAULTS.date },
    time: { ...INITIAL_DEFAULTS.time },
    dateTime: { ...INITIAL_DEFAULTS.dateTime },
    dateTimeWithSeconds: { ...INITIAL_DEFAULTS.dateTimeWithSeconds },
    weekday: { ...INITIAL_DEFAULTS.weekday },
    monthDay: { ...INITIAL_DEFAULTS.monthDay },
    month: { ...INITIAL_DEFAULTS.month },
    range: { ...INITIAL_DEFAULTS.range },
  };
}

function isFormatterKey(key: string): key is keyof FormatterDefaults {
  return Object.prototype.hasOwnProperty.call(INITIAL_DEFAULTS, key);
}

let defaultConfigs: FormatterDefaults = cloneDefaults();

/**
 * @description 获取当前生效的默认配置快照。
 */
export function getDefaultConfigs(): FormatterDefaults {
  return {
    date: { ...defaultConfigs.date },
    time: { ...defaultConfigs.time },
    dateTime: { ...defaultConfigs.dateTime },
    dateTimeWithSeconds: { ...defaultConfigs.dateTimeWithSeconds },
    weekday: { ...defaultConfigs.weekday },
    monthDay: { ...defaultConfigs.monthDay },
    month: { ...defaultConfigs.month },
    range: { ...defaultConfigs.range },
  };
}

/**
 * @description 更新指定类型的默认配置。
 * @param type 配置类型。
 * @param config 需要合并的配置片段。
 */
export function updateDefaultConfig<T extends keyof FormatterDefaults>(
  type: T,
  config: Partial<FormatterDefaults[T]>,
): void {
  defaultConfigs[type] = {
    ...defaultConfigs[type],
    ...config,
  };
}

/**
 * @description 批量更新多个默认配置。
 * @param configs 各类型的配置片段。
 */
export function updateDefaultConfigs(
  configs: Partial<{ [K in keyof FormatterDefaults]: Partial<FormatterDefaults[K]> }>,
): void {
  for (const key of Object.keys(configs)) {
    if (!isFormatterKey(key)) {
      continue;
    }

    const config = configs[key];
    if (config) {
      updateDefaultConfig(key, config);
    }
  }
}

/**
 * @description 恢复所有默认配置到初始值。
 */
export function resetDefaultConfigs(): void {
  defaultConfigs = cloneDefaults();
}

/**
 * @description 读取单个类型的默认配置。
 * @param type 配置类型。
 */
export function getDefaultConfigForType<T extends keyof FormatterDefaults>(
  type: T,
): FormatterDefaults[T] {
  return { ...defaultConfigs[type] };
}

/**
 * @description 统一的配置管理入口，可读取或批量更新。
 */
export function config(): FormatterDefaults;
export function config(
  configs: Partial<{ [K in keyof FormatterDefaults]: Partial<FormatterDefaults[K]> }>,
): FormatterDefaults;
export function config(
  configs?: Partial<{ [K in keyof FormatterDefaults]: Partial<FormatterDefaults[K]> }>,
): FormatterDefaults {
  if (!configs) {
    return getDefaultConfigs();
  }

  updateDefaultConfigs(configs);
  return getDefaultConfigs();
}

/**
 * @description 合并默认配置、用户参数与强制覆盖项。
 * @param type 默认配置类型。
 * @param userOptions 用户自定义选项。
 * @param forcedOptions 函数内部强制覆盖的选项。
 */
export function mergeOptionsWithDefaults<T extends keyof FormatterDefaults>(
  type: T,
  userOptions: UseDateFormatOptions | undefined,
  forcedOptions: UseDateFormatOptions,
): UseDateFormatOptions {
  const defaults = getDefaultConfigForType(type);

  const merged: UseDateFormatOptions = {
    ...defaults,
    ...userOptions,
    ...forcedOptions,
  };

  const locale = forcedOptions.locale ?? userOptions?.locale ?? defaults.locale ?? 'zh-CN';
  merged.locale = locale;

  return merged;
}
