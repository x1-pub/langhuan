import React from "react";
import { Button, Divider, Typography } from "antd";
import { useTranslation } from 'react-i18next';
import classNames from "classnames";
import { ArrowRightOutlined, LinkOutlined } from '@ant-design/icons'
import { useThemeMode } from "antd-style";
import { useNavigate } from "react-router";

import styles from './index.module.less'

const Welcome: React.FC =  () => {
  const { t, i18n } = useTranslation()
  const { isDarkMode } = useThemeMode();
  const navigate = useNavigate()

  const openIssues = () => {
    window.open('https://github.com/CleverLiurx/langhuange/issues/new')
  }

  const handleStart = () => {
    navigate('/notselected')
  }

  return (
    <div className={styles.welcome}>
      <div className={classNames(styles.title, { [styles.zh]: i18n.language === 'zh', [styles.dark]: isDarkMode })}>
        <span>{t('homeText1')}</span>
        <span>{t('homeText2')}</span>
      </div>
      <div className={classNames(styles.subTitle, { [styles.dark]: isDarkMode })}>{t('homeText3')}</div>
      <div className={styles.buttonGroup}>
        <Button type="primary" size="large" onClick={handleStart}>{t('homeStart')}<ArrowRightOutlined /></Button>
        <Button size="large" onClick={openIssues}>{t('homeQuestion')}<LinkOutlined /></Button>
      </div>
      <Divider />
      <Divider />
      <div className={styles.desc}>
        <div className={styles.descItem}>
          <Typography.Title level={2} className={styles.descTitle}>{t('homeDescT1')}</Typography.Title>
          <Typography.Text className={styles.descDetail}>{t('homeDescD1')}</Typography.Text>
        </div>
        <div className={styles.descItem}>
          <Typography.Title level={2} className={styles.descTitle}>{t('homeDescT2')}</Typography.Title>
          <Typography.Text className={styles.descDetail}>{t('homeDescD2')}</Typography.Text>
        </div>
        <div className={styles.descItem}>
          <Typography.Title level={2} className={styles.descTitle}>{t('homeDescT3')}</Typography.Title>
          <Typography.Text className={styles.descDetail}>{t('homeDescD3')}</Typography.Text>
        </div>
      </div>
      {/* <div className={styles.card}>
        <div className={styles.left}>
          <Typography.Title level={5}>
            “琅嬛”源自上古神话中藏纳万卷天书的仙府，寓意无尽的知识宝藏。
            本平台以“琅嬛阁”为名，致力于打造现代数据世界的智慧中枢——通过可视化技术，让数据如古籍般可读、可探、可传承。无论是多维分析、智能决策，还是知识沉淀，皆在此一览无余。
            我们相信，数据不应囿于代码与表格，而应成为人人可驾驭的“仙藏万卷”。
          </Typography.Title>
        </div>
        <div className={styles.right}>
          <Typography.Title level={5}>
            "Langhuan" originates from an ancient myth of a celestial library that housed infinite wisdom.
            Inspired by this legend, LoreVault reimagines the modern database as an interactive realm of knowledge.
            By transforming complex data into intuitive visual landscapes, we turn cryptic codes into readable, 
            explorable, and inheritable insights. From multidimensional analysis to AI-driven decisions, every piece of data becomes a scroll of clarity here.
            We believe data should not be confined to tables, but liberated as a "living archive" for all.
          </Typography.Title>
        </div>
      </div> */}
    </div>
  )
}

export default Welcome