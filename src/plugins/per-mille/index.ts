/**
 * @file 千分比（Per-mille）功能插件组
 * @description 通过一个插件组来统一管理千分比功能的两个核心插件。
 */

import { RATIO_PLUGIN_CONFIGS } from '../shared/constants';
import { createRatioPluginGroup } from '../shared/ratio-plugin';

export const perMillePluginGroup = createRatioPluginGroup(RATIO_PLUGIN_CONFIGS.perMille);
