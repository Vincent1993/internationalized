/**
 * @file 插件注册表 (v3 - 支持插件组)
 * @description
 *   负责管理插件的生命周期，包括单个插件和插件组的注册、注销、状态管理和查询。
 */

import type {
  FormatPlugin,
  PluginRegistration,
  PluginPhase,
  PluginExecutionContext,
  ParseExecutionContext,
  PluginGroup,
} from './types';
import { perMillePluginGroup } from './per-mille';
import { perMyriadPluginGroup } from './per-myriad';
import { percentagePointPluginGroup } from './percentage-point';
import { chineseUppercasePluginGroup } from './chinese-uppercase';
import { fallbackPlugin } from './fallback';
import { validatorPlugin } from './validator';
import { fixDecimalsPlugin } from './fix-decimals';
import { dynamicDecimalPrecisionPlugin } from './dynamic-decimals';

class PluginRegistry {
  private readonly registrations = new Map<string, PluginRegistration>();

  private readonly phasePluginCache = new Map<PluginPhase, FormatPlugin[]>();

  constructor() {
    this.register(validatorPlugin);
    this.registerGroup(perMillePluginGroup);
    this.registerGroup(perMyriadPluginGroup);
    this.registerGroup(percentagePointPluginGroup);
    this.registerGroup(chineseUppercasePluginGroup);
    this.register(fallbackPlugin);
    this.register(fixDecimalsPlugin);
    this.register(dynamicDecimalPrecisionPlugin);
  }

  /** 注册一个独立的插件。 */
  register(plugin: FormatPlugin, group?: string): void {
    if (this.registrations.has(plugin.name)) {
      console.warn(`Plugin '${plugin.name}' is already registered. Registration failed.`);
      return;
    }
    this.registrations.set(plugin.name, {
      name: plugin.name,
      plugin,
      group,
      enabled: true,
      registeredAt: new Date(),
    });
    this.invalidateCache();
  }

  /** 注册一个插件组。 */
  registerGroup(pluginGroup: PluginGroup): void {
    pluginGroup.plugins.forEach((plugin) => {
      this.register(plugin, pluginGroup.name);
    });
  }

  /** 根据名称注销一个插件。 */
  unregister(pluginName: string): boolean {
    const registration = this.registrations.get(pluginName);
    if (!registration) return false;

    this.registrations.delete(pluginName);
    this.invalidateCache();
    return true;
  }

  /** 注销一整个插件组。 */
  unregisterGroup(groupName: string): boolean {
    let unregistered = false;
    this.registrations.forEach((reg, name) => {
      if (reg.group === groupName) {
        this.registrations.delete(name);
        unregistered = true;
      }
    });
    if (unregistered) this.invalidateCache();
    return unregistered;
  }

  /** 启用或禁用一个插件。 */
  setPluginEnabled(pluginName: string, enabled: boolean): boolean {
    const registration = this.registrations.get(pluginName);
    if (!registration) return false;

    if (registration.enabled !== enabled) {
      registration.enabled = enabled;
      this.invalidateCache();
    }
    return true;
  }

  /** 启用或禁用一整个插件组。 */
  setGroupEnabled(groupName: string, enabled: boolean): boolean {
    let updated = false;
    this.registrations.forEach((reg) => {
      if (reg.group === groupName && reg.enabled !== enabled) {
        reg.enabled = enabled;
        updated = true;
      }
    });
    if (updated) this.invalidateCache();
    return updated;
  }

  /** 获取指定阶段的所有适用插件。 */
  getPluginsForPhase(
    phase: PluginPhase,
    context: PluginExecutionContext | ParseExecutionContext,
  ): FormatPlugin[] {
    let phasePlugins = this.phasePluginCache.get(phase);
    if (!phasePlugins) {
      phasePlugins = this.buildPhasePluginCache(phase);
      this.phasePluginCache.set(phase, phasePlugins);
    }
    return phasePlugins.filter((plugin) => plugin.isApplicable(context));
  }

  /** 获取所有已注册的插件的详细信息。 */
  getAllPlugins(): readonly PluginRegistration[] {
    return Array.from(this.registrations.values());
  }

  /** 获取单个插件的详细信息。 */
  getPlugin(name: string): PluginRegistration | undefined {
    return this.registrations.get(name);
  }

  /** (仅用于测试) 清除所有已注册的插件。 */
  clear(): void {
    this.registrations.clear();
    this.invalidateCache();
  }

  private buildPhasePluginCache(phase: PluginPhase): FormatPlugin[] {
    const plugins = Array.from(this.registrations.values())
      .filter((reg) => reg.enabled && (reg.plugin.phase || 'format') === phase)
      .map((reg) => reg.plugin);

    // eslint-disable-next-line du/no-bnary-operation
    return plugins.sort((a, b) => (a.priority || 500) - (b.priority || 500));
  }

  private invalidateCache(): void {
    this.phasePluginCache.clear();
  }
}

