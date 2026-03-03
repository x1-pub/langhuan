import React from 'react';
import { Button, Input, Select, Space, Typography } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import styles from '../../index.module.less';

interface ValidationPanelProps {
  validatorText: string;
  validationLevel: 'off' | 'strict' | 'moderate';
  validationAction: 'error' | 'warn';
  isLoading: boolean;
  isSaving: boolean;
  onChangeValidatorText: (value: string) => void;
  onChangeValidationLevel: (value: 'off' | 'strict' | 'moderate') => void;
  onChangeValidationAction: (value: 'error' | 'warn') => void;
  onRefresh: () => void;
  onReset: () => void;
  onSave: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validatorText,
  validationLevel,
  validationAction,
  isLoading,
  isSaving,
  onChangeValidatorText,
  onChangeValidationLevel,
  onChangeValidationAction,
  onRefresh,
  onReset,
  onSave,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.panelBody}>
      <div className={styles.infoBar}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('button.refresh')}
          </Button>
          <Button onClick={onReset}>{t('button.reset')}</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={onSave}>
            {t('mongodb.saveValidation')}
          </Button>
        </Space>
      </div>

      <div className={styles.validationForm}>
        <div className={styles.validationMeta}>
          <div className={styles.queryField}>
            <span className={styles.queryLabel}>{t('mongodb.validationLevel')}</span>
            <Select
              value={validationLevel}
              options={[
                { label: t('mongodb.levelOff'), value: 'off' },
                { label: t('mongodb.levelStrict'), value: 'strict' },
                { label: t('mongodb.levelModerate'), value: 'moderate' },
              ]}
              onChange={value => onChangeValidationLevel(value as 'off' | 'strict' | 'moderate')}
            />
          </div>

          <div className={styles.queryField}>
            <span className={styles.queryLabel}>{t('mongodb.validationAction')}</span>
            <Select
              value={validationAction}
              options={[
                { label: t('mongodb.actionError'), value: 'error' },
                { label: t('mongodb.actionWarn'), value: 'warn' },
              ]}
              onChange={value => onChangeValidationAction(value as 'error' | 'warn')}
            />
          </div>
        </div>

        <div className={styles.queryField}>
          <span className={styles.queryLabel}>{t('mongodb.validator')}</span>
          <Input.TextArea
            value={validatorText}
            rows={18}
            className={styles.validationCode}
            onChange={event => onChangeValidatorText(event.target.value)}
            disabled={isLoading}
          />
        </div>

        <Typography.Text type="secondary">{t('mongodb.validationHelp')}</Typography.Text>
      </div>
    </div>
  );
};

export default ValidationPanel;
