import styles from '../index.module.less';

interface TerminalHeaderProps {
  title: string;
  clearLabel: string;
  onClear: () => void;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({ title, clearLabel, onClear }) => {
  return (
    <div className={styles.terminalHeader}>
      <div className={styles.terminalTitle}>{title}</div>
      <div className={styles.terminalControls}>
        <button type="button" className={`${styles.terminalBtn} ${styles.clear}`} onClick={onClear}>
          {clearLabel}
        </button>
      </div>
    </div>
  );
};

export default TerminalHeader;
