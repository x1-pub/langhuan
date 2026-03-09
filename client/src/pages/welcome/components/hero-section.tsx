import ArrowRightIcon from '@/assets/svg/arrow-right.svg?react';
import GithubIcon from '@/assets/svg/github.svg?react';

import styles from '../index.module.less';
import { WelcomeHomeCopy } from './types';

interface HeroSectionProps {
  home: WelcomeHomeCopy;
  enginesCount: number;
  onStart: () => void;
  onOpenGithub: () => void;
  onOpenIssue: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  home,
  enginesCount,
  onStart,
  onOpenGithub,
  onOpenIssue,
}) => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroLeft}>
        <h1 className={styles.title}>
          <span>{home.text1}</span>
          <span className={styles.titleAccent}>{home.text2}</span>
        </h1>
        <p className={styles.subtitle}>{home.text3}</p>

        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={onStart}>
            {home.start}
            <span className={styles.buttonIcon} aria-hidden>
              <ArrowRightIcon />
            </span>
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onOpenGithub}>
            <span className={styles.buttonIcon} aria-hidden>
              <GithubIcon />
            </span>
            {home.github}
          </button>
        </div>
        <button type="button" className={styles.linkButton} onClick={onOpenIssue}>
          {home.question}
        </button>

        <div className={styles.metaRow}>
          <article className={styles.metaCard}>
            <strong>MIT</strong>
            <span>{home.meta.license}</span>
          </article>
          <article className={styles.metaCard}>
            <strong>{enginesCount}</strong>
            <span>{home.meta.engines}</span>
          </article>
          <article className={styles.metaCard}>
            <strong>24/7</strong>
            <span>{home.meta.availability}</span>
          </article>
        </div>
      </div>

      <div className={styles.heroRight}>
        <div className={styles.shellCard}>
          <div className={styles.shellHeader}>
            <span className={styles.shellDot} />
            <span className={styles.shellDot} />
            <span className={styles.shellDot} />
            <span className={styles.shellTitle}>{home.shell.title}</span>
          </div>
          <div className={styles.shellTabs}>
            <span className={styles.shellTabActive}>{home.shell.tabWorkspace}</span>
            <span className={styles.shellTab}>{home.shell.tabAgent}</span>
            <span className={styles.shellTab}>{home.shell.tabDeploy}</span>
          </div>
          <div className={styles.shellHint}>{home.shell.hint}</div>

          <div className={styles.shellBody}>
            <div className={styles.shellLine}>
              <span className={styles.shellPrompt}>$</span>
              <code className={styles.shellCode}>inspect schema --db mysql_prod</code>
              <span className={`${styles.shellTag} ${styles.mysqlTone}`}>MySQL</span>
            </div>
            <div className={styles.shellLine}>
              <span className={styles.shellPrompt}>{'>'}</span>
              <code className={styles.shellCode}>SHOW VARIABLES LIKE 'version_comment';</code>
              <span className={`${styles.shellTag} ${styles.mysqlTone}`}>MariaDB</span>
            </div>
            <div className={styles.shellLine}>
              <span className={styles.shellPrompt}>{'>'}</span>
              <code className={styles.shellCode}>HGETALL cache:user:2048</code>
              <span className={`${styles.shellTag} ${styles.redisTone}`}>Redis</span>
            </div>
            <div className={styles.shellLine}>
              <span className={styles.shellPrompt}>{'>'}</span>
              <code className={styles.shellCode}>db.orders.aggregate([...])</code>
              <span className={`${styles.shellTag} ${styles.mongoTone}`}>MongoDB</span>
            </div>
            <div className={styles.shellLine}>
              <span className={styles.shellPrompt}>{'>'}</span>
              <code className={styles.shellCode}>SELECT * FROM audit_log LIMIT 50;</code>
              <span className={`${styles.shellTag} ${styles.pgsqlTone}`}>PostgreSQL</span>
            </div>
          </div>

          <div className={styles.messageList}>
            <article className={styles.messageItem}>
              <h4>{home.shell.assistant}</h4>
              <p>{home.shell.message1}</p>
            </article>
            <article className={`${styles.messageItem} ${styles.messageUser}`}>
              <h4>{home.shell.you}</h4>
              <p>{home.shell.message2}</p>
            </article>
          </div>
          <div className={styles.shellStatus}>
            <span className={styles.shellPulse} />
            <span>{home.shell.status}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
