import styles from '../index.module.less';
import { ansiToHtml } from '../ansi-parser';

interface TerminalOutputProps {
  lines: string[];
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ lines }) => {
  return (
    <>
      {lines.map((line, index) => (
        <div
          key={`${line}-${index}`}
          data-terminal-line="true"
          className={styles.terminalLine}
          dangerouslySetInnerHTML={{ __html: ansiToHtml(line) }}
        />
      ))}
    </>
  );
};

export default TerminalOutput;
