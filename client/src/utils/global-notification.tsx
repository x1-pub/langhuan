import { notification } from 'antd';

interface NotificationParams {
  title?: string;
  message?: string;
  sql?: string;
}

export const showError = ({ title, message, sql }: NotificationParams) => {
  const payload = {
    message: title || 'UNKNOWN_ERROR',
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

export const showSuccess = (content: string = 'Execution successful') => {
  const payload = {
    message: 'SUCCESS',
    description: content,
    showProgress: true,
    pauseOnHover: false,
  };

  notification.success(payload);
};
