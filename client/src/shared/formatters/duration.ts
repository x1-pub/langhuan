import i18n from '@/i18n';

export const formatDuration = (s: number | string) => {
  const seconds = Number(s);
  if (seconds === -1 || !seconds) {
    return i18n.t('redis.noLimit');
  }

  if (seconds <= 0) {
    return i18n.t('redis.expired');
  }

  if (seconds < 60) {
    return `${Math.floor(seconds)}${i18n.t('redis.seconds')}`;
  }

  if (seconds < 60 * 60) {
    return `${Math.floor(seconds / 60)}${i18n.t('redis.min')}`;
  }

  if (seconds < 60 * 60 * 24) {
    return `${Math.floor(seconds / 60 / 60)}${i18n.t('redis.hour')}`;
  }

  return `${Math.floor(seconds / 60 / 60 / 24)}${i18n.t('redis.day')}`;
};
