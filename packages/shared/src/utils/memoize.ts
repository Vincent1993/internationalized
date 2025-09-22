/**
 * @file 提供最简化的缓存工厂，按插入顺序淘汰旧数据，供各格式化器共享使用。
 */

export interface SimpleCache<T> {
  /**
   * @description 读取指定键的缓存值，不存在时返回 `undefined`。
   */
  get(key: string): T | undefined;
  /**
   * @description 写入新的缓存值，超过容量时自动淘汰最早写入的条目。
   */
  set(key: string, value: T): void;
  /**
   * @description 清空缓存中的所有条目。
   */
  clear(): void;
  /**
   * @description 获取当前缓存的条目数量。
   */
  size(): number;
}

export interface CreateSimpleCacheOptions {
  /**
   * @description 缓存允许保存的最大条目数，默认 200。
   */
  maxSize?: number;
}

/**
 * @description 创建一个具备简单 LRU 行为的缓存实例。
 */
export function createSimpleCache<T>({ maxSize = 200 }: CreateSimpleCacheOptions = {}): SimpleCache<T> {
  const cache = new Map<string, T>();

  return {
    get(key: string): T | undefined {
      return cache.get(key);
    },
    set(key: string, value: T): void {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (typeof oldestKey !== 'undefined') {
          cache.delete(oldestKey);
        }
      }

      cache.set(key, value);
    },
    clear(): void {
      cache.clear();
    },
    size(): number {
      return cache.size;
    },
  };
}
