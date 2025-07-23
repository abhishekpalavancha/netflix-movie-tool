import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { Movie, CursorMovieListResponse } from '../../types/movie';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import styles from './Carousel.module.css';

interface MovieCarouselProps {
  title: string;
  fetchMovies: (cursor?: string) => Promise<CursorMovieListResponse>;
  loading?: boolean;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ title, fetchMovies, loading: parentLoading }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const moviesPerPage = 5;

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async (cursor?: string) => {
    try {
      if (cursor) {
        setFetchingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await fetchMovies(cursor);
      
      if (cursor) {
        setMovies(prev => [...prev, ...response.movies]);
      } else {
        setMovies(response.movies);
      }
      
      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err) {
      setError(`Failed to load ${title.toLowerCase()}`);
      console.error(`Error fetching ${title.toLowerCase()}:`, err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const handleNext = async () => {
    const nextIndex = currentIndex + moviesPerPage;
    
    // If we're approaching the end of loaded movies and there are more to fetch
    if (nextIndex + moviesPerPage >= movies.length && hasMore && nextCursor && !fetchingMore) {
      await loadMovies(nextCursor);
    }
    
    if (nextIndex < movies.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - moviesPerPage));
    }
  };

  const visibleMovies = movies.slice(currentIndex, currentIndex + moviesPerPage);
  const hasNext = currentIndex + moviesPerPage < movies.length || hasMore;
  const hasPrevious = currentIndex > 0;

  if (loading || parentLoading) {
    return (
      <div className={styles.carouselContainer}>
        <h2 className={styles.carouselTitle}>
          {title}
        </h2>
        <div className={styles.loadingGrid}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={styles.loadingCard}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || movies.length === 0) {
    return null;
  }

  return (
    <div className={styles.carouselContainer}>
      <h2 className={styles.carouselTitle}>
        {title}
      </h2>
      
      <div className={styles.carouselContent}>
        {/* Previous Arrow */}
        {hasPrevious && (
          <button
            onClick={handlePrevious}
            className={`${styles.navButton} ${styles.navButtonPrevious}`}
          >
            <ChevronLeftIcon className={styles.navIcon} />
          </button>
        )}

        {/* Next Arrow */}
        {hasNext && (
          <button
            onClick={handleNext}
            className={`${styles.navButton} ${styles.navButtonNext}`}
          >
            <ChevronRightIcon className={styles.navIcon} />
          </button>
        )}

        <div className={styles.moviesGrid}>
          {visibleMovies.map((movie, index) => (
            <div
              key={movie.id}
              className={styles.movieWrapper}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <MovieCard movie={movie} view="grid" />
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default MovieCarousel;