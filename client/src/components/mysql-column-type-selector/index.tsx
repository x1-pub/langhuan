import React, { useMemo, useState } from 'react';
import { Checkbox, Input, Select, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';

import { EMySQLPureType } from '@packages/types/mysql';

interface IMySQLColumnTypeSelectorProps {
  value?: string;
  onChange?: (value?: string) => void;
}

const MySQLColumnTypeSelector: React.FC<IMySQLColumnTypeSelectorProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [showExtra, setShowExtra] = useState(false);

  const [type, extra] = useMemo(() => {
    const cleanType = (value || '').toLowerCase();

    const regex = /^([a-zA-Z]*)(?:\((.*)\))?$/;
    const match = cleanType.match(regex);

    if (!match) {
      return ['', ''];
    }

    const [, type, extra = ''] = match;
    if (extra) {
      setShowExtra(true);
    }

    return [type, extra];
  }, [value]);

  const handleTypeChange = (t: string = '') => {
    onChange?.(`${t}${showExtra && extra ? `(${extra})` : ''}`);
  };

  const handleExtraChange = (e: string) => {
    onChange?.(`${type}${e ? `(${e})` : ''}`);
  };

  const toggleShowExtra = () => {
    if (showExtra) {
      setShowExtra(false);
      onChange?.(type);
    } else {
      setShowExtra(true);
    }
  };

  return (
    <span style={{ display: 'flex', gap: '5px' }}>
      <Select
        showSearch
        value={type}
        options={Object.values(EMySQLPureType).map(o => ({ label: o, value: o }))}
        onChange={handleTypeChange}
      />
      <Tooltip
        title={
          <div>
            <div>{t('table.e1')}:</div>
            <div>1. {t('table.e2')}</div>
            <div>2. {t('table.e3')}</div>
            <div>3. {t('table.e4')}</div>
          </div>
        }
      >
        <Checkbox checked={showExtra} onChange={toggleShowExtra} />
      </Tooltip>
      <Input
        prefix="("
        suffix=")"
        disabled={!showExtra}
        value={extra}
        onChange={e => handleExtraChange(e.target.value)}
      />
    </span>
  );
};

export default MySQLColumnTypeSelector;
