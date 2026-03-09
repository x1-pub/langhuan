import AddKeyBox from './add-key-box';
import EditKeyBox from './edit-key-box';
import styles from './index.module.less';
import { ERedisDataType } from '@packages/types/redis';
import { RouterOutput } from '@/infra/api/trpc';

type RedisValueData = RouterOutput['redis']['getValue'];

interface ValuePanelProps {
  showAddKeyPanel: boolean;
  activeKey: {
    key: string;
    type: ERedisDataType;
  } | null;
  valueData?: RedisValueData;
  onAddSuccess: (key: string, type: ERedisDataType) => void;
  onCloseAddPanel: () => void;
  onDeleteKey: () => void;
  onCloseEditPanel: () => void;
  onReloadValue: () => void;
  onModifyKey: (nextKey: string) => void;
}

const ValuePanel: React.FC<ValuePanelProps> = ({
  showAddKeyPanel,
  activeKey,
  valueData,
  onAddSuccess,
  onCloseAddPanel,
  onDeleteKey,
  onCloseEditPanel,
  onReloadValue,
  onModifyKey,
}) => {
  return (
    <section className={styles.valuePanel}>
      <div className={styles.redisValue}>
        {showAddKeyPanel && <AddKeyBox onAddSuccess={onAddSuccess} onCancel={onCloseAddPanel} />}
        {activeKey && valueData && (
          <EditKeyBox
            data={valueData}
            onDelete={onDeleteKey}
            onCancel={onCloseEditPanel}
            onReload={onReloadValue}
            onModifyKey={onModifyKey}
          />
        )}
      </div>
    </section>
  );
};

export default ValuePanel;
