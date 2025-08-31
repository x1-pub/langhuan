import { notification } from "antd";

export const showError = (content: string = 'Unknown Error') => {
  const [title, subTitle] = content.split('\n')

  const payload = {
    message: 'ERROR',
    description: (
      <>
        <div style={{ fontWeight: 'bold' }}>{title}</div>
        <div style={{ color: '#8c8c8c', fontSize: '12px' }}>{subTitle}</div>
      </>
    ),
    duration: 0,
  }

  notification.error(payload)
}

export const showSuccess = (content: string = 'Execution successful') => {
  const payload = {
    message: 'SUCCESS',
    description: content,
    showProgress: true,
    pauseOnHover: true,
  }

  notification.success(payload)
}
