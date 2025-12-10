import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GroupOutlined,
  LinkOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';

import styles from './index.module.less';

const Welcome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openIssues = () => {
    window.open('https://github.com/CleverLiurx/langhuange/issues/new');
  };

  const handleStart = () => {
    navigate('/notselected');
  };

  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.heroBackground} />
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            {t('home.text1')}
            <br />
            <span className={styles.heroTitleGradient}>{t('home.text2')}</span>
          </h1>
          <p className={styles.heroSubtitle}>{t('home.text3')}</p>
          <div className={styles.heroButtons}>
            <button className={styles.primaryButton} onClick={handleStart}>
              {t('home.start')}
            </button>
            <button className={styles.secondaryButton} onClick={openIssues}>
              {t('home.question')}
              <LinkOutlined />
            </button>
          </div>
        </div>

        <div className={styles.geometricElement1} />
        <div className={styles.geometricElement2} />
        <div className={styles.geometricElement3} />
        <div className={styles.geometricElement4} />
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('home.t0')}</h2>
            <p className={styles.sectionSubtitle}>{t('home.d0')}</p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <SafetyOutlined style={{ fontSize: '32px' }} color="#000" />
              </div>
              <h3 className={styles.featureTitle}>{t('home.t1')}</h3>
              <p className={styles.featureDescription}>{t('home.d1')}</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <GroupOutlined style={{ fontSize: '32px' }} color="#000" />
              </div>
              <h3 className={styles.featureTitle}>{t('home.t2')}</h3>
              <p className={styles.featureDescription}>{t('home.d2')}</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ThunderboltOutlined style={{ fontSize: '32px' }} color="#000" />
              </div>
              <h3 className={styles.featureTitle}>{t('home.t3')}</h3>
              <p className={styles.featureDescription}>{t('home.d3')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyContent}>
            <h2 className={styles.storyTitle}>{t('siteName')}</h2>
            <div className={styles.storyText}>
              <p className={styles.storyParagraph}>{t('home.story1')}</p>
              <p className={styles.storyParagraph}>{t('home.story2')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.databaseSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('home.support')}</h2>
          </div>
          <div className={styles.databaseGrid}>
            {[
              { name: 'MySQL', icon: '🐬' },
              { name: 'Redis', icon: '🔴' },
              { name: 'MongoDB', icon: '🍃' },
              { name: 'PostgreSQL', icon: '🐘' },
            ].map(db => (
              <div key={db.name} className={styles.databaseCard}>
                <div className={styles.databaseIcon}>{db.icon}</div>
                <h3 className={styles.databaseName}>{db.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>{t('home.ready')}</h2>
          <p className={styles.ctaSubtitle}>{t('home.startNow')}</p>
          <button className={styles.ctaButton} onClick={handleStart}>
            {t('home.freeNow')}
          </button>
        </div>
      </section>
    </main>
  );
};

export default Welcome;
