import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

import styles from './index.module.less';
import {
  CtaSection,
  EnginesSection,
  HeroSection,
  StorySection,
  type WelcomeEngineCard,
  type WelcomeHomeCopy,
} from './components';

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const repoURL = 'https://github.com/x1-pub/langhuan';
  const issueURL = `${repoURL}/issues/new`;

  const home: WelcomeHomeCopy = useMemo(
    () => ({
      start: t('home.start'),
      question: t('home.question'),
      text1: t('home.text1'),
      text2: t('home.text2'),
      text3: t('home.text3'),
      d2: t('home.d2'),
      story1: t('home.story1'),
      story2: t('home.story2'),
      support: t('home.support'),
      ready: t('home.ready'),
      startNow: t('home.startNow'),
      freeNow: t('home.freeNow'),
      github: t('home.github'),
      meta: {
        license: t('home.meta.license'),
        engines: t('home.meta.engines'),
        availability: t('home.meta.availability'),
      },
      shell: {
        title: t('home.shell.title'),
        tabWorkspace: t('home.shell.tabWorkspace'),
        tabAgent: t('home.shell.tabAgent'),
        tabDeploy: t('home.shell.tabDeploy'),
        hint: t('home.shell.hint'),
        assistant: t('home.shell.assistant'),
        you: t('home.shell.you'),
        message1: t('home.shell.message1'),
        message2: t('home.shell.message2'),
        status: t('home.shell.status'),
      },
    }),
    [t],
  );

  const engines = useMemo<WelcomeEngineCard[]>(
    () => [
      {
        key: 'mysql',
        name: 'MySQL',
        description: t('home.engines.mysqlDesc'),
        tags: [t('home.engines.mysqlTag1'), t('home.engines.mysqlTag2')],
        className: styles.engineCardScatterA,
      },
      {
        key: 'mariadb',
        name: 'MariaDB',
        description: t('home.engines.mariadbDesc'),
        tags: [t('home.engines.mariadbTag1'), t('home.engines.mariadbTag2')],
        className: styles.engineCardScatterB,
      },
      {
        key: 'redis',
        name: 'Redis',
        description: t('home.engines.redisDesc'),
        tags: [t('home.engines.redisTag1'), t('home.engines.redisTag2')],
        className: styles.engineCardScatterC,
      },
      {
        key: 'mongo',
        name: 'MongoDB',
        description: t('home.engines.mongoDesc'),
        tags: [t('home.engines.mongoTag1'), t('home.engines.mongoTag2')],
        className: styles.engineCardScatterD,
      },
      {
        key: 'pgsql',
        name: 'PostgreSQL',
        description: t('home.engines.pgsqlDesc'),
        tags: [t('home.engines.pgsqlTag1'), t('home.engines.pgsqlTag2')],
        className: styles.engineCardScatterE,
      },
    ],
    [t],
  );

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleStart = () => {
    navigate('/notselected');
  };

  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer}>
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.container}>
        <HeroSection
          home={home}
          enginesCount={engines.length}
          onStart={handleStart}
          onOpenGithub={() => openExternal(repoURL)}
          onOpenIssue={() => openExternal(issueURL)}
        />
        <StorySection title={t('siteName')} story1={home.story1} story2={home.story2} />
        <EnginesSection title={home.support} description={home.d2} engines={engines} />
        <CtaSection
          title={home.ready}
          description={home.startNow}
          startLabel={home.freeNow}
          githubLabel={home.github}
          onStart={handleStart}
          onOpenGithub={() => openExternal(repoURL)}
        />
      </div>
    </main>
  );
};

export default Welcome;
