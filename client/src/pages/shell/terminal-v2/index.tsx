import React from 'react';
import { useTranslation } from 'react-i18next';

import { EConnectionType } from '@packages/types/connection';
import styles from './index.module.less';
import TerminalHeader from './components/terminal-header';
import TerminalOutput from './components/terminal-output';
import TerminalInput from './components/terminal-input';
import useTerminalSession from './hooks/use-terminal-session';

interface TerminalProps {
  title?: React.ReactNode;
  prompt?: string;
  type: EConnectionType;
  onExecuteCommand: (command: string) => Promise<string>;
}

const TerminalV2: React.FC<TerminalProps> = ({ title, prompt = '>', type, onExecuteCommand }) => {
  const { t } = useTranslation();
  const session = useTerminalSession({
    type,
    prompt,
    onExecuteCommand,
  });
  const resolvedTitle = `${t(`terminal.titlePrefix.${type}`)}(${title || t('terminal.title')})`;

  return (
    <div
      className={styles.terminalContainer}
      onClick={event => session.handleTerminalClick(event.target)}
    >
      <TerminalHeader
        title={resolvedTitle}
        clearLabel={t('terminal.clear')}
        onClear={session.clearOutput}
      />
      <div className={styles.terminalContent} ref={session.outputRef}>
        <TerminalOutput lines={session.output} />
        <TerminalInput
          prompt={prompt}
          inputRef={session.inputRef}
          suggestionsRef={session.suggestionsRef}
          currentInput={session.currentInput}
          isExecuting={session.isExecuting}
          showSuggestions={session.showSuggestions}
          suggestions={session.suggestions}
          selectedSuggestion={session.selectedSuggestion}
          suggestionPosition={session.suggestionPosition}
          onInputChange={session.handleInputChange}
          onInputSelect={session.handleInputSelect}
          onKeyDown={session.handleKeyDown}
          onSuggestionClick={session.applySuggestion}
        />
      </div>
    </div>
  );
};

export default TerminalV2;
