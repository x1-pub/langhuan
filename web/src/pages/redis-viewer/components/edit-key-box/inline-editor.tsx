import type React from "react"
import { Tooltip } from "antd"
import { useState, useRef, useEffect } from "react"

import styles from "./inline-editor.module.less"

interface InlineEditProps {
  value: string
  onConfirm: (newValue: string) => void
  onCancel?: () => void
  className?: string
  placeholder?: string
  disabled?: boolean
  tip?: string;
}

const InlineEditor = ({
  value,
  onConfirm,
  onCancel,
  className,
  placeholder = "点击编辑...",
  disabled = false,
  tip,
}: InlineEditProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 当value prop变化时，同步更新inputValue
  useEffect(() => {
    setInputValue(value)
  }, [value])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel()
      }
    }

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEditing])

  // 进入编辑模式时自动聚焦并选中文本
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true)
      setInputValue(value)
    }
  }

  const handleConfirm = () => {
    onConfirm(inputValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setInputValue(value)
    setIsEditing(false)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div ref={containerRef} className={styles.editWrapper}>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${styles.input} ${className || ""}`}
          placeholder={placeholder}
        />
        <div className={styles.buttonGroup}>
          <button onClick={handleCancel} className={`${styles.button} ${styles.cancelButton}`} type="button">
            ✕
          </button>
          <button onClick={handleConfirm} className={`${styles.button} ${styles.confirmButton}`} type="button">
            ✓
          </button>
        </div>
      </div>
    )
  }

  return (
    <Tooltip title={tip} placement='left'>
      <span
        onClick={handleClick}
        className={`${styles.textDisplay} ${disabled ? styles.disabled : ""} ${!value ? styles.placeholder : ""} ${className || ""}`}
        title={disabled ? undefined : "点击编辑"}
      >
        {value || placeholder}
      </span>
    </Tooltip>
  )
}

export default InlineEditor
