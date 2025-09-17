export interface CreateCacheKeyOptions {
  /**
   * Optional prefix to prepend to the generated cache key. Useful when combining
   * multiple namespaces or distinguishing between related cache domains.
   */
  prefix?: string;
  /**
   * Controls whether properties with `undefined` values should be omitted from
   * the generated cache key. Defaults to `true` to avoid unstable segments.
   */
  skipUndefined?: boolean;
}

function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

function toKeySegment(key: string, value: unknown): string {
  return `${key}:${String(value)}`;
}

/**
 * Creates a stable cache key string by normalizing the provided record.
 *
 * - Keys are sorted alphabetically to guarantee deterministic ordering.
 * - `undefined` values are skipped by default to avoid spurious changes
 *   when optional parameters are absent.
 * - A prefix can be provided to namespace the resulting key.
 */
export function createCacheKey(
  record: Record<string, unknown>,
  options: CreateCacheKeyOptions = {},
): string {
  const { prefix, skipUndefined = true } = options;

  const segments = Object.entries(record)
    .filter(([, value]) => !(skipUndefined && isUndefined(value)))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => toKeySegment(key, value));

  const baseKey = segments.join('|');

  if (prefix) {
    return baseKey ? `${prefix}|${baseKey}` : prefix;
  }

  return baseKey;
}
