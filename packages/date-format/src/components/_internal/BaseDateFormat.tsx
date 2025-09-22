import { createBaseFormatComponent } from '@internationalized/shared/components';
import type { DateFormatter, UseDateFormatResult, DateInput } from '../../core/types';

export const BaseDateFormat = createBaseFormatComponent<
  DateInput,
  UseDateFormatResult,
  DateFormatter,
  'time'
>({
  defaultElement: 'time',
  displayName: 'BaseDateFormat',
  isInvalid: (result) => result.isInvalid,
  resolveInvalidContent: ({ result, fallback }) => fallback ?? result.formattedValue,
  resolveInvalidAsChild: ({ fallback }) => (typeof fallback !== 'undefined' ? fallback : null),
  resolveAsChildContent: ({ result }) => result.formattedValue,
  enhanceComponentProps: ({ result, invalid, asChild, component }) => {
    if (!asChild && !invalid && typeof component === 'string' && component === 'time' && result.date) {
      return { dateTime: result.date.toISOString() };
    }
    return undefined;
  },
});
