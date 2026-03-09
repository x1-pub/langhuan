import ArrowRightIcon from '@/assets/svg/arrow-right.svg?react';
import GithubIcon from '@/assets/svg/github.svg?react';

import styles from '../index.module.less';

interface CtaSectionProps {
  title: string;
  description: string;
  startLabel: string;
  githubLabel: string;
  onStart: () => void;
  onOpenGithub: () => void;
}

const CtaSection: React.FC<CtaSectionProps> = ({
  title,
  description,
  startLabel,
  githubLabel,
  onStart,
  onOpenGithub,
}) => {
  return (
    <section className={styles.ctaSection}>
      <article className={styles.ctaCard}>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className={styles.ctaActions}>
          <button type="button" className={styles.primaryButton} onClick={onStart}>
            {startLabel}
            <span className={styles.buttonIcon} aria-hidden>
              <ArrowRightIcon />
            </span>
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onOpenGithub}>
            <span className={styles.buttonIcon} aria-hidden>
              <GithubIcon />
            </span>
            {githubLabel}
          </button>
        </div>
      </article>
    </section>
  );
};

export default CtaSection;
