import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EConnectionType } from '@packages/types/connection';
import { KEYWORDS, LANG_HUAN } from '../constants';

interface UseTerminalSessionParams {
  type: EConnectionType;
  prompt: string;
  onExecuteCommand: (command: string) => Promise<string>;
}

const SQL_TERMINAL_TYPES = new Set<EConnectionType>([
  EConnectionType.MYSQL,
  EConnectionType.MARIADB,
  EConnectionType.PGSQL,
]);

const getWelcomeLines = (type: EConnectionType, t: (key: string) => string): string[] => {
  if (type === EConnectionType.MYSQL) {
    return [
      t('terminal.welcome.mysql.line1'),
      t('terminal.welcome.mysql.line2'),
      t('terminal.welcome.mysql.line3'),
    ];
  }

  if (type === EConnectionType.MARIADB) {
    return [
      t('terminal.welcome.mariadb.line1'),
      t('terminal.welcome.mariadb.line2'),
      t('terminal.welcome.mariadb.line3'),
    ];
  }

  if (type === EConnectionType.PGSQL) {
    return [
      t('terminal.welcome.pgsql.line1'),
      t('terminal.welcome.pgsql.line2'),
      t('terminal.welcome.pgsql.line3'),
    ];
  }

  if (type === EConnectionType.REDIS) {
    return [t('terminal.welcome.redis.line1'), t('terminal.welcome.redis.line2')];
  }

  return [
    t('terminal.welcome.mongodb.line1'),
    t('terminal.welcome.mongodb.line2'),
    '',
    t('terminal.welcome.mongodb.line3'),
    t('terminal.welcome.mongodb.line4'),
    '',
  ];
};

const calculateSuggestionPosition = (
  textarea: HTMLTextAreaElement,
  cursorPosition: number,
): { left: number; top: number } => {
  const textBeforeCursor = textarea.value.slice(0, cursorPosition);
  const tempDiv = document.createElement('div');
  const computedStyle = window.getComputedStyle(textarea);

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
    tempDiv.textContent = textBeforeCursor;
    const cursorMarker = document.createElement('span');
    cursorMarker.textContent = '|';
    tempDiv.appendChild(cursorMarker);

    const cursorRect = cursorMarker.getBoundingClientRect();
    const tempRect = tempDiv.getBoundingClientRect();
    const rawLeft = cursorRect.left - tempRect.left;
    const top = cursorRect.bottom - tempRect.top + 4;
    const maxPopupWidth = 200;
    const left =
      rawLeft + maxPopupWidth > textarea.clientWidth
        ? Math.max(0, textarea.clientWidth - maxPopupWidth)
        : rawLeft;

    return { left, top };
  } finally {
    document.body.removeChild(tempDiv);
  }
};

const resolveSuggestions = (
  input: string,
  cursorPosition: number,
  type: EConnectionType,
): string[] => {
  const beforeCursor = input.slice(0, cursorPosition);
  const words = beforeCursor.split(/\s+/);
  const currentWord = words[words.length - 1] || '';
  const normalizedWord = currentWord.trim().toLowerCase();

  if (!normalizedWord) {
    return [];
  }

  return KEYWORDS[type]
    .filter(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      return normalizedKeyword.startsWith(normalizedWord) && normalizedKeyword !== normalizedWord;
    })
    .slice(0, 5);
};

const getCursorLineIndex = (value: string, cursorPosition: number) => {
  return value.slice(0, cursorPosition).split('\n').length - 1;
};

