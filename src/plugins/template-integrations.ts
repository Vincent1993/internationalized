import type { FormatSpecifier } from 'd3-format';
import type { TemplatePluginRegistration, TemplateHandler } from '../core/template-types';
import type { UseFormatOptions } from '../core/types';

interface RuntimeFormatSpecifier extends FormatSpecifier {
  precision?: number;
  trim?: boolean;
}

function readPrecision(specifier: RuntimeFormatSpecifier): number | undefined {
  const { precision } = specifier;
  if (typeof precision === 'number' && Number.isFinite(precision)) {
    return precision;
  }
  if (precision === undefined) {
    return undefined;
  }
  const parsed = Number(precision);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isTrimEnabled(specifier: RuntimeFormatSpecifier): boolean {
  return !!specifier.trim;
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

function createPerMilleTemplateHandler(): TemplateHandler {
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

function createPerMyriadTemplateHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'per-myriad' };
    if (precision !== undefined) {
      options = applyFractionDigits(options, precision, trim);
    }
    return options;
  };
}

function createPercentPointTemplateHandler(): TemplateHandler {
  return (specifier) => {
    const runtime = specifier as RuntimeFormatSpecifier;
    const precision = readPrecision(runtime);
    const trim = isTrimEnabled(runtime);

    let options: UseFormatOptions = { style: 'percent-point' };
    if (precision !== undefined) {
      options = applyFractionDigits(options, precision, trim);
    }
    return options;
  };
}

const perMilleTemplateIntegration: TemplatePluginRegistration = {
  plugin: 'per-mille',
  handlers: [
    {
      type: 'P',
      handler: createPerMilleTemplateHandler(),
    },
  ],
};

const perMyriadTemplateIntegration: TemplatePluginRegistration = {
  plugin: 'per-myriad',
  handlers: [
    {
      type: 'W',
      handler: createPerMyriadTemplateHandler(),
    },
  ],
};

const percentPointTemplateIntegration: TemplatePluginRegistration = {
  plugin: 'percent-point',
  handlers: [
    {
      type: 'Q',
      handler: createPercentPointTemplateHandler(),
    },
  ],
};

export const builtinTemplateIntegrations: readonly TemplatePluginRegistration[] = [
  perMilleTemplateIntegration,
  perMyriadTemplateIntegration,
  percentPointTemplateIntegration,
];
