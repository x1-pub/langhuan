import React from 'react';
import { Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';

import { IDocumentEditorState } from '../shared';
import styles from '../../index.module.less';

interface DocumentEditorModalProps {
  documentEditor: IDocumentEditorState | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onChangeContent: (value: string) => void;
}

const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  documentEditor,
  isSubmitting,
  onCancel,
  onSubmit,
  onChangeContent,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={!!documentEditor}
      width={900}
      title={
        documentEditor?.mode === 'create' ? t('mongodb.addDocument') : t('mongodb.editDocument')
      }
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={isSubmitting}
      destroyOnHidden={true}
    >
      <Input.TextArea
        value={documentEditor?.content}
        onChange={event => onChangeContent(event.target.value)}
        rows={22}
        className={styles.modalEditor}
      />
    </Modal>
  );
};

export default DocumentEditorModal;
