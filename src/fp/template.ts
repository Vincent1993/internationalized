import type { UseFormatOptions, UseFormatResult } from '../core/types';
import {
  configureFormatTemplate,
  getFormatTemplateConfig,
  registerTemplateHandler,
  unregisterTemplateHandler,
  resetFormatTemplateConfig,
  resolveFormatTemplate,
  setTemplateTypeDefaults,
  type FormatTemplateResolution,
  type TemplateConfigSnapshot,
  type TemplateHandler,
  type FormatTemplateConfig,
} from '../core/template';
import { getMemoizedFormatter } from './memoize';

export type {
  FormatTemplateResolution,
  TemplateConfigSnapshot,
  TemplateHandler,
  FormatTemplateConfig,
};

export {
  configureFormatTemplate,
  getFormatTemplateConfig,
  registerTemplateHandler,
  unregisterTemplateHandler,
  resetFormatTemplateConfig,
  setTemplateTypeDefaults,
};

export function resolveTemplateOptions(
  template: string,
  overrides?: UseFormatOptions,
): FormatTemplateResolution {
  return resolveFormatTemplate(template, overrides);
}

export function formatWithTemplate(
  template: string,
  value: unknown,
  overrides?: UseFormatOptions,
): string {
  const { options } = resolveFormatTemplate(template, overrides);
  const formatter = getMemoizedFormatter(options);
  return formatter.format(value).formattedValue;
}

export function formatWithTemplateEx(
  template: string,
  value: unknown,
  overrides?: UseFormatOptions,
): UseFormatResult {
  const { options } = resolveFormatTemplate(template, overrides);
  const formatter = getMemoizedFormatter(options);
  return formatter.format(value);
}

