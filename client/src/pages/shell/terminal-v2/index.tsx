import React, { useState, useRef, useEffect, type KeyboardEvent } from 'react';

import styles from './index.module.less';
import { KEYWORDS, LANG_HUAN, TITLE_PREFIX, WELCOME } from './constants';
import { ansiToHtml } from './ansi-parser';
import { EConnectionType } from '@packages/types/connection';

interface TerminalProps {
  title?: React.ReactNode;
  prompt?: string;
  type: EConnectionType;
  onExecuteCommand: (command: string) => Promise<string>;
}

interface CommandHistory {
  command: string;
  timestamp: Date;
}

const TerminalV2: React.FC<TerminalProps> = props => {
  const { title = 'Terminal', prompt = '>', type, onExecuteCommand } = props;
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState<string[]>([...WELCOME[type], LANG_HUAN]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ left: 0, top: 0 });
  const [isExecuting, setIsExecuting] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 点击外部区域关闭智能提示
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSuggestions &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // 点击终端任意地方聚焦到输入框
  const handleTerminalClick = (e: React.MouseEvent) => {
    // 如果点击的是智能提示列表，不聚焦输入框
    if (suggestionsRef.current && suggestionsRef.current.contains(e.target as Node)) {
      return;
    }

    // 如果用户正在选择文本，不聚焦输入框
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    // 如果点击的是已有的终端行内容，不聚焦输入框
    const target = e.target as HTMLElement;
    if (target.closest(`.${styles.terminalLine}`)) {
      return;
    }

    // 聚焦到输入框
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const calculateSuggestionPosition = (cursorPos: number) => {
    if (!inputRef.current) return { left: 0, top: 0 };

    const textarea = inputRef.current;
    const text = textarea.value;
    const textBeforeCursor = text.substring(0, cursorPos);

    // 创建临时元素来模拟 textarea 的文本渲染
    const tempDiv = document.createElement('div');
    const computedStyle = window.getComputedStyle(textarea);

    // 复制 textarea 的样式到临时元素
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.whiteSpace = computedStyle.whiteSpace;
    tempDiv.style.wordWrap = computedStyle.wordWrap;
    tempDiv.style.overflowWrap = computedStyle.overflowWrap;
    tempDiv.style.font = computedStyle.font;
    tempDiv.style.fontSize = computedStyle.fontSize;
    tempDiv.style.fontFamily = computedStyle.fontFamily;
    tempDiv.style.lineHeight = computedStyle.lineHeight;
    tempDiv.style.width = `${textarea.clientWidth}px`;
    tempDiv.style.padding = computedStyle.padding;
    tempDiv.style.border = computedStyle.border;
    tempDiv.style.boxSizing = computedStyle.boxSizing;

    document.body.appendChild(tempDiv);

    try {
      // 设置光标前的文本
      tempDiv.textContent = textBeforeCursor;

      // 创建一个 span 来标记光标位置
      const cursorSpan = document.createElement('span');
      cursorSpan.textContent = '|';
      tempDiv.appendChild(cursorSpan);

      // 获取光标位置
      const cursorRect = cursorSpan.getBoundingClientRect();
      const tempDivRect = tempDiv.getBoundingClientRect();

      const left = cursorRect.left - tempDivRect.left;
      const top = cursorRect.bottom - tempDivRect.top + 4;

      // 边界检查
      const containerWidth = textarea.clientWidth;
      const suggestionWidth = 200;
      const adjustedLeft =
        left + suggestionWidth > containerWidth
          ? Math.max(0, containerWidth - suggestionWidth)
          : left;

      return { left: adjustedLeft, top };
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const getSuggestions = (input: string, cursorPos: number): string[] => {
    const beforeCursor = input.substring(0, cursorPos);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1]?.toUpperCase() || '';

    if (currentWord.length < 1) return [];

    return KEYWORDS[type]
      .filter(keyword => keyword.startsWith(currentWord) && keyword !== currentWord)
      .slice(0, 5);
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleInputChange = (value: string) => {
    setCurrentInput(value);

    // 调整 textarea 高度
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);

    // 使用输入框的当前光标位置
    const currentCursorPos = inputRef.current?.selectionStart || value.length;
    const suggestions = getSuggestions(value, currentCursorPos);
    setSuggestions(suggestions);
    setShowSuggestions(suggestions.length > 0);
    setSelectedSuggestion(0);

    // 计算智能提示框位置
    if (suggestions.length > 0) {
      const position = calculateSuggestionPosition(currentCursorPos);
      setSuggestionPosition(position);
    }
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isExecuting) {
      return;
    }

    const target = e.target as HTMLTextAreaElement;

    // 更新光标位置
    setCursorPosition(target.selectionStart);

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }

      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestion]);
        return;
      }

      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === 'ArrowUp' && !showSuggestions) {
      const textBeforeCursor = currentInput.substring(0, target.selectionStart);
      const currentLineIndex = textBeforeCursor.split('\n').length - 1;

      // 如果不在第一行，让光标正常上移
      if (currentLineIndex > 0) {
        return; // 不阻止默认行为，让光标正常移动
      }

      // 在第一行时才处理历史命令
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex =
          historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex].command);
      }
      return;
    }

    if (e.key === 'ArrowDown' && !showSuggestions) {
      const lines = currentInput.split('\n');
      const textBeforeCursor = currentInput.substring(0, target.selectionStart);
      const currentLineIndex = textBeforeCursor.split('\n').length - 1;

      // 如果不在最后一行，让光标正常下移
      if (currentLineIndex < lines.length - 1) {
        return; // 不阻止默认行为，让光标正常移动
      }

      // 在最后一行时才处理历史命令
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : -1;
        setHistoryIndex(newIndex);
        setCurrentInput(newIndex === -1 ? '' : commandHistory[newIndex].command);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter 强制换行
        return;
      }

      e.preventDefault();

      const trimmedInput = currentInput.trim();
      if (!trimmedInput) return;

      // 检查是否以分号结尾
      if (type === 'mysql' && !trimmedInput.endsWith(';')) {
        // 不以分号结尾，在光标位置插入换行
        const textarea = e.target as HTMLTextAreaElement;
        const cursorPos = textarea.selectionStart;
        const beforeCursor = currentInput.substring(0, cursorPos);
        const afterCursor = currentInput.substring(cursorPos);

        setCurrentInput(beforeCursor + '\n' + afterCursor);

        // 调整高度并设置光标位置
        setTimeout(() => {
          adjustTextareaHeight();
          if (inputRef.current) {
            const newCursorPos = cursorPos + 1;
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            setCursorPosition(newCursorPos);
          }
        }, 0);
        return;
      }

      // 执行命令
      executeCommand(trimmedInput);
    }
  };

  const applySuggestion = (suggestion: string) => {
    const beforeCursor = currentInput.substring(0, cursorPosition);
    const afterCursor = currentInput.substring(cursorPosition);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';

    const newBeforeCursor =
      beforeCursor.substring(0, beforeCursor.length - currentWord.length) + suggestion;
    const newInput = newBeforeCursor + afterCursor;

    setCurrentInput(newInput);
    setShowSuggestions(false);

    // 设置光标位置到建议词后面
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = newBeforeCursor.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  const executeCommand = async (command: string) => {
    // 将换行符转换为空格，清理多余的空格
    const cleanedCommand = command.replace(/\s+/g, ' ').trim();

    // 设置执行状态
    setIsExecuting(true);

    // 添加到历史记录
    const newHistoryItem: CommandHistory = {
      command: cleanedCommand,
      timestamp: new Date(),
    };
    setCommandHistory(prev => [...prev, newHistoryItem]);
    setHistoryIndex(-1);

    // 添加到输出
    setOutput(prev => [...prev, `${prompt} ${cleanedCommand}`, '正在执行...']);

    // 清空输入
    setCurrentInput('');
    setShowSuggestions(false);

    try {
      // 执行命令并获取结果
      const result = await onExecuteCommand(cleanedCommand);

      // 更新输出结果
      setOutput(prev => {
        const newOutput = [...prev];
        newOutput[newOutput.length - 1] = result;
        newOutput.push('');
        return newOutput;
      });
    } catch (error) {
      // 处理错误
      const errorMessage = `\x1b[31m错误: ${error instanceof Error ? error.message : '未知错误'}\x1b[0m`;
      setOutput(prev => {
        const newOutput = [...prev];
        newOutput[newOutput.length - 1] = errorMessage;
        newOutput.push('');
        return newOutput;
      });
    } finally {
      // 重置执行状态
      setIsExecuting(false);
    }
  };

  return (
    <div className={styles.terminalContainer} onClick={handleTerminalClick}>
      <div className={styles.terminalHeader}>
        <div className={styles.terminalTitle}>{`${TITLE_PREFIX[type]}(${title})`}</div>
        <div className={styles.terminalControls}>
          <button
            className={`${styles.terminalBtn} ${styles.clear}`}
            onClick={() => setOutput([''])}
          >
            清空
          </button>
        </div>
      </div>

      <div className={styles.terminalContent}>
        {output.map((line, index) => (
          <div
            key={index}
            className={styles.terminalLine}
            dangerouslySetInnerHTML={{ __html: ansiToHtml(line) }}
          />
        ))}

        <div className={styles.terminalInputLine} style={{ opacity: isExecuting ? 0 : 1 }}>
          <span className={styles.terminalPrompt}>{prompt}</span>
          <div className={styles.terminalInputContainer}>
            <textarea
              ref={inputRef}
              value={currentInput}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onSelect={e => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
              className={styles.terminalInput}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div
                className={styles.suggestionsPopup}
                ref={suggestionsRef}
                style={{
                  left: `${suggestionPosition.left}px`,
                  top: `${suggestionPosition.top}px`,
                  width: '200px',
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={`${styles.suggestionItem} ${index === selectedSuggestion ? styles.selected : ''}`}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalV2;
