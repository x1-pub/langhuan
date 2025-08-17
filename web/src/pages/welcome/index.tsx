import React from "react";
import { useTranslation } from 'react-i18next';
import { GroupOutlined, LinkOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useNavigate } from "react-router";

import styles from './index.module.less'

const Welcome: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const openIssues = () => {
    window.open('https://github.com/CleverLiurx/langhuange/issues/new')
  }

  const handleStart = () => {
    navigate('/notselected')
  }

  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.heroBackground} />
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            史上最强大的
            <br />
            <span className={styles.heroTitleGradient}>WEB数据库管理平台</span>
          </h1>
          <p className={styles.heroSubtitle}>轻松管理您的 MySQL、Redis、MongoDB 和 PostgreSQL 数据库</p>
          <div className={styles.heroButtons}>
            <button className={styles.primaryButton} onClick={handleStart}>{t('homeStart')}</button>
            <button className={styles.secondaryButton} onClick={openIssues}>{t('homeQuestion')}<LinkOutlined /></button>
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
            <h2 className={styles.sectionTitle}>为什么选择我们？</h2>
            <p className={styles.sectionSubtitle}>除了开源，三大核心优势，让数据库管理变得前所未有的简单</p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <SafetyOutlined style={{ fontSize: '32px' }} color="#000" />
              </div>
              <h3 className={styles.featureTitle}>安全</h3>
              <p className={styles.featureDescription}>
                您可以选择离线连接模式，服务器不会保存您的任何信息（如数据库密码等），确保数据安全无忧
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <GroupOutlined style={{ fontSize: '32px' }} color="#000" />
              </div>
              <h3 className={styles.featureTitle}>多样</h3>
              <p className={styles.featureDescription}>
                提供了 MySQL、Redis、MongoDB 和 PostgreSQL 多种类型的主流数据库引擎，满足各种需求
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ThunderboltOutlined style={{ fontSize: '32px' }} color="#000" />
              </div>
              <h3 className={styles.featureTitle}>简洁</h3>
              <p className={styles.featureDescription}>
                极简的操作界面，友善的交互方式，使得任何人都可以轻松管理数据库，无需复杂学习
              </p>
            </div>
          </div>
        </div>
      </section>


      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyContent}>
            <h2 className={styles.storyTitle}>琅嬛阁</h2>
            <div className={styles.storyText}>
              <p className={styles.storyParagraph}>
                "琅嬛"源自上古神话中藏纳万卷天书的仙府，寓意无尽的知识宝藏。本平台以"琅嬛阁"为名，致力于打造现代数据世界的智慧中枢——通过可视化技术，让数据如古籍般可读、可探、可传承。
              </p>
              <p className={styles.storyParagraph}>
                无论是多维分析、智能决策，还是知识沉淀，皆在此一览无余。我们相信，数据不应囿于代码与表格，而应成为人人可驾驭的"仙藏万卷"。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.databaseSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>支持主流数据库</h2>
          </div>
          <div className={styles.databaseGrid}>
            {[
              { name: "MySQL", icon: "🐬" },
              { name: "Redis", icon: "🔴" },
              { name: "MongoDB", icon: "🍃" },
              { name: "PostgreSQL", icon: "🐘" },
            ].map((db) => (
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
          <h2 className={styles.ctaTitle}>准备好体验最强大的数据库管理了吗？</h2>
          <p className={styles.ctaSubtitle}>立即开始，让数据库管理变得简单高效</p>
          <button className={styles.ctaButton} onClick={handleStart}>免费开始使用</button>
        </div>
      </section>
    </main>
  )
}

export default Welcome