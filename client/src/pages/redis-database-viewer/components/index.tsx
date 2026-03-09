import { Splitter } from 'antd';

import styles from './index.module.less';
import SearchToolbar from './search-toolbar';
import KeysPanel from './keys-panel';
import ValuePanel from './value-panel';
import useRedisMainModel from '../hooks/use-redis-main-model';

const RedisMain: React.FC = () => {
  const model = useRedisMainModel();

  return (
    <div className={styles.redisWrap}>
      <SearchToolbar
        keyTypeFilter={model.keyTypeFilter}
        onChangeKeyTypeFilter={model.setKeyTypeFilter}
        onSearch={model.setSearchPattern}
        onAddKey={model.handleOpenAddKeyPanel}
      />

      <Splitter className={styles.data}>
        <Splitter.Panel collapsible={true} min={480}>
          <KeysPanel
            containerId={model.containerId}
            data={model.tableData}
            activeKey={model.activeKey?.key}
            viewType={model.viewType}
            width={model.width}
            height={model.height}
            totalScanned={model.totalScanned}
            totalMatched={model.totalMatched}
            hasMorePage={model.hasMorePage}
            loading={model.keyListQuery.isLoading || model.keyListQuery.isFetching}
            onLoadMore={() => model.keyListQuery.fetchNextPage()}
            onRefresh={model.invalidateKeyList}
            onSelectViewType={model.setViewType}
            onSelectKey={model.handleSelectRedisKey}
          />
        </Splitter.Panel>

        <Splitter.Panel collapsible={true} min={420}>
          <ValuePanel
            showAddKeyPanel={model.showAddKeyPanel}
            activeKey={model.activeKey}
            valueData={model.valueQuery.data}
            onAddSuccess={model.handleAddSuccess}
            onCloseAddPanel={() => model.setShowAddKeyPanel(false)}
            onDeleteKey={model.handleDeleteKey}
            onCloseEditPanel={() => model.setActiveKey(null)}
            onReloadValue={() => model.valueQuery.refetch()}
            onModifyKey={model.handleModifyKey}
          />
        </Splitter.Panel>
      </Splitter>
    </div>
  );
};

export default RedisMain;
