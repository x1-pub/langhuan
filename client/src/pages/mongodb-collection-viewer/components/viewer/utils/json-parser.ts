import type { TFunction } from 'i18next';

import { showError } from '@/shared/ui/notifications';
import { isPlainObject } from '../../shared';

export const parseJSONObject = (
  value: string,
  label: string,
  t: TFunction,
): Record<string, unknown> | undefined => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    showError({
      title: 'INVALID_JSON',
      message: t('mongodb.invalidJson', { field: label }),
    });
    return;
  }

  if (!isPlainObject(parsed)) {
    showError({
      title: 'INVALID_JSON',
      message: t('mongodb.invalidJson', { field: label }),
    });
    return;
  }

  return parsed;
};

export const parseJSONArray = (
  value: string,
  label: string,
  t: TFunction,
): unknown[] | undefined => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    showError({
      title: 'INVALID_JSON',
      message: t('mongodb.invalidJsonArray', { field: label }),
    });
    return;
  }

  if (!Array.isArray(parsed)) {
    showError({
      title: 'INVALID_JSON',
      message: t('mongodb.invalidJsonArray', { field: label }),
    });
    return;
  }

  return parsed;
};
