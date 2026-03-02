import { notification } from 'antd';
import i18n from '@/i18n';

interface NotificationParams {
  title?: string;
  message?: string;
  sql?: string;
}

export const showError = ({ title, message, sql }: NotificationParams) => {
  const payload = {
    message: title || i18n.t('notification.unknownError'),
    description: (
      <>
        <div style={{ fontSize: '12px' }}>{message}</div>
        <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{sql}</div>
      </>
    ),
    showProgress: true,
    pauseOnHover: true,
  };

  notification.error(payload);
};

export const showSuccess = (content: string = i18n.t('notification.executionSuccessful')) => {
  const payload = {
    message: i18n.t('notification.success'),
    description: content,
    showProgress: true,
    pauseOnHover: false,
  };

  notification.success(payload);
};
