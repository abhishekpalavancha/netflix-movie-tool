import React from 'react';
import { GenreStats } from '../../types/movie';
import styles from './Charts.module.css';

interface GenresBarChartProps {
  data: GenreStats[];
  loading?: boolean;
}

const GenresBarChart: React.FC<GenresBarChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>
          Loading chart data...
        </div>
      </div>
    );
  }

  // Calculate max count for percentage calculation
  const maxCount = Math.max(...data.map(item => item.count), 1);

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.genresChartTitle}>
        Top 5 Genres by Quantity
      </h3>
      <div className={styles.genresList}>
        {data.map((genre, index) => {
          const percentage = (genre.count / maxCount) * 100;
          return (
            <div key={index} className={styles.genreItem}>
              <span className={styles.genreName}>
                {genre.name}
              </span>
              <div className={styles.genreBarContainer}>
                <div 
                  className={styles.genreBar}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className={styles.genreCount}>
                {genre.count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenresBarChart;