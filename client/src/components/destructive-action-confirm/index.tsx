import React, { useState, useEffect } from 'react';
import { Modal, Input, Typography, Result } from 'antd';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  matchText: string;
  visible?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible = false,
  onCancel,
  onConfirm,
  matchText,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [confirmDisabled, setConfirmDisabled] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    setConfirmDisabled(inputValue !== matchText);
  }, [inputValue, matchText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm?.();
    setInputValue('');
  };

  const handleCancel = () => {
    console.log(132);
    onCancel?.();
    setInputValue('');
  };

  return (
    <Modal
      title={t('delete.title2')}
      maskClosable={false}
      open={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okButtonProps={{ disabled: confirmDisabled, danger: true }}
    >
      <Result
        style={{ padding: '30px 0 0 0' }}
        status="warning"
        title={
          <Typography.Text>
            {t('delete.desc2')}
            <Typography.Text type="danger" strong>
              {` ${matchText} `}
            </Typography.Text>
            {t('delete.desc3')}
          </Typography.Text>
        }
      />
      <Input value={inputValue} onChange={handleInputChange} style={{ marginTop: 16 }} />
    </Modal>
  );
};

interface DestructiveActionConfirmProps {
  node: React.ReactNode;
  matchText: string;
  onConfirm?: () => void;
}

const DestructiveActionConfirm: React.FC<DestructiveActionConfirmProps> = ({
  node,
  matchText,
  onConfirm,
}) => {
  const [visible, setVisible] = useState<boolean>(false);

  const handleConfirm = () => {
    onConfirm?.();
    setVisible(false);
  };

  return (
    <span onClick={e => e.stopPropagation()}>
      <span onClick={() => setVisible(true)}>{node}</span>
      <ConfirmationModal
        visible={visible}
        matchText={matchText}
        onConfirm={handleConfirm}
        onCancel={() => setVisible(false)}
      />
    </span>
  );
};

export default DestructiveActionConfirm;