const pluginRegistry = new PluginRegistry();

// ==================== 测试 API ====================

/**
 * @name registerPlugin
 * @description 注册单个格式化插件，立即生效。适用于在初始化阶段注入自定义逻辑。
 *
 * @since 0.0.1
 *
 * @param plugin - 实现 `FormatPlugin` 接口的插件对象
 *
 * @example
 * ```ts
 * import { registerPlugin } from '@internationalized/number-format/plugins';
 *
 * registerPlugin({
 *   name: 'double-value',
 *   processValue(value) {
 *     return value * 2;
 *   },
 * });
 * ```
 */
export function registerPlugin(plugin: FormatPlugin): void {
  pluginRegistry.register(plugin);
}
/**
 * @name registerGroup
 * @description 注册一组插件，常用于批量启用多阶段处理逻辑。
 *
 * @since 0.0.1
 *
 * @param pluginGroup - 包含多个插件的分组定义
 */
export function registerGroup(pluginGroup: PluginGroup): void {
  pluginRegistry.registerGroup(pluginGroup);
}
/**
 * @name unregisterPlugin
 * @description 根据名称移除已注册的插件。
 *
 * @since 0.0.1
 *
 * @param pluginName - 插件名称
 * @returns 是否成功移除
 */
export function unregisterPlugin(pluginName: string): boolean {
  return pluginRegistry.unregister(pluginName);
}
/**
 * @name unregisterGroup
 * @description 根据名称移除已注册的插件分组。
 *
 * @since 0.0.1
 *
 * @param groupName - 分组名称
 * @returns 是否成功移除
 */
export function unregisterGroup(groupName: string): boolean {
  return pluginRegistry.unregisterGroup(groupName);
}

/**
 * @name setPluginEnabled
 * @description 控制单个插件的启用状态。
 *
 * @since 0.0.1
 *
 * @param pluginName - 插件名称
 * @param enabled - 是否启用
 * @returns 是否存在对应插件
 */
export function setPluginEnabled(pluginName: string, enabled: boolean): boolean {
  return pluginRegistry.setPluginEnabled(pluginName, enabled);
}
/**
 * @name setGroupEnabled
 * @description 启用或禁用指定插件分组，常用于灰度或实验场景。
 *
 * @since 0.0.1
 *
 * @param groupName - 分组名称
 * @param enabled - 是否启用
 * @returns 是否存在对应分组
 */
export function setGroupEnabled(groupName: string, enabled: boolean): boolean {
  return pluginRegistry.setGroupEnabled(groupName, enabled);
}
/**
 * @name getRegisteredPlugins
 * @description 获取当前注册的插件清单，方便调试或在 DevTools 中展示。
 *
 * @since 0.0.1
 *
 * @returns 插件注册信息数组
 */
export function getRegisteredPlugins(): readonly PluginRegistration[] {
  return pluginRegistry.getAllPlugins();
}
/**
 * @name getPluginInfo
 * @description 根据名称读取插件信息。
 *
 * @since 0.0.1
 *
 * @param name - 插件名称
 * @returns 对应的插件注册信息
 */
export function getPluginInfo(name: string): PluginRegistration | undefined {
  return pluginRegistry.getPlugin(name);
}
/**
 * @name getPluginRegistry
 * @description 暴露底层插件注册表实例，便于高级场景进行直接操作。
 *
 * @since 0.0.1
 *
 * @returns 单例插件注册表
 */
export function getPluginRegistry(): PluginRegistry {
  return pluginRegistry;
}
/**
 * @name clearRegisteredPlugins
 * @description 清空所有已注册插件，常用于测试环境。
 *
 * @since 0.0.1
 */
export function clearRegisteredPlugins(): void {
  pluginRegistry.clear();
}

/** @internal */
function isPluginGroup(candidate: FormatPlugin | PluginGroup): candidate is PluginGroup {
  return typeof candidate === 'object' && candidate !== null && 'plugins' in candidate;
}

/**
 * @name resetPlugins
 * @description 重置插件系统为指定集合，并保留核心扩展。
 *
 * @since 0.0.1
 *
 * @param plugins - 需要注册的插件或插件组集合
 */
export function resetPlugins(plugins: (FormatPlugin | PluginGroup)[]): void {
  pluginRegistry.clear();
  // 始终保留核心扩展能力，保证 includeSign/negative-zero 等兼容特性可用
  pluginRegistry.registerGroup({ name: 'core-extensions', plugins: [] });
  plugins.forEach((p) => {
    if (isPluginGroup(p)) {
      pluginRegistry.registerGroup(p);
    } else {
      pluginRegistry.register(p);
    }
  });
}

// ==================== 类型导出 ====================

export { PluginRegistry };
export type {
  FormatPlugin,
  PluginRegistration,
  PluginExecutionContext,
  PluginPhase,
  PluginProcessor,
  PluginGroup,
} from './types';
