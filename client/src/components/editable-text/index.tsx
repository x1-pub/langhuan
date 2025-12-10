import React from 'react';

import { useState, useRef, useEffect } from 'react';
import styles from './index.module.less';
import { Tooltip } from 'antd';

interface EditableTextProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  maxHeight?: number;
  tooltip?: string;
  readonly?: boolean;
  editMode?: 'normal' | 'fastify';
  showCopy?: boolean;
  empty?: string;
}

const EditableText: React.FC<EditableTextProps> = ({
  value = '',
  onChange = () => {},
  placeholder = '',
  className = '',
  multiline = false,
  maxHeight = 500,
  tooltip,
  readonly = false,
  editMode = 'normal',
  showCopy = true,
  empty = 'Empty',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleTextClick = () => {
    if (readonly) {
      return;
    }
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
    setIsHovered(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setIsHovered(false); // Reset hover state when exiting edit mode to prevent stuck hover state
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (multiline) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    } else {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    const handleClick = (e: Event) => {
      if (
        inputRef.current &&
        containerRef.current &&
        !containerRef.current.contains(e.target as HTMLElement)
      ) {
        handleCancel();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  if (isEditing) {
    return (
      <div
        className={`${styles.container} ${styles.editing} ${multiline ? styles.multiline : ''} ${className}`}
        style={{ position: 'relative' }}
        ref={containerRef}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={e => {
              setEditValue(e.target.value);
              if (editMode === 'fastify') {
                onChange(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
            placeholder={placeholder}
            rows={7}
            style={{ maxHeight: `${maxHeight}px` }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={e => {
              setEditValue(e.target.value);
              if (editMode === 'fastify') {
                onChange(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            className={styles.input}
            placeholder={placeholder}
          />
        )}
        {editMode === 'normal' && (
          <div className={styles.externalActions}>
            <button className={styles.cancelButton} onClick={handleCancel} type="button">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <button className={styles.saveButton} onClick={handleSave} type="button">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${styles.container} ${isHovered && !readonly ? styles.hovered : ''} ${multiline ? styles.multilineDisplay : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTextClick}
    >
      <Tooltip title={tooltip}>
        <span
          className={`${styles.text} ${multiline ? styles.multilineText : ''}`}
          data-empty={empty}
        >
          {multiline
            ? value.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < value.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))
            : value}
        </span>
      </Tooltip>
      {isHovered && showCopy && (
        <div className={styles.actions}>
          <button
            className={styles.copyButton}
            onClick={e => {
              e.stopPropagation();
              handleCopy();
            }}
            type="button"
            title="Copy"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableText;
