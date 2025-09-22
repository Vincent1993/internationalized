import type { ExtendedStyle } from '../types';

export const STYLE_PER_MILLE = 'per-mille' as const satisfies ExtendedStyle;
export const STYLE_PER_MYRIAD = 'per-myriad' as const satisfies ExtendedStyle;
export const STYLE_PERCENTAGE_POINT = 'percentage-point' as const satisfies ExtendedStyle;

export const RATIO_MULTIPLIERS = {
  perMille: 1000,
  perMyriad: 10000,
  percentagePoint: 100,
} as const;

export const RATIO_SYMBOLS = {
  perMille: '‰',
  perMyriad: '‱',
  percentagePoint: 'pp',
} as const;

export const RATIO_SUFFIX_PATTERNS: Readonly<{
  perMille: RegExp;
  perMyriad: RegExp;
  percentagePoint: RegExp;
}> = {
  perMille: /‰$/u,
  perMyriad: /‱$/u,
  percentagePoint: /pp$/iu,
};

export const RATIO_STRICT_ERROR_MESSAGES = {
  perMille: 'Per-mille symbol (‰) is required',
  perMyriad: 'Per-myriad symbol (‱) is required',
  percentagePoint: 'Percentage point suffix (pp) is required',
} as const;

export const RATIO_PARSE_ERROR_PREFIX = '__ratio-plugin-error__:';

export interface RatioPluginConfig {
  readonly style: ExtendedStyle;
  readonly symbol: string;
  readonly multiplier: number;
  readonly suffixPattern: RegExp;
  readonly strictErrorMessage: string;
  readonly valueDescription: string;
  readonly symbolDescription: string;
}

export const RATIO_PLUGIN_CONFIGS: Readonly<{
  perMille: RatioPluginConfig;
  perMyriad: RatioPluginConfig;
  percentagePoint: RatioPluginConfig;
}> = {
  perMille: {
    style: STYLE_PER_MILLE,
    symbol: RATIO_SYMBOLS.perMille,
    multiplier: RATIO_MULTIPLIERS.perMille,
    suffixPattern: RATIO_SUFFIX_PATTERNS.perMille,
    strictErrorMessage: RATIO_STRICT_ERROR_MESSAGES.perMille,
    valueDescription: '处理千分比的值和选项（格式化与解析）',
    symbolDescription: '为千分比结果添加“‰”符号',
  },
  perMyriad: {
    style: STYLE_PER_MYRIAD,
    symbol: RATIO_SYMBOLS.perMyriad,
    multiplier: RATIO_MULTIPLIERS.perMyriad,
    suffixPattern: RATIO_SUFFIX_PATTERNS.perMyriad,
    strictErrorMessage: RATIO_STRICT_ERROR_MESSAGES.perMyriad,
    valueDescription: '处理万分比的值和选项（格式化与解析）',
    symbolDescription: '为万分比结果追加“‱”符号',
  },
  percentagePoint: {
    style: STYLE_PERCENTAGE_POINT,
    symbol: RATIO_SYMBOLS.percentagePoint,
    multiplier: RATIO_MULTIPLIERS.percentagePoint,
    suffixPattern: RATIO_SUFFIX_PATTERNS.percentagePoint,
    strictErrorMessage: RATIO_STRICT_ERROR_MESSAGES.percentagePoint,
    valueDescription: '处理百分点格式的值、选项与解析',
    symbolDescription: '为百分点结果追加"pp"后缀',
  },
};
