import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MovieCard } from '../components/ui';
import { ErrorMessage } from '../components/common';
import { movieService } from '../services/movieService';
import { Movie, MovieFilters } from '../types/movie';
import '../App.css';
import styles from './Movies.module.css';

const Movies: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  
  // Derive filters directly from URL params
  const getFiltersFromParams = (params: URLSearchParams): MovieFilters => ({
    genre: params.get('genre') || undefined,
    min_rating: params.get('min_rating') ? Number(params.get('min_rating')) : undefined,
    year: params.get('year') ? Number(params.get('year')) : undefined,
    title: params.get('search') || undefined,
    limit: 20,
  });
  
  // Derive filters from current URL params
  const filters = getFiltersFromParams(searchParams);

  const fetchMovies = async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      
      const response = await movieService.getMovies({ ...filters, cursor });
      
      if (cursor) {
        setMovies(prev => [...prev, ...response.movies]);
      } else {
        setMovies(response.movies);
      }
      
      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (err) {
      setError('Failed to load movies. Please check if the backend is running.');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch movies when URL params change
  useEffect(() => {
    fetchMovies();
  }, [searchParams]);

  // Fetch available years and genres on component mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [years, genres] = await Promise.all([
          movieService.getAvailableYears(),
          movieService.getAvailableGenres()
        ]);
        setAvailableYears(years);
        setAvailableGenres(genres);
      } catch (err) {
        console.error('Failed to fetch available filters:', err);
      }
    };
    fetchFilters();
  }, []);

  const handleFilterChange = (key: keyof MovieFilters, value: any) => {
    // Start with current search params to preserve other filters
    const params = new URLSearchParams(searchParams);
    
    // Handle special case for 'title' which maps to 'search' in URL
    const paramKey = key === 'title' ? 'search' : key;
    
    // Set or delete the new value
    if (value) {
      params.set(paramKey, String(value));
    } else {
      params.delete(paramKey);
    }
    
    // Only update the URL - let the useEffect chain handle the rest
    setSearchParams(params);
  };


  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchMovies(nextCursor);
    }
  };

  const LoadingSkeleton = () => (
    <div className={`${styles.loadingGrid} ${viewMode === 'grid' ? styles.loadingGridView : styles.loadingListView}`}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`${styles.loadingSkeleton} ${viewMode === 'grid' ? styles.loadingSkeletonGrid : styles.loadingSkeletonList}`}
        />
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Movies
        </h1>
        
        <div className={styles.viewControls}>
          <button
            onClick={() => setViewMode('grid')}
            className={`${styles.viewButton} ${viewMode === 'grid' ? styles.viewButtonActive : ''}`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`${styles.viewButton} ${viewMode === 'list' ? styles.viewButtonActive : ''}`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Genre
          </label>
          <select
            className="dark-select"
            value={filters.genre || ''}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
          >
            <option value="">All Genres</option>
            {availableGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Minimum Rating
          </label>
          <select
            className="dark-select"
            value={filters.min_rating || ''}
            onChange={(e) => handleFilterChange('min_rating', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Ratings</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Year
          </label>
          <select
            className="dark-select"
            value={filters.year || ''}
            onChange={(e) => handleFilterChange('year', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={() => fetchMovies()} />
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : movies.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>
            No movies found
          </h3>
          <p className={styles.emptyStateText}>
            Try adjusting your filters or search criteria
          </p>
        </div>
      ) : (
        <>
          <div className={`${styles.moviesGrid} ${viewMode === 'grid' ? styles.moviesGridView : styles.moviesListView}`}>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} view={viewMode} />
            ))}
          </div>
          
          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className={styles.loadMoreButton}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Movies;