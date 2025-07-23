import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Movie } from '../../types/movie';
import StarIcon from '../icons/StarIcon';
import styles from './MovieCard.module.css';

interface MovieCardProps {
  movie: Movie;
  view?: 'grid' | 'list';
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, view = 'grid' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    navigate(`/movie/${movie.id}`, { state: { from: location.pathname } });
  };

  if (view === 'list') {
    return (
      <div
        onClick={handleClick}
        className={styles.listItem}
      >
        <div className={styles.listContent}>
          <div className={styles.listTitle}>
            <h3>{movie.title}</h3>
          </div>
          <div className={styles.listMeta}>
            <span>{movie.genre}</span>
            <span>{movie.year}</span>
          </div>
        </div>
        <div className={`${styles.listRating} ${movie.rating >= 7 ? styles.highRating : ''}`}>
          <StarIcon />
          <span>{movie.rating.toFixed(1)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={styles.gridItem}
    >
      <h3 className={styles.gridTitle}>
        {movie.title}
      </h3>
      
      <div className={styles.gridMeta}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>
            Genre
          </span>
          <span className={styles.metaValue}>
            {movie.genre}
          </span>
        </div>
        
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>
            Year
          </span>
          <span className={styles.metaValue}>
            {movie.year}
          </span>
        </div>
      </div>
      
      <div className={styles.gridFooter}>
        <span className={styles.metaLabel}>
          Rating
        </span>
        <div className={`${styles.gridRating} ${movie.rating >= 7 ? styles.highRating : ''}`}>
          <StarIcon />
          <span className={styles.ratingValue}>
            {movie.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;