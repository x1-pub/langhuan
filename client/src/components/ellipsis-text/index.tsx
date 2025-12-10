import React, { CSSProperties } from 'react';

interface EllipsisTextProps {
  text: string | React.ReactNode;
  className?: string;
  width?: number | string;
}

const EllipsisText: React.FC<EllipsisTextProps> = ({ width = '100%', className = '', text }) => {
  const style: CSSProperties = {
    maxWidth: typeof width === 'number' ? `${width}px` : width,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  return (
    <div style={style} className={className} title={typeof text == 'string' ? text : undefined}>
      {text}
    </div>
  );
};

export default EllipsisText;
