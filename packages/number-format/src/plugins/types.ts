/**
 * Format 组件插件系统类型定义
 */

export type ExtendedStyle =
  | Intl.NumberFormatOptions['style']
  | 'per-mille'
  | 'per-myriad'
  | 'percentage-point'
  | 'cn-upper';

/**
 * 动态小数位扩展配置
 */
export interface DynamicDecimalControlOptions {
  /** 是否启用该扩展（默认启用） */
  enabled?: boolean;
  /**
   * 在找到第一个非零小数位之前，最多探测的小数位数。
   * 超出该限制后将使用科学计数法。
   */
  maxFractionDigits?: number;
  /**
   * 在定位到第一个非零小数位后，额外保留的小数位数。
   * 用于避免因四舍五入导致的信息损失。
   */
  additionalDigits?: number;
  /**
   * 当超过 maxFractionDigits 限制时采用的记数法，默认为 scientific。
   */
  fallbackNotation?: Extract<Intl.NumberFormatOptions['notation'], 'scientific' | 'engineering'>;
  /**
   * 使用科学计数法时应用的最大小数位数（默认 3 位）。
   */
  fallbackMaximumFractionDigits?: number;
  /**
   * 限定扩展生效的样式集合（默认对 decimal/percent/per-mille/per-myriad/percentage-point 生效）。
   */
  applyToStyles?: ExtendedStyle[];
}

/**
 * 插件执行阶段
 */
export type PluginPhase =
  | 'pre-process' // 格式化：预处理阶段
  | 'format' // 格式化：基础格式化完成后
  | 'post-process' // 格式化：后处理阶段
  | 'pre-parse' // 解析：预处理阶段（输入字符串归一化等）
  | 'post-parse'; // 解析：后处理阶段（结果校正/单位换算等）

/**
 * 输入值的状态类型
 */
export type InputValueState =
  | 'valid'
  | 'null'
  | 'undefined'
  | 'nan'
  | 'infinity'
  | 'negative-infinity';

/**
 * 插件执行上下文
 */
export interface PluginExecutionContext {
  /** 原始输入值 */
  readonly originalValue: unknown;
  /** 当前处理的数值 */
  readonly currentValue: number;
  /** 格式化样式 */
  readonly style?: ExtendedStyle;
  /** 格式化选项 */
  readonly options: Readonly<Intl.NumberFormatOptions>;
  /** 输入值状态 */
  readonly valueState: InputValueState;
  /** 扩展配置（仅供插件读取，与 Intl 原生参数隔离） */
  readonly extend?: Readonly<CoreExtensionOptions>;
}

/**
 * 解析插件执行上下文
 */
export interface ParseExecutionContext {
  /** 原始输入字符串 */
  readonly originalInput: string;
  /** 解析目标样式（与格式化保持一致语义） */
  readonly style?: ExtendedStyle;
  /** 解析相关选项（对齐 Intl 选项的子集） */
  readonly options: Readonly<Intl.NumberFormatOptions> & {
    notation?: Intl.NumberFormatOptions['notation'];
  };
  /** 解析严格模式 */
  readonly strict?: boolean;
}

/**
 * 插件处理器接口
 */
export interface PluginProcessor {
  /**
   * 预处理阶段：处理输入值
   */
  processValue?: (value: number, context: PluginExecutionContext) => number;

  /**
   * 预处理阶段：处理格式化选项
   */
  processOptions?: (
    options: Intl.NumberFormatOptions,
    context?: PluginExecutionContext,
  ) => Intl.NumberFormatOptions;

  /**
   * 格式化/后处理阶段：处理格式化结果
   */
  processResult?: (
    formatted: string,
    parts: Intl.NumberFormatPart[],
    context?: PluginExecutionContext,
  ) => {
    formattedValue: string;
    parts: Intl.NumberFormatPart[];
  };

  /**
   * 解析阶段：预处理输入字符串
   */
  processParseInput?: (input: string, context?: ParseExecutionContext) => string;

  /**
   * 解析阶段：后处理解析结果
   */
  processParseResult?: (
    result: { value: number; success: boolean; input: string; error: string | null },
    context?: ParseExecutionContext,
  ) => { value: number; success: boolean; input: string; error: string | null };
}

/**
 * 格式化插件接口
 */
export interface FormatPlugin extends PluginProcessor {
  /**
   * 插件名称（唯一标识）
   */
  readonly name: string;

  /**
   * 插件版本
   */
  readonly version?: string;

  /**
   * 插件描述
   */
  readonly description?: string;

  /**
   * 插件执行优先级（数值越小优先级越高，默认 500）
   */
  readonly priority?: number;

  /**
   * 插件执行阶段（默认 'format'）
   */
  readonly phase?: PluginPhase;

  /**
   * 判断插件是否应该被应用
   *
   * @param context - 执行上下文
   * @returns 是否应用该插件
   */
  isApplicable(context: PluginExecutionContext | ParseExecutionContext): boolean;
}

/**
 * 插件注册表中的记录单元。
 */
export interface PluginRegistration {
  /** 插件的唯一名称。 */
  name: string;
  /** 插件所属的组名（可选）。 */
  group?: string;
  /** 插件对象本身。 */
  plugin: FormatPlugin;
  /** 插件是否启用。 */
  enabled: boolean;
  /** 插件的注册时间。 */
  registeredAt: Date;
}

/**
 * 定义了一个插件组，用于将多个协同工作的插件作为一个逻辑单元进行管理。
 */
export interface PluginGroup {
  /** 插件组的唯一名称。 */
  name: string;
  /** 该组包含的插件列表。 */
  plugins: FormatPlugin[];
}

/**
 * 基础格式化函数类型
 */
export type BaseFormatter = (
  value: number,
  options: Intl.NumberFormatOptions,
) => {
  formattedValue: string;
  parts: Intl.NumberFormatPart[];
};

/**
 * 内置扩展能力（与 Intl 参数解耦）
 */
export interface CoreExtensionOptions {
  /** 是否启用扩展版的符号显示逻辑（优先于 legacy includeSign） */
  extend_includeSign?: boolean;
  /** 零值的符号显示策略 */
  extend_signZeroMode?: 'auto' | 'always';
  /** 负零值处理策略 */
  extend_negativeZero?: 'as-zero' | 'keep';
  /** 固定小数位数（自动设置 minimumFractionDigits 和 maximumFractionDigits 为相同值） */
  extend_fixDecimals?: number;
  /** 根据数值动态扩展小数位 */
  extend_dynamicDecimals?: DynamicDecimalControlOptions;
}
