import React, { ReactNode, useMemo } from 'react';
import { Tabs, type TabsProps } from 'antd';

import useMain, { generateActiveId } from '@/utils/use-main';
import styles from './index.module.less';

const TableTabs: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wind, setWind, active, setActive } = useMain();

  const tabItems: TabsProps['items'] = useMemo(
    () =>
      wind.map(c => ({
        key: generateActiveId(c.dbName, c.tableName),
        label: c.tableName || c.dbName,
        children,
        forceRender: true,
      })),
    [wind],
  );

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} className={styles.tabbar} />
  );

  const handleRemove = (
    targetKey: React.MouseEvent | React.KeyboardEvent | string,
    action: string,
  ) => {
    if (action === 'add') {
      return;
    }

    const list = wind.filter(w => generateActiveId(w.dbName, w.tableName) !== targetKey);
    setWind(list);
    if (targetKey === active) {
      const activeId = generateActiveId(list[0]?.dbName, list[0]?.tableName);
      setActive(activeId);
    }
  };

  return (
    <Tabs
      type="editable-card"
      hideAdd={true}
      activeKey={active}
      items={tabItems}
      renderTabBar={renderTabBar}
      onChange={setActive}
      onEdit={handleRemove}
    />
  );
};

export default TableTabs;
