import { createBaseFormatComponent } from '@internationalized/shared/components';
import type { NumberFormatter, UseFormatResult } from '../../core/types';

export const BaseNumberFormat = createBaseFormatComponent<
  unknown,
  UseFormatResult,
  NumberFormatter,
  'span'
>({
  defaultElement: 'span',
  displayName: 'BaseNumberFormat',
});
