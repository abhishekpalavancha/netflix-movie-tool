import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, loading, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`${styles.statCard} ${onClick ? styles.clickable : ''}`}
    >
      <div className={styles.content}>
        <div>
          <p className={styles.title}>
            {title}
          </p>
          {loading ? (
            <div className={styles.skeleton} />
          ) : (
            <h2 className={styles.value}>
              {value}
            </h2>
          )}
        </div>
        {icon && (
          <div className={styles.icon}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;