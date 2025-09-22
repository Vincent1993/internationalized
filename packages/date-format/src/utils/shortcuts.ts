import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  startOfMonth,
  startOfQuarter,
  startOfToday,
  startOfTomorrow,
  startOfWeek,
  startOfYesterday,
  subDays,
} from 'date-fns';
import type { StartOfWeekOptions } from 'date-fns';

const DEFAULT_WEEK_OPTIONS: StartOfWeekOptions = { weekStartsOn: 1 };

function resolveWeekOptions(options?: StartOfWeekOptions): StartOfWeekOptions {
  return { ...DEFAULT_WEEK_OPTIONS, ...options };
}

/**
 * @name getTodayDate
 * @description 返回当前系统时间所在日的零点，常用于基于「今天」进行相对计算。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getTodayDate } from '@internationalized/date-format';
 *
 * const today = getTodayDate();
 * // => Date 对象，指向今天的 00:00:00
 * ```
 */
export function getTodayDate(): Date {
  return startOfToday();
}

/**
 * @name getTomorrowDate
 * @description 返回「明天」的零点时间，便于计算未来一天的开始时间。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getTomorrowDate } from '@internationalized/date-format';
 *
 * const tomorrow = getTomorrowDate();
 * // => Date 对象，指向明天的 00:00:00
 * ```
 */
export function getTomorrowDate(): Date {
  return startOfTomorrow();
}

/**
 * @name getYesterdayDate
 * @description 返回「昨天」的零点时间，适用于回溯计算或统计对比。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getYesterdayDate } from '@internationalized/date-format';
 *
 * const yesterday = getYesterdayDate();
 * // => Date 对象，指向昨天的 00:00:00
 * ```
 */
export function getYesterdayDate(): Date {
  return startOfYesterday();
}

/**
 * @name getDayAfterTomorrowDate
 * @description 返回「后天」的零点时间，常用于排期或未来计划的基准时间。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getDayAfterTomorrowDate } from '@internationalized/date-format';
 *
 * const twoDaysLater = getDayAfterTomorrowDate();
 * // => Date 对象，指向后天的 00:00:00
 * ```
 */
export function getDayAfterTomorrowDate(): Date {
  return addDays(startOfTomorrow(), 1);
}

/**
 * @name getDayBeforeYesterdayDate
 * @description 返回「前天」的零点时间，可用于回顾类统计的窗口计算。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getDayBeforeYesterdayDate } from '@internationalized/date-format';
 *
 * const twoDaysAgo = getDayBeforeYesterdayDate();
 * // => Date 对象，指向前天的 00:00:00
 * ```
 */
export function getDayBeforeYesterdayDate(): Date {
  return subDays(startOfYesterday(), 1);
}

/**
 * @name getStartOfNextWeek
 * @description 返回下一周的起始日期，默认以周一为每周第一天，可通过 `weekStartsOn` 调整。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getStartOfNextWeek } from '@internationalized/date-format';
 *
 * const nextWeekStart = getStartOfNextWeek();
 * // => Date 对象，指向下一周的周一 00:00:00
 *
 * const sundayWeekStart = getStartOfNextWeek({ weekStartsOn: 0 });
 * // => Date 对象，指向下一周的周日 00:00:00
 * ```
 */
export function getStartOfNextWeek(options?: StartOfWeekOptions): Date {
  return startOfWeek(addWeeks(startOfToday(), 1), resolveWeekOptions(options));
}

/**
 * @name getStartOfPreviousWeek
 * @description 返回上一周的起始日期，默认同样以周一为第一天。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getStartOfPreviousWeek } from '@internationalized/date-format';
 *
 * const previousWeekStart = getStartOfPreviousWeek();
 * // => Date 对象，指向上一周的周一 00:00:00
 * ```
 */
export function getStartOfPreviousWeek(options?: StartOfWeekOptions): Date {
  return startOfWeek(addWeeks(startOfToday(), -1), resolveWeekOptions(options));
}

/**
 * @name getStartOfNextMonth
 * @description 返回下个月的第一天零点，便于按月度创建时间窗口。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getStartOfNextMonth } from '@internationalized/date-format';
 *
 * const nextMonthStart = getStartOfNextMonth();
 * // => Date 对象，指向下个月 1 号 00:00:00
 * ```
 */
export function getStartOfNextMonth(): Date {
  return startOfMonth(addMonths(startOfToday(), 1));
}

/**
 * @name getStartOfPreviousMonth
 * @description 返回上个月的第一天零点，适合回溯历史周期。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getStartOfPreviousMonth } from '@internationalized/date-format';
 *
 * const previousMonthStart = getStartOfPreviousMonth();
 * // => Date 对象，指向上个月 1 号 00:00:00
 * ```
 */
export function getStartOfPreviousMonth(): Date {
  return startOfMonth(addMonths(startOfToday(), -1));
}

/**
 * @name getStartOfNextQuarter
 * @description 返回下一季度的第一天零点，适合季度报表或计划排程。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getStartOfNextQuarter } from '@internationalized/date-format';
 *
 * const nextQuarterStart = getStartOfNextQuarter();
 * // => Date 对象，指向下一个季度的第一天 00:00:00
 * ```
 */
export function getStartOfNextQuarter(): Date {
  return startOfQuarter(addQuarters(startOfToday(), 1));
}

/**
 * @name getStartOfPreviousQuarter
 * @description 返回上一季度的第一天零点。
 * @since 0.1.0
 *
 * @example
 * ```ts
 * import { getStartOfPreviousQuarter } from '@internationalized/date-format';
 *
 * const previousQuarterStart = getStartOfPreviousQuarter();
 * // => Date 对象，指向上一季度的第一天 00:00:00
 * ```
 */
export function getStartOfPreviousQuarter(): Date {
  return startOfQuarter(addQuarters(startOfToday(), -1));
}
