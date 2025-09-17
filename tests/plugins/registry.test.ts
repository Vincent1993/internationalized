/**
 * @file 插件注册表测试
 * @description 验证 PluginRegistry 类的核心功能，包括插件的注册、注销、状态切换和查询。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPluginRegistry, clearRegisteredPlugins, resetPlugins } from '../../src/plugins/registry';
import type { FormatPlugin, PluginGroup, PluginExecutionContext } from '../../src/plugins/types';

// 创建一个模拟插件
const createMockPlugin = (name: string, priority: number, phase: 'pre-process' | 'format' | 'post-process'): FormatPlugin => ({
  name,
  priority,
  phase,
  version: '1.0.0',
  description: `模拟插件 ${name}`,
  isApplicable: () => true,
});

const mockPluginA: FormatPlugin = createMockPlugin('plugin-a', 100, 'pre-process');
const mockPluginB: FormatPlugin = createMockPlugin('plugin-b', 200, 'pre-process');
const mockPluginC: FormatPlugin = createMockPlugin('plugin-c', 150, 'format');

const mockGroup: PluginGroup = {
  name: 'mock-group',
  plugins: [createMockPlugin('group-plugin-1', 300, 'post-process'), createMockPlugin('group-plugin-2', 400, 'post-process')],
};

describe('插件注册表 (PluginRegistry)', () => {
  let registry: ReturnType<typeof getPluginRegistry>;

  beforeEach(() => {
    // 在每个测试前重置插件，避免互相影响
    clearRegisteredPlugins();
    registry = getPluginRegistry();
    resetPlugins([mockPluginA, mockPluginB, mockPluginC]);
  });

  describe('插件注册与注销', () => {
    it('应能成功注册和获取插件信息', () => {
      const allPlugins = registry.getAllPlugins();
      expect(allPlugins).toHaveLength(3);

      const pluginAInfo = registry.getPlugin('plugin-a');
      expect(pluginAInfo).toBeDefined();
      expect(pluginAInfo?.plugin.name).toBe('plugin-a');
    });

    it('当注册同名插件时应发出警告并阻止注册', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const newPluginA: FormatPlugin = { ...mockPluginA, version: '2.0.0' };

      registry.register(newPluginA);

      expect(consoleWarnSpy).toHaveBeenCalledWith("Plugin 'plugin-a' is already registered. Registration failed.");
      expect(registry.getPlugin('plugin-a')?.plugin.version).toBe('1.0.0'); // 验证插件未被覆盖
      expect(registry.getAllPlugins()).toHaveLength(3);

      consoleWarnSpy.mockRestore();
    });

    it('应能成功注销插件', () => {
      const unregisterResult = registry.unregister('plugin-b');
      expect(unregisterResult).toBe(true);
      expect(registry.getPlugin('plugin-b')).toBeUndefined();
      expect(registry.getAllPlugins()).toHaveLength(2);
    });

    it('当注销不存在的插件时应返回 false', () => {
      const unregisterResult = registry.unregister('non-existent-plugin');
      expect(unregisterResult).toBe(false);
    });
  });

  describe('插件状态管理', () => {
    it('应能禁用一个插件', () => {
      registry.setPluginEnabled('plugin-a', false);
      const pluginAInfo = registry.getPlugin('plugin-a');
      expect(pluginAInfo?.enabled).toBe(false);
    });

    it('被禁用的插件不应出现在 getPluginsForPhase 的结果中', () => {
      const dummyContext = {} as PluginExecutionContext;
      let preProcessPlugins = registry.getPluginsForPhase('pre-process', dummyContext);
      expect(preProcessPlugins).toHaveLength(2);

      registry.setPluginEnabled('plugin-a', false);

      preProcessPlugins = registry.getPluginsForPhase('pre-process', dummyContext);
      expect(preProcessPlugins).toHaveLength(1);
      expect(preProcessPlugins[0].name).toBe('plugin-b');
    });
  });

  describe('插件组管理', () => {
    beforeEach(() => {
      registry.registerGroup(mockGroup);
    });

    it('应能成功注册和注销一个插件组', () => {
      expect(registry.getAllPlugins()).toHaveLength(5);
      expect(registry.getPlugin('group-plugin-1')?.group).toBe('mock-group');

      const unregisterResult = registry.unregisterGroup('mock-group');
      expect(unregisterResult).toBe(true);
      expect(registry.getAllPlugins()).toHaveLength(3);
      expect(registry.getPlugin('group-plugin-1')).toBeUndefined();
    });

    it('应能禁用和启用整个插件组', () => {
      registry.setGroupEnabled('mock-group', false);
      expect(registry.getPlugin('group-plugin-1')?.enabled).toBe(false);
      expect(registry.getPlugin('group-plugin-2')?.enabled).toBe(false);

      registry.setGroupEnabled('mock-group', true);
      expect(registry.getPlugin('group-plugin-1')?.enabled).toBe(true);
      expect(registry.getPlugin('group-plugin-2')?.enabled).toBe(true);
    });

    it('当禁用插件组时，其下的插件不应出现在 getPluginsForPhase 的结果中', () => {
      const dummyContext = {} as PluginExecutionContext;
      let postProcessPlugins = registry.getPluginsForPhase('post-process', dummyContext);
      expect(postProcessPlugins).toHaveLength(2);

      registry.setGroupEnabled('mock-group', false);

      postProcessPlugins = registry.getPluginsForPhase('post-process', dummyContext);
      expect(postProcessPlugins).toHaveLength(0);
    });

    it('当尝试禁用不存在的插件组时应返回 false', () => {
      const result = registry.setGroupEnabled('non-existent-group', false);
      expect(result).toBe(false);
    });

    it('当尝试禁用不存在的插件时应返回 false', () => {
      const result = registry.setPluginEnabled('non-existent-plugin', false);
      expect(result).toBe(false);
    });
  });

  describe('插件查询与排序', () => {
    it('getPluginsForPhase 应只返回特定阶段的插件', () => {
      const dummyContext = {} as PluginExecutionContext;
      const preProcessPlugins = registry.getPluginsForPhase('pre-process', dummyContext);
      const formatPlugins = registry.getPluginsForPhase('format', dummyContext);
      const postProcessPlugins = registry.getPluginsForPhase('post-process', dummyContext);

      expect(preProcessPlugins.map((p) => p.name)).toEqual(['plugin-a', 'plugin-b']);
      expect(formatPlugins.map((p) => p.name)).toEqual(['plugin-c']);
      expect(postProcessPlugins).toHaveLength(0);
    });

    it('getPluginsForPhase 返回的插件应按优先级正确排序', () => {
      const dummyContext = {} as PluginExecutionContext;
      const preProcessPlugins = registry.getPluginsForPhase('pre-process', dummyContext);

      // plugin-a (100) 应该在 plugin-b (200) 之前
      expect(preProcessPlugins.map((p) => p.name)).toEqual(['plugin-a', 'plugin-b']);
    });

    it('isApplicable 为 false 的插件应被过滤掉', () => {
      const contextV1 = { version: 1 } as any;
      const contextV2 = { version: 2 } as any;

      const conditionalPlugin: FormatPlugin = {
        name: 'conditional',
        version: '1.0.0',
        description: '',
        isApplicable: (ctx) => ctx.version === 2,
        phase: 'format',
      };

      registry.register(conditionalPlugin);

      const pluginsForV1 = registry.getPluginsForPhase('format', contextV1);
      expect(pluginsForV1.map((p) => p.name)).not.toContain('conditional');

      const pluginsForV2 = registry.getPluginsForPhase('format', contextV2);
      expect(pluginsForV2.map((p) => p.name)).toContain('conditional');
    });
  });
});
