import styles from '../index.module.less';

interface StorySectionProps {
  title: string;
  story1: string;
  story2: string;
}

const StorySection: React.FC<StorySectionProps> = ({ title, story1, story2 }) => {
  return (
    <section className={styles.storySection}>
      <article className={styles.storyCard}>
        <h2>{title}</h2>
        <p>{story1}</p>
        <p>{story2}</p>
      </article>
    </section>
  );
};

export default StorySection;
