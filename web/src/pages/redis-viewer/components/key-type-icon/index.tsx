import React from "react";

import { RedisType } from "@/api/redis"

interface KeyTypeProps {
  type: RedisType
}

const typeColor = {
  [RedisType.HASH]: '#454CF8',
  [RedisType.LIST]: '#338259',
  [RedisType.SET]: '#946033',
  [RedisType.STREAM]: '#6B7428',
  [RedisType.STRING]: '#6626BE',
  [RedisType.ZSET]: '#95256A',
}

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
      }}
    >
      <span>{type.toLocaleUpperCase()}</span>
    </div>
  )
}

export default KeyTypeIcon