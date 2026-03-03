import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';

import ArrowRightIcon from '@/assets/svg/arrow-right.svg?react';
import GithubIcon from '@/assets/svg/github.svg?react';
import { getHomeCopy } from './home-copy';
import styles from './index.module.less';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const copy = useMemo(() => getHomeCopy(), []);
  const { home } = copy;
  const repoURL = 'https://github.com/x1-pub/langhuan';
  const issueURL = `${repoURL}/issues/new`;

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleStart = () => {
    navigate('/notselected');
  };

  const engineLayoutClasses = [
    styles.engineCardScatterA,
    styles.engineCardScatterB,
    styles.engineCardScatterC,
    styles.engineCardScatterD,
    styles.engineCardScatterE,
  ];

  const engines = [
    {
      key: 'mysql',
      name: 'MySQL',
      description: home.engines.mysqlDesc,
      tags: [home.engines.mysqlTag1, home.engines.mysqlTag2],
    },
    {
      key: 'mariadb',
      name: 'MariaDB',
      description: home.engines.mariadbDesc,
      tags: [home.engines.mariadbTag1, home.engines.mariadbTag2],
    },
    {
      key: 'redis',
      name: 'Redis',
      description: home.engines.redisDesc,
      tags: [home.engines.redisTag1, home.engines.redisTag2],
    },
    {
      key: 'mongo',
      name: 'MongoDB',
      description: home.engines.mongoDesc,
      tags: [home.engines.mongoTag1, home.engines.mongoTag2],
    },
    {
      key: 'pgsql',
      name: 'PostgreSQL',
      description: home.engines.pgsqlDesc,
      tags: [home.engines.pgsqlTag1, home.engines.pgsqlTag2],
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer}>
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1 className={styles.title}>
              <span>{home.text1}</span>
              <span className={styles.titleAccent}>{home.text2}</span>
            </h1>
            <p className={styles.subtitle}>{home.text3}</p>

            <div className={styles.actionRow}>
              <button type="button" className={styles.primaryButton} onClick={handleStart}>
                {home.start}
                <span className={styles.buttonIcon} aria-hidden>
                  <ArrowRightIcon />
                </span>
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => openExternal(repoURL)}
              >
                <span className={styles.buttonIcon} aria-hidden>
                  <GithubIcon />
                </span>
                {home.github}
              </button>
            </div>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => openExternal(issueURL)}
            >
              {home.question}
            </button>

            <div className={styles.metaRow}>
              <article className={styles.metaCard}>
                <strong>MIT</strong>
                <span>{home.meta.license}</span>
              </article>
              <article className={styles.metaCard}>
                <strong>{engines.length}</strong>
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

        <section className={styles.storySection}>
          <article className={styles.storyCard}>
            <h2>{copy.siteName}</h2>
            <p>{home.story1}</p>
            <p>{home.story2}</p>
          </article>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{home.support}</h2>
            <p>{home.d2}</p>
          </div>
          <div className={styles.engineGrid}>
            {engines.map((engine, index) => (
              <article
                key={engine.key}
                className={`${styles.engineCard} ${engineLayoutClasses[index % engineLayoutClasses.length]}`}
              >
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

        <section className={styles.ctaSection}>
          <article className={styles.ctaCard}>
            <h2>{home.ready}</h2>
            <p>{home.startNow}</p>
            <div className={styles.ctaActions}>
              <button type="button" className={styles.primaryButton} onClick={handleStart}>
                {home.freeNow}
                <span className={styles.buttonIcon} aria-hidden>
                  <ArrowRightIcon />
                </span>
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => openExternal(repoURL)}
              >
                <span className={styles.buttonIcon} aria-hidden>
                  <GithubIcon />
                </span>
                {home.github}
              </button>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
};

export default Welcome;
