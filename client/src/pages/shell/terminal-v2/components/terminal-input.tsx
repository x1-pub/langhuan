import { type KeyboardEventHandler, RefObject } from 'react';

import styles from '../index.module.less';

interface TerminalInputProps {
  prompt: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  suggestionsRef: RefObject<HTMLDivElement | null>;
  currentInput: string;
  isExecuting: boolean;
  showSuggestions: boolean;
  suggestions: string[];
  selectedSuggestion: number;
  suggestionPosition: {
    left: number;
    top: number;
  };
  onInputChange: (value: string) => void;
  onInputSelect: (selectionStart: number) => void;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onSuggestionClick: (value: string) => void;
}

const TerminalInput: React.FC<TerminalInputProps> = ({
  prompt,
  inputRef,
  suggestionsRef,
  currentInput,
  isExecuting,
  showSuggestions,
  suggestions,
  selectedSuggestion,
  suggestionPosition,
  onInputChange,
  onInputSelect,
  onKeyDown,
  onSuggestionClick,
}) => {
  return (
    <div className={styles.terminalInputLine} style={{ opacity: isExecuting ? 0 : 1 }}>
      <span className={styles.terminalPrompt}>{prompt}</span>
      <div className={styles.terminalInputContainer}>
        <textarea
          ref={inputRef}
          value={currentInput}
          onChange={event => onInputChange(event.target.value)}
          onKeyDown={onKeyDown}
          onSelect={event => onInputSelect(event.currentTarget.selectionStart)}
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
                className={`${styles.suggestionItem} ${
                  index === selectedSuggestion ? styles.selected : ''
                }`}
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalInput;
