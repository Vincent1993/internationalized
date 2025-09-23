import { describe, expect, it } from 'vitest';
import { startOfDay as dateFnsStartOfDay } from 'date-fns';
import {
  formatAsDate,
  formatAsDateEx,
  formatAsTime,
  formatAsStartOfDayEx,
  formatDateRange,
  formatDateRangeEx,
  config,
  resetDefaultConfigs,
} from '../../src/fp';
import { startOfDay as exportedStartOfDay } from '../../src';

const SAMPLE_DATE = new Date('2024-05-20T08:30:00Z');

describe('日期函数式 API', () => {
  it('应该使用默认的日期样式输出简体中文格式', () => {
    const result = formatAsDate(SAMPLE_DATE, { timeZone: 'UTC' });
    expect(result).toBe('2024/5/20');
  });

  it('应该允许读取完整的格式化结果并保留解析选项', () => {
    const { formattedValue, resolvedOptions } = formatAsDateEx(SAMPLE_DATE, {
      locale: 'zh-CN',
      timeZone: 'Asia/Shanghai',
    });

    expect(formattedValue).toBe('2024/5/20');
    expect(resolvedOptions.timeZone).toBe('Asia/Shanghai');
  });

  it('应该能通过配置修改默认的时间展示格式', () => {
    config({
      time: { timeStyle: 'medium' },
    });

    const formatted = formatAsTime(SAMPLE_DATE, { timeZone: 'UTC' });
    expect(formatted).toMatch(/08:30/);

    resetDefaultConfigs();
  });

  it('应该复用 date-fns 的 startOfDay 调整到日初', () => {
    const result = formatAsStartOfDayEx(SAMPLE_DATE, { timeZone: 'UTC' });

    expect(result.date?.getTime()).toBe(dateFnsStartOfDay(SAMPLE_DATE).getTime());
    expect(result.formattedValue).toBe('2024/5/20 00:00');
  });

  it('应该支持稳定的日期区间格式化并自动排序', () => {
    const formatted = formatDateRange(
      new Date('2024-05-22T12:34:00Z'),
      new Date('2024-05-20T00:00:00Z'),
      { locale: 'zh-CN', timeZone: 'UTC' },
    );

    expect(formatted).toBe('2024/5/20 – 2024/5/22');
  });

  it('应该在区间格式化时返回完整的起止信息', () => {
    const detailed = formatDateRangeEx(
      '2024-05-20T00:00:00Z',
      '2024-05-22T12:34:00Z',
      { locale: 'zh-CN', timeZone: 'UTC' },
    );

    expect(detailed.isInvalid).toBe(false);
    expect(detailed.start.formattedValue).toBe('2024/5/20');
    expect(detailed.end.formattedValue).toBe('2024/5/22');
    expect(detailed.resolvedOptions.locale).toBe('zh-CN');
  });

  it('应该直接从包入口二次导出 date-fns 的 startOfDay', () => {
    const input = new Date('2024-05-20T18:00:00Z');
    const normalized = exportedStartOfDay(input);

    expect(normalized.getTime()).toBe(dateFnsStartOfDay(input).getTime());
  });
});
