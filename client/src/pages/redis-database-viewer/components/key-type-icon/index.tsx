import React from 'react';

import { ERedisDataType } from '@packages/types/redis';

interface KeyTypeProps {
  type: ERedisDataType;
}

const typeColor = {
  [ERedisDataType.HASH]: '#454CF8',
  [ERedisDataType.LIST]: '#338259',
  [ERedisDataType.SET]: '#946033',
  [ERedisDataType.STREAM]: '#6B7428',
  [ERedisDataType.STRING]: '#6626BE',
  [ERedisDataType.ZSET]: '#95256A',
};

const KeyTypeIcon: React.FC<KeyTypeProps> = ({ type }) => {
  return (
    <div
      style={{
        boxSizing: 'border-box',
        height: '20px',
        width: '64px',
        lineHeight: '20px',
        backgroundColor: typeColor[type],
        color: '#FFFFFF',
        borderRadius: '3px',
        fontWeight: 'lighter',
        fontSize: '13px',
        display: 'inline-block',
        textAlign: 'center',
        flexShrink: '0',
      }}
    >
      <span>{type.toLocaleUpperCase()}</span>
    </div>
  );
};

export default KeyTypeIcon;
