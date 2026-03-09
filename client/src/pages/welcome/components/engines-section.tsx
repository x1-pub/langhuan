import styles from '../index.module.less';
import { WelcomeEngineCard } from './types';

interface EnginesSectionProps {
  title: string;
  description: string;
  engines: WelcomeEngineCard[];
}

const EnginesSection: React.FC<EnginesSectionProps> = ({ title, description, engines }) => {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.engineGrid}>
        {engines.map(engine => (
          <article key={engine.key} className={`${styles.engineCard} ${engine.className}`}>
            <h3>{engine.name}</h3>
            <p>{engine.description}</p>
            <div className={styles.engineMeta}>
              {engine.tags.map(tag => (
                <span key={tag} className={styles.engineTag}>
                  {tag}
                </span>
              ))}
              <span className={styles.engineSignal} aria-hidden />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default EnginesSection;
