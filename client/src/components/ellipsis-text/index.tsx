import React, { CSSProperties } from 'react';

interface EllipsisTextProps {
  text: string | React.ReactNode;
  className?: string;
  width?: number | string;
  style?: React.CSSProperties;
}

const EllipsisText: React.FC<EllipsisTextProps> = ({
  width = '100%',
  className = '',
  text,
  style,
}) => {
  const styles: CSSProperties = {
    maxWidth: typeof width === 'number' ? `${width}px` : width,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    verticalAlign: 'middle',
    ...style,
  };

  return (
    <div style={styles} className={className} title={typeof text == 'string' ? text : undefined}>
      {text}
    </div>
  );
};

export default EllipsisText;
