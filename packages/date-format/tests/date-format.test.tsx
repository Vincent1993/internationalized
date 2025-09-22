import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  DateFormat,
  DateFormatProvider,
  createDateFormatter,
  resolveDateFormatOptions,
} from '../src';

const ISO_SAMPLE = '2024-03-01T08:15:00Z';

describe('createDateFormatter 工厂函数', () => {
  it('可以通过 Intl.DateTimeFormat 正确格式化 ISO 字符串', () => {
    const formatter = createDateFormatter({
      locale: 'en-US',
      dateStyle: 'full',
      timeZone: 'UTC',
    });

    const result = formatter.format(ISO_SAMPLE);
    const expected = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeZone: 'UTC',
    }).format(new Date(ISO_SAMPLE));

    expect(result.formattedValue).toBe(expected);
    expect(result.isInvalid).toBe(false);
    expect(result.date?.toISOString()).toBe('2024-03-01T08:15:00.000Z');
  });

  it('当无法解析为日期时会返回无效状态', () => {
    const formatter = createDateFormatter({ locale: 'en-US' });
    const result = formatter.format('not-a-date');

    expect(result.isInvalid).toBe(true);
    expect(result.formattedValue).toBe('Invalid Date');
    expect(result.parts).toEqual([]);
  });

  it('在未指定语言时会自动回退到 zh-CN', () => {
    const formatter = createDateFormatter({ timeZone: 'UTC' });
    const result = formatter.format(ISO_SAMPLE);

    const expected = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'UTC',
    }).format(new Date(ISO_SAMPLE));

    expect(result.resolvedOptions.locale).toBe('zh-CN');
    expect(result.formattedValue).toBe(expected);
  });
});

describe('DateFormat 组件', () => {
  it('在缺省属性时会继承上下文默认值', () => {
    render(
      <DateFormatProvider options={{ locale: 'zh-CN', dateStyle: 'long', timeZone: 'UTC' }}>
        <DateFormat value={ISO_SAMPLE} data-testid="date" />
      </DateFormatProvider>,
    );

    const expected = new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(ISO_SAMPLE));

    expect(screen.getByTestId('date')).toHaveTextContent(expected);
  });
});

describe('resolveDateFormatOptions 工具函数', () => {
  it('可以将传入选项与上下文配置合并', () => {
    const resolved = resolveDateFormatOptions(
      { timeStyle: 'short' },
      { locale: 'en-GB', timeZone: 'UTC' },
    );

    expect(resolved.timeZone).toBe('UTC');
    expect(resolved.locale).toBe('en-GB');
    expect(resolved.originalLocale).toBe('en-GB');
    expect(resolved.timeStyle).toBe('short');
  });
});
