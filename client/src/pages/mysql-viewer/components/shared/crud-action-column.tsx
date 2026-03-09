import { Button, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';

interface CrudActionColumnTitleProps {
  onAdd: () => void;
}

export const CrudActionColumnTitle: React.FC<CrudActionColumnTitleProps> = ({ onAdd }) => {
  const { t } = useTranslation();

  return (
    <>
      {t('table.operation')}
      <Button color="cyan" variant="link" onClick={onAdd}>
        {t('button.add')}
      </Button>
    </>
  );
};

interface CrudActionButtonsProps {
  className?: string;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}

export const CrudActionButtons: React.FC<CrudActionButtonsProps> = ({
  className,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Button className={className} color="cyan" variant="link" onClick={onEdit}>
        {t('button.edit')}
      </Button>
      <Popconfirm title={t('delete.title')} description={t('delete.desc')} onConfirm={onDelete}>
        <Button className={className} color="danger" variant="link">
          {t('button.delete')}
        </Button>
      </Popconfirm>
    </>
  );
};
