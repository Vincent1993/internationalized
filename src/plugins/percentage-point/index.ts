/**
 * @file 百分点（Percentage point, pp）插件组
 * @description 通过插件组合实现百分点格式化与解析能力。
 */

import { RATIO_PLUGIN_CONFIGS } from '../shared/constants';
import { createRatioPluginGroup } from '../shared/ratio-plugin';

export const percentagePointPluginGroup = createRatioPluginGroup(
  RATIO_PLUGIN_CONFIGS.percentagePoint,
);
