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
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  const shouldFillWidth = resolvedWidth === '100%';
  const styles: CSSProperties = {
    width: shouldFillWidth ? resolvedWidth : undefined,
    maxWidth: resolvedWidth,
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: shouldFillWidth ? 'block' : 'inline-block',
    verticalAlign: shouldFillWidth ? undefined : 'middle',
    ...style,
  };

  return (
    <span style={styles} className={className} title={typeof text == 'string' ? text : undefined}>
      {text}
    </span>
  );
};

export default EllipsisText;
