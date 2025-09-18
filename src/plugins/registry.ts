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
import { fallbackPlugin } from './fallback';
import { validatorPlugin } from './validator';
import { fixDecimalsPlugin } from './fix-decimals';

class PluginRegistry {
  private readonly registrations = new Map<string, PluginRegistration>();

  private readonly phasePluginCache = new Map<PluginPhase, FormatPlugin[]>();

  constructor() {
    this.register(validatorPlugin);
    this.registerGroup(perMillePluginGroup);
    this.register(fallbackPlugin);
    this.register(fixDecimalsPlugin);
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

/** @internal */
export function registerPlugin(plugin: FormatPlugin): void {
  pluginRegistry.register(plugin);
}
/** @internal */
export function registerGroup(pluginGroup: PluginGroup): void {
  pluginRegistry.registerGroup(pluginGroup);
}
/** @internal */
export function unregisterPlugin(pluginName: string): boolean {
  return pluginRegistry.unregister(pluginName);
}
/** @internal */
export function unregisterGroup(groupName: string): boolean {
  return pluginRegistry.unregisterGroup(groupName);
}

export function setPluginEnabled(pluginName: string, enabled: boolean): boolean {
  /** @internal */
  return pluginRegistry.setPluginEnabled(pluginName, enabled);
}
/** @internal */
export function setGroupEnabled(groupName: string, enabled: boolean): boolean {
  return pluginRegistry.setGroupEnabled(groupName, enabled);
}
/** @internal */
export function getRegisteredPlugins(): readonly PluginRegistration[] {
  return pluginRegistry.getAllPlugins();
}
/** @internal */
export function getPluginInfo(name: string): PluginRegistration | undefined {
  return pluginRegistry.getPlugin(name);
}
/** @internal */
export function getPluginRegistry(): PluginRegistry {
  return pluginRegistry;
}
/** @internal */
export function clearRegisteredPlugins(): void {
  pluginRegistry.clear();
}

/** @internal */
function isPluginGroup(candidate: FormatPlugin | PluginGroup): candidate is PluginGroup {
  return typeof candidate === 'object' && candidate !== null && 'plugins' in candidate;
}

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
