import type { FormatSpecifier } from 'd3-format';
import type { UseFormatOptions } from './types';

export type TemplateHandler = (specifier: FormatSpecifier, type: string) => UseFormatOptions;

export interface TemplatePluginHandler {
  /** 模板类型标识，例如 'P' 或自定义字符 */
  readonly type: string;
  /** 处理指定类型模板的解析逻辑 */
  readonly handler: TemplateHandler;
  /** 可选的类型级默认配置，传入 null 表示清除该类型默认值 */
  readonly defaults?: UseFormatOptions | null;
}

export interface TemplatePluginRegistration {
  /** 插件（或插件组）的唯一名称 */
  readonly plugin: string;
  /** 插件声明的模板处理器集合 */
  readonly handlers: readonly TemplatePluginHandler[];
}
