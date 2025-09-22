import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearCache,
  clearFormatterCache,
  clearParserCache,
  getMemoizedFormatter,
  getMemoizedParser,
  getFPCacheStats,
} from '../../src/fp/memoize';

describe('FP 缓存状态管理', () => {
  beforeEach(() => {
    clearCache();
  });

  it('应该正确统计和清理缓存', () => {
    const initial = getFPCacheStats();
    expect(initial.formatter.size).toBe(0);
    expect(initial.parser.size).toBe(0);

    getMemoizedFormatter({ style: 'currency', currency: 'USD' });
    getMemoizedParser({ style: 'currency', currency: 'USD' });

    const populated = getFPCacheStats();
    expect(populated.formatter.size).toBeGreaterThanOrEqual(1);
    expect(populated.parser.size).toBeGreaterThanOrEqual(1);

    clearFormatterCache();
    const formatterCleared = getFPCacheStats();
    expect(formatterCleared.formatter.size).toBe(0);
    expect(formatterCleared.parser.size).toBeGreaterThanOrEqual(1);

    clearParserCache();
    const parserCleared = getFPCacheStats();
    expect(parserCleared.parser.size).toBe(0);
  });
});
