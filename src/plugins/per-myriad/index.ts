/**
 * @file 万分比（Per-myriad/Basis point）插件组
 * @description 通过插件组合实现万分比格式化与解析能力。
 */

import { RATIO_PLUGIN_CONFIGS } from '../shared/constants';
import { createRatioPluginGroup } from '../shared/ratio-plugin';

export const perMyriadPluginGroup = createRatioPluginGroup(RATIO_PLUGIN_CONFIGS.perMyriad);
