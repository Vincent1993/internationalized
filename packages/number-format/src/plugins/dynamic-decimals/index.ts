import Big from 'big.js';
import type {
  ExtendedStyle,
  FormatPlugin,
  ParseExecutionContext,
  PluginExecutionContext,
} from '../types';

const DEFAULT_MAX_FRACTION_DIGITS = 12;
const MAX_PROBE_LIMIT = 100;
const DEFAULT_SUPPORTED_STYLES: ReadonlySet<ExtendedStyle> = new Set([
  'decimal',
  'percent',
  'per-mille',
  'per-myriad',
  'percentage-point',
]);

function isFormatContext(
  context: PluginExecutionContext | ParseExecutionContext,
): context is PluginExecutionContext {
  return 'currentValue' in context;
}

function shouldApplyDynamicDecimals(context: PluginExecutionContext): boolean {
  const extendConfig = context.extend?.extend_dynamicDecimals;

  if (!extendConfig || extendConfig.enabled === false) {
    return false;
  }

  if (context.extend?.extend_fixDecimals !== undefined) {
    return false;
  }

  if (!Number.isFinite(context.currentValue)) {
    return false;
  }

  if (context.valueState !== 'valid') {
    return false;
  }

  const absValue = Math.abs(context.currentValue);
  if (absValue === 0 || absValue >= 1) {
    return false;
  }

  if (
    context.options.maximumSignificantDigits !== undefined ||
    context.options.minimumSignificantDigits !== undefined
  ) {
    return false;
  }

  if (context.options.notation && context.options.notation !== 'standard') {
    return false;
  }

  const configuredStyles = extendConfig.applyToStyles;
  const normalizedStyle = (context.style ?? 'decimal') as ExtendedStyle;

  if (configuredStyles && configuredStyles.length > 0) {
    return configuredStyles.includes(normalizedStyle);
  }

  return DEFAULT_SUPPORTED_STYLES.has(normalizedStyle);
}

function countDigitsUntilFirstNonZero(value: number, maxDigits: number): {
  digits: number;
  exceeded: boolean;
} {
  const limit = Math.max(1, Math.min(Math.floor(maxDigits), MAX_PROBE_LIMIT));
  let scaled = new Big(Math.abs(value));

  if (scaled.eq(0)) {
    return { digits: 0, exceeded: false };
  }

  let digits = 0;
  while (scaled.lt(1) && digits < limit) {
    scaled = scaled.mul(10);
    digits += 1;
  }

  if (scaled.lt(1)) {
    return { digits: limit, exceeded: true };
  }

  return { digits, exceeded: false };
}

export const dynamicDecimalPrecisionPlugin: FormatPlugin = {
  name: 'dynamic-decimal-precision',
  version: '1.0.0',
  description: '根据最小非零位动态扩展小数位，在超出阈值时回退到科学记数法。',
  phase: 'pre-process',
  priority: 120,
  isApplicable: (context) => isFormatContext(context) && shouldApplyDynamicDecimals(context),
  processOptions: (options, context) => {
    if (!isFormatContext(context)) {
      return options;
    }

    const extendConfig = context.extend?.extend_dynamicDecimals;
    if (!extendConfig) {
      return options;
    }

    const maxFractionDigits =
      typeof extendConfig.maxFractionDigits === 'number' && !Number.isNaN(extendConfig.maxFractionDigits)
        ? Math.max(1, Math.floor(extendConfig.maxFractionDigits))
        : DEFAULT_MAX_FRACTION_DIGITS;

    const { digits, exceeded } = countDigitsUntilFirstNonZero(
      context.currentValue,
      maxFractionDigits,
    );

    if (digits === 0 && !exceeded) {
      return options;
    }

    if (exceeded) {
      const fallbackNotation = extendConfig.fallbackNotation ?? 'scientific';
      const fallbackMaxFractionDigits =
        typeof extendConfig.fallbackMaximumFractionDigits === 'number' &&
        !Number.isNaN(extendConfig.fallbackMaximumFractionDigits)
          ? Math.max(0, Math.floor(extendConfig.fallbackMaximumFractionDigits))
          : typeof options.maximumFractionDigits === 'number'
            ? options.maximumFractionDigits
            : 3;

      const nextOptions: Intl.NumberFormatOptions = {
        ...options,
        notation: fallbackNotation,
      };

      if (fallbackMaxFractionDigits !== undefined) {
        nextOptions.maximumFractionDigits = fallbackMaxFractionDigits;
        if (
          typeof options.minimumFractionDigits === 'number' &&
          options.minimumFractionDigits > fallbackMaxFractionDigits
        ) {
          nextOptions.minimumFractionDigits = fallbackMaxFractionDigits;
        }
      }

      return nextOptions;
    }

    const additionalDigits = Math.max(0, Math.floor(extendConfig.additionalDigits ?? 0));
    const requiredDigits = Math.min(digits + additionalDigits, maxFractionDigits);
    const existingMin =
      typeof options.minimumFractionDigits === 'number' ? options.minimumFractionDigits : undefined;

    const existingMax =
      typeof options.maximumFractionDigits === 'number' ? options.maximumFractionDigits : undefined;

    const candidateMax =
      existingMax !== undefined ? Math.max(existingMax, requiredDigits) : requiredDigits;
    const newMax = Math.max(candidateMax, existingMin ?? candidateMax);
    const minRequirement = Math.min(digits, newMax);
    const newMin = existingMin !== undefined ? Math.max(existingMin, minRequirement) : minRequirement;

    if (newMax === existingMax && newMin === existingMin) {
      return options;
    }

    const nextOptions: Intl.NumberFormatOptions = { ...options };

    if (newMax !== existingMax) {
      nextOptions.maximumFractionDigits = newMax;
    }

    if (newMin !== existingMin) {
      nextOptions.minimumFractionDigits = newMin;
    }

    return nextOptions;
  },
};