export const useTerminalSession = ({
  type,
  prompt,
  onExecuteCommand,
}: UseTerminalSessionParams) => {
  const { t, i18n } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const welcomeOutput = useMemo(() => getWelcomeLines(type, t), [i18n.language, t, type]);
  const [output, setOutput] = useState<string[]>(() => [...welcomeOutput, LANG_HUAN]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ left: 0, top: 0 });

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const updateSuggestions = (nextInput: string, nextCursorPosition: number) => {
    const nextSuggestions = resolveSuggestions(nextInput, nextCursorPosition, type);
    setSuggestions(nextSuggestions);
    setShowSuggestions(nextSuggestions.length > 0);
    setSelectedSuggestion(0);

    if (nextSuggestions.length > 0 && inputRef.current) {
      setSuggestionPosition(calculateSuggestionPosition(inputRef.current, nextCursorPosition));
    }
  };

  const applySuggestion = (suggestion: string) => {
    const targetCursorPosition = inputRef.current?.selectionStart ?? cursorPosition;
    const beforeCursor = currentInput.slice(0, targetCursorPosition);
    const afterCursor = currentInput.slice(targetCursorPosition);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1] || '';
    const nextBeforeCursor =
      beforeCursor.slice(0, beforeCursor.length - currentWord.length) + suggestion;
    const nextInput = nextBeforeCursor + afterCursor;
    const nextCursor = nextBeforeCursor.length;

    setCurrentInput(nextInput);
    setCursorPosition(nextCursor);
    setShowSuggestions(false);

    requestAnimationFrame(() => {
      if (!inputRef.current) {
        return;
      }

      inputRef.current.setSelectionRange(nextCursor, nextCursor);
      inputRef.current.focus();
    });
  };

  const executeCommand = async (command: string) => {
    const cleanedCommand = command.replace(/\s+/g, ' ').trim();
    if (!cleanedCommand) {
      return;
    }

    setIsExecuting(true);
    setCommandHistory(previous => [...previous, cleanedCommand]);
    setHistoryIndex(-1);
    setOutput(previous => [...previous, `${prompt} ${cleanedCommand}`, t('terminal.executing')]);
    setCurrentInput('');
    setShowSuggestions(false);

    try {
      const result = await onExecuteCommand(cleanedCommand);
      setOutput(previous => {
        const nextOutput = [...previous];
        nextOutput[nextOutput.length - 1] = result;
        nextOutput.push('');
        return nextOutput;
      });
    } catch (error) {
      const errorMessage = `\x1b[31m${t('terminal.errorPrefix')}: ${
        error instanceof Error ? error.message : t('terminal.unknownError')
      }\x1b[0m`;
      setOutput(previous => {
        const nextOutput = [...previous];
        nextOutput[nextOutput.length - 1] = errorMessage;
        nextOutput.push('');
        return nextOutput;
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    const nextCursorPosition = inputRef.current?.selectionStart ?? value.length;
    setCursorPosition(nextCursorPosition);
    updateSuggestions(value, nextCursorPosition);
  };

  const handleInputSelect = (selectionStart: number) => {
    setCursorPosition(selectionStart);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isExecuting) {
      return;
    }

    const target = event.currentTarget;
    const nextCursorPosition = target.selectionStart;
    setCursorPosition(nextCursorPosition);

    if (showSuggestions && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestion(previous => (previous < suggestions.length - 1 ? previous + 1 : 0));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestion(previous => (previous > 0 ? previous - 1 : suggestions.length - 1));
        return;
      }

      if (event.key === 'Tab' || event.key === 'Enter') {
        event.preventDefault();
        applySuggestion(suggestions[selectedSuggestion]);
        return;
      }

      if (event.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (event.key === 'ArrowUp' && !showSuggestions) {
      const currentLineIndex = getCursorLineIndex(currentInput, nextCursorPosition);

      if (currentLineIndex > 0) {
        return;
      }

      event.preventDefault();
      if (commandHistory.length === 0) {
        return;
      }

      const nextHistoryIndex =
        historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      const nextCommand = commandHistory[nextHistoryIndex] || '';

      setHistoryIndex(nextHistoryIndex);
      setCurrentInput(nextCommand);
      setShowSuggestions(false);
      return;
    }

    if (event.key === 'ArrowDown' && !showSuggestions) {
      const currentLineIndex = getCursorLineIndex(currentInput, nextCursorPosition);
      const lineCount = currentInput.split('\n').length;
      if (currentLineIndex < lineCount - 1) {
        return;
      }

      event.preventDefault();
      if (historyIndex === -1) {
        return;
      }

      const nextHistoryIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : -1;
      setHistoryIndex(nextHistoryIndex);
      setCurrentInput(nextHistoryIndex === -1 ? '' : commandHistory[nextHistoryIndex] || '');
      setShowSuggestions(false);
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    const trimmedInput = currentInput.trim();
    if (!trimmedInput) {
      return;
    }

    if (SQL_TERMINAL_TYPES.has(type) && !trimmedInput.endsWith(';')) {
      const beforeCursor = currentInput.slice(0, nextCursorPosition);
      const afterCursor = currentInput.slice(nextCursorPosition);
      const nextInput = `${beforeCursor}\n${afterCursor}`;
      const nextCursor = nextCursorPosition + 1;

      setCurrentInput(nextInput);
      requestAnimationFrame(() => {
        if (!inputRef.current) {
          return;
        }

        inputRef.current.setSelectionRange(nextCursor, nextCursor);
        setCursorPosition(nextCursor);
      });
      return;
    }

    void executeCommand(trimmedInput);
  };

  const handleTerminalClick = (target: EventTarget | null) => {
    if (!target) {
      focusInput();
      return;
    }

    const element = target as HTMLElement;
    const hasTextSelection = window.getSelection()?.toString().length;
    if (hasTextSelection) {
      return;
    }

    if (suggestionsRef.current?.contains(element)) {
      return;
    }

    if (element.closest('[data-terminal-line="true"]')) {
      return;
    }

    focusInput();
  };

  const clearOutput = () => {
    setOutput([...welcomeOutput, LANG_HUAN]);
  };

  useEffect(() => {
    setOutput([...welcomeOutput, LANG_HUAN]);
  }, [welcomeOutput]);

  useEffect(() => {
    focusInput();
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [currentInput]);

  useEffect(() => {
    if (!outputRef.current) {
      return;
    }
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current?.contains(event.target as Node)) {
        return;
      }
      setShowSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  return {
    inputRef,
    suggestionsRef,
    outputRef,
    output,
    currentInput,
    isExecuting,
    showSuggestions,
    suggestions,
    selectedSuggestion,
    suggestionPosition,
    clearOutput,
    handleTerminalClick,
    handleInputChange,
    handleInputSelect,
    handleKeyDown,
    applySuggestion,
  };
};

export default useTerminalSession;
