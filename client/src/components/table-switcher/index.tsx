import React, { ReactNode, useMemo } from 'react';
import { Tabs, type TabsProps } from 'antd';
import { useTranslation } from 'react-i18next';

import DatabaseIcon from '@/assets/svg/db.svg?react';
import TableIcon from '@/assets/svg/table.svg?react';
import FunctionIcon from '@/assets/svg/function.svg?react';
import ClockIcon from '@/assets/svg/clock.svg?react';
import GlassesIcon from '@/assets/svg/glasses.svg?react';
import useDatabaseWindows, {
  ESpecialWind,
  generateActiveId,
  IWind,
} from '@/hooks/use-database-windows';
import styles from './index.module.less';

interface ITableSwitcherProps {
  children: ReactNode | ((wind: IWind) => ReactNode);
}

const TableSwitcher: React.FC<ITableSwitcherProps> = ({ children }) => {
  const { wind, setWind, active, setActive } = useDatabaseWindows();
  const { t } = useTranslation();

  const renderTabItemLabel = (item: IWind) => {
    const { dbName, tableName, specialWind } = item;

    switch (specialWind) {
      case ESpecialWind.MYSQL_ENENT:
        return (
          <span className={styles.tabLabel}>
            <ClockIcon className={styles.icon} />
            {`${t('mysql.event')}(${dbName})`}
          </span>
        );
      case ESpecialWind.MYSQL_FUNCTION:
        return (
          <span className={styles.tabLabel}>
            <FunctionIcon className={styles.icon} />
            {`${t('mysql.function')}(${dbName})`}
          </span>
        );
      case ESpecialWind.MYSQL_VIEW:
        return (
          <span className={styles.tabLabel}>
            <GlassesIcon className={styles.icon} />
            {`${t('mysql.view')}(${dbName})`}
          </span>
        );
      default:
        return (
          <span className={styles.tabLabel}>
            {tableName ? (
              <TableIcon className={styles.icon} />
            ) : (
              <DatabaseIcon className={styles.icon} />
            )}
            {tableName ? `${dbName}@${tableName}` : dbName}
          </span>
        );
    }
  };

  const tabItems: TabsProps['items'] = useMemo(
    () =>
      wind.map(c => ({
        key: generateActiveId(c.dbName, c.tableName, c.specialWind),
        label: renderTabItemLabel(c),
        children: typeof children === 'function' ? children(c) : children,
        forceRender: true,
      })),
    [wind, t],
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

export default TableSwitcher;
