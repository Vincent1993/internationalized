import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from 'date-fns';
import {
  getTodayDate,
  getTomorrowDate,
  getYesterdayDate,
  getDayAfterTomorrowDate,
  getDayBeforeYesterdayDate,
  getStartOfNextWeek,
  getStartOfPreviousWeek,
  getStartOfNextMonth,
  getStartOfPreviousMonth,
  getStartOfNextQuarter,
  getStartOfPreviousQuarter,
} from '../../src';

const BASE_TIME = new Date('2024-05-20T10:30:00.000Z');

function expectSameTimestamp(received: Date, expected: Date) {
  expect(received.getTime()).toBe(expected.getTime());
}

function getStartOfTodayReference(): Date {
  return startOfDay(BASE_TIME);
}

describe('日期快捷函数', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('应该返回今天、昨天、明天及前后天的零点', () => {
    const startOfToday = getStartOfTodayReference();

    expectSameTimestamp(getTodayDate(), startOfToday);
    expectSameTimestamp(getYesterdayDate(), addDays(startOfToday, -1));
    expectSameTimestamp(getTomorrowDate(), addDays(startOfToday, 1));
    expectSameTimestamp(getDayBeforeYesterdayDate(), addDays(startOfToday, -2));
    expectSameTimestamp(getDayAfterTomorrowDate(), addDays(startOfToday, 2));
  });

  it('应该正确计算周起始日期', () => {
    const startOfToday = getStartOfTodayReference();

    expectSameTimestamp(
      getStartOfPreviousWeek(),
      startOfWeek(addWeeks(startOfToday, -1), { weekStartsOn: 1 }),
    );
    expectSameTimestamp(
      getStartOfNextWeek(),
      startOfWeek(addWeeks(startOfToday, 1), { weekStartsOn: 1 }),
    );
    expectSameTimestamp(
      getStartOfNextWeek({ weekStartsOn: 0 }),
      startOfWeek(addWeeks(startOfToday, 1), { weekStartsOn: 0 }),
    );
  });

  it('应该正确计算月度与季度的开始时间', () => {
    const startOfToday = getStartOfTodayReference();

    expectSameTimestamp(
      getStartOfPreviousMonth(),
      startOfMonth(addMonths(startOfToday, -1)),
    );
    expectSameTimestamp(getStartOfNextMonth(), startOfMonth(addMonths(startOfToday, 1)));
    expectSameTimestamp(
      getStartOfPreviousQuarter(),
      startOfQuarter(addQuarters(startOfToday, -1)),
    );
    expectSameTimestamp(
      getStartOfNextQuarter(),
      startOfQuarter(addQuarters(startOfToday, 1)),
    );
  });
});
