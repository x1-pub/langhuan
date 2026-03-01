import React from 'react';
import { Input, Modal, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import { IIndexEditorState } from '../shared';
import styles from '../../index.module.less';

interface IndexEditorModalProps {
  open: boolean;
  indexEditor: IIndexEditorState;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onChange: (next: IIndexEditorState) => void;
}

const IndexEditorModal: React.FC<IndexEditorModalProps> = ({
  open,
  indexEditor,
  isSubmitting,
  onCancel,
  onSubmit,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      width={760}
      title={t('mongodb.createIndex')}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={isSubmitting}
      destroyOnHidden={true}
    >
      <div className={styles.indexEditorWrap}>
        <div>
          <Typography.Text>{t('mongodb.indexKeys')}</Typography.Text>
          <Input.TextArea
            rows={8}
            className={styles.modalEditor}
            value={indexEditor.keys}
            onChange={event => onChange({ ...indexEditor, keys: event.target.value })}
          />
        </div>
        <div>
          <Typography.Text>{t('mongodb.indexOptions')}</Typography.Text>
          <Input.TextArea
            rows={8}
            className={styles.modalEditor}
            value={indexEditor.options}
            onChange={event => onChange({ ...indexEditor, options: event.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
};

export default IndexEditorModal;
