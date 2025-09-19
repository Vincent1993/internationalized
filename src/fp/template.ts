import type { UseFormatOptions } from '../core/types';
import {
  configureFormatTemplate,
  registerTemplateHandler,
  unregisterTemplateHandler,
  registerPluginTemplateHandlers,
  unregisterPluginTemplateHandlers,
  resetFormatTemplateConfig,
  resolveFormatTemplate,
  setTemplateTypeDefaults,
  type FormatTemplateResolution,
  type TemplateHandler,
  type TemplatePluginHandler,
  type TemplatePluginRegistration,
  type FormatTemplateConfig,
} from '../core/template';
import { getMemoizedFormatter } from './memoize';

export type {
  FormatTemplateResolution,
  TemplateHandler,
  TemplatePluginHandler,
  TemplatePluginRegistration,
  FormatTemplateConfig,
};

export {
  configureFormatTemplate,
  registerTemplateHandler,
  unregisterTemplateHandler,
  registerPluginTemplateHandlers,
  unregisterPluginTemplateHandlers,
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

