import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
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

describe('日期快捷函数', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('应该返回今天、昨天、明天及前后天的零点', () => {
    expect(getTodayDate().toISOString()).toBe('2024-05-20T00:00:00.000Z');
    expect(getYesterdayDate().toISOString()).toBe('2024-05-19T00:00:00.000Z');
    expect(getTomorrowDate().toISOString()).toBe('2024-05-21T00:00:00.000Z');
    expect(getDayBeforeYesterdayDate().toISOString()).toBe('2024-05-18T00:00:00.000Z');
    expect(getDayAfterTomorrowDate().toISOString()).toBe('2024-05-22T00:00:00.000Z');
  });

  it('应该正确计算周起始日期', () => {
    expect(getStartOfPreviousWeek().toISOString()).toBe('2024-05-13T00:00:00.000Z');
    expect(getStartOfNextWeek().toISOString()).toBe('2024-05-27T00:00:00.000Z');
    expect(getStartOfNextWeek({ weekStartsOn: 0 }).toISOString()).toBe('2024-05-26T00:00:00.000Z');
  });

  it('应该正确计算月度与季度的开始时间', () => {
    expect(getStartOfPreviousMonth().toISOString()).toBe('2024-04-01T00:00:00.000Z');
    expect(getStartOfNextMonth().toISOString()).toBe('2024-06-01T00:00:00.000Z');
    expect(getStartOfPreviousQuarter().toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(getStartOfNextQuarter().toISOString()).toBe('2024-07-01T00:00:00.000Z');
  });
});
