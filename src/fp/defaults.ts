import type { UseFormatOptions } from '../core/types';

/**
 * 不同格式化类型的默认配置选项
 */
export interface FormatterDefaults {
  /** 十进制数字默认配置 */
  decimal: UseFormatOptions;
  /** 整数默认配置 */
  integer: UseFormatOptions;
  /** 货币默认配置 */
  currency: UseFormatOptions;
  /** 百分比默认配置 */
  percent: UseFormatOptions;
  /** 千分比默认配置 */
  perMille: UseFormatOptions;
  /** 紧凑格式默认配置 */
  compact: UseFormatOptions;
  /** 科学记数法默认配置 */
  scientific: UseFormatOptions;
}

/**
 * 默认配置项 - 可以被全局修改
 */
let defaultConfigs: FormatterDefaults = {
  decimal: {
    style: 'decimal',
  },
  integer: {
    style: 'decimal',
    maximumFractionDigits: 0,
  },
  currency: {
    style: 'currency',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  percent: {
    style: 'percent',
    maximumFractionDigits: 2,
  },
  perMille: {
    style: 'per-mille',
    maximumFractionDigits: 2,
  },
  compact: {
    style: 'decimal',
    notation: 'compact',
    maximumFractionDigits: 1,
  },
  scientific: {
    style: 'decimal',
    notation: 'scientific',
    maximumFractionDigits: 3,
  },
};

/**
 * 获取当前的默认配置
 * @returns 当前的默认配置对象的深拷贝
 */
export function getDefaultConfigs(): FormatterDefaults {
  return JSON.parse(JSON.stringify(defaultConfigs));
}

/**
 * 更新指定类型的默认配置
 * @param type 格式化类型
 * @param config 新的配置选项（会与现有配置合并）
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
 * 批量更新多个类型的默认配置
 * @param configs 配置对象，键为格式化类型，值为新的配置选项
 */
export function updateDefaultConfigs(
  configs: Partial<{ [K in keyof FormatterDefaults]: Partial<FormatterDefaults[K]> }>,
): void {
  Object.entries(configs).forEach(([type, config]) => {
    if (config && type in defaultConfigs) {
      updateDefaultConfig(type as keyof FormatterDefaults, config);
    }
  });
}

/**
 * 重置所有默认配置为初始值
 */
export function resetDefaultConfigs(): void {
  defaultConfigs = {
    decimal: {
      style: 'decimal',
    },
    integer: {
      style: 'decimal',
      maximumFractionDigits: 0,
    },
    currency: {
      style: 'currency',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      maximumFractionDigits: 2,
    },
    perMille: {
      style: 'per-mille',
      maximumFractionDigits: 2,
    },
    compact: {
      style: 'decimal',
      notation: 'compact',
      maximumFractionDigits: 1,
    },
    scientific: {
      style: 'decimal',
      notation: 'scientific',
      maximumFractionDigits: 3,
    },
  };
}

/**
 * 获取指定类型的默认配置
 * @param type 格式化类型
 * @returns 该类型的默认配置
 * @internal
 */
export function getDefaultConfigForType<T extends keyof FormatterDefaults>(
  type: T,
): FormatterDefaults[T] {
  return { ...defaultConfigs[type] };
}

/**
 * 统一的配置管理函数
 * @param configs 要更新的配置，如果不传参数则返回当前配置
 * @returns 当前配置或更新后的配置
 */
export function config(): FormatterDefaults;
export function config(
  configs: Partial<{ [K in keyof FormatterDefaults]: Partial<FormatterDefaults[K]> }>,
): FormatterDefaults;
export function config(
  configs?: Partial<{ [K in keyof FormatterDefaults]: Partial<FormatterDefaults[K]> }>,
): FormatterDefaults {
  if (configs === undefined) {
    // 获取当前配置
    return getDefaultConfigs();
  }

  // 更新配置
  updateDefaultConfigs(configs);
  return getDefaultConfigs();
}

/**
 * 合并用户选项和默认配置
 * 优先级：强制选项 > 用户选项 > 默认配置
 * @param type 格式化类型
 * @param userOptions 用户提供的选项
 * @param forcedOptions 强制覆盖的选项
 * @returns 合并后的最终选项
 * @internal
 */
export function mergeOptionsWithDefaults<T extends keyof FormatterDefaults>(
  type: T,
  userOptions: UseFormatOptions | undefined,
  forcedOptions: UseFormatOptions,
): UseFormatOptions {
  const defaultConfig = getDefaultConfigForType(type);
  return {
    ...defaultConfig,
    ...userOptions,
    ...forcedOptions,
  };
}
