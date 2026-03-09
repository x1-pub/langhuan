import { Button, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';

import KeyTypeIcon from './key-type-icon';
import styles from './index.module.less';
import { ERedisDataType } from '@packages/types/redis';

interface SearchToolbarProps {
  keyTypeFilter: ERedisDataType | 'all';
  onChangeKeyTypeFilter: (value: ERedisDataType | 'all') => void;
  onSearch: (value: string) => void;
  onAddKey: () => void;
}

const SearchToolbar: React.FC<SearchToolbarProps> = ({
  keyTypeFilter,
  onChangeKeyTypeFilter,
  onSearch,
  onAddKey,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.searchGroup}>
      <Input.Search
        addonBefore={
          <Select
            value={keyTypeFilter}
            style={{ width: '180px' }}
            onChange={value => onChangeKeyTypeFilter(value as ERedisDataType | 'all')}
          >
            <Select.Option value="all">
              <div className={styles.typeOption}>{t('redis.allKeyTypes')}</div>
            </Select.Option>
            {Object.values(ERedisDataType).map(type => (
              <Select.Option value={type} key={type}>
                <div className={styles.typeOption}>
                  <KeyTypeIcon type={type} />
                </div>
              </Select.Option>
            ))}
          </Select>
        }
        allowClear={true}
        placeholder={t('redis.placeholderRedisSearch')}
        onSearch={onSearch}
      />
      <Button type="primary" onClick={onAddKey}>
        + {t('redis.key')}
      </Button>
    </div>
  );
};

export default SearchToolbar;
