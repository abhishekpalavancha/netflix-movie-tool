import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ErrorMessage } from '../components/common';
import { StarIcon } from '../components/icons';
import { movieService } from '../services/movieService';
import { Movie } from '../types/movie';
import styles from './MovieDetail.module.css';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'file-info'>('details');

  // Determine which page the user came from
  const getBackButtonText = () => {
    const from = (location.state as any)?.from;
    
    if (from === '/') {
      return 'Back to Dashboard';
    } else if (from === '/movies') {
      return 'Back to Movies';
    }
    // Default to going back
    return 'Back';
  };

  const fetchMovie = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await movieService.getMovieById(id);
      setMovie(data);
    } catch (err) {
      setError('Failed to load movie details. Please check if the backend is running.');
      console.error('Error fetching movie:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className={styles.loadingContainer} />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div>
        <button
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          ← Back
        </button>
        <ErrorMessage 
          message={error || 'Movie not found'} 
          onRetry={fetchMovie} 
        />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className={styles.backButton}
      >
        ← {getBackButtonText()}
      </button>

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              {movie.title}
            </h1>
            <div className={`${styles.ratingBadge} ${movie.rating >= 7 ? styles.ratingBadgeHighRated : styles.ratingBadgeNormal}`}>
              <StarIcon />
              <span className={styles.ratingValue}>
                {movie.rating.toFixed(1)}
              </span>
            </div>
          </div>
          
          <div className={styles.metadata}>
            <span>{movie.genre}</span>
            <span>•</span>
            <span>{movie.year}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('details')}
            className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : styles.tabInactive}`}
          >
            Movie Details
            {activeTab === 'details' && (
              <div className={styles.tabIndicator} />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('file-info')}
            className={`${styles.tab} ${activeTab === 'file-info' ? styles.tabActive : styles.tabInactive}`}
          >
            File Information
            {activeTab === 'file-info' && (
              <div className={styles.tabIndicator} />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'details' ? (
            <div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <h3>Genre</h3>
                  <p>{movie.genre}</p>
                </div>
                
                <div className={styles.detailItem}>
                  <h3>Release Year</h3>
                  <p>{movie.year}</p>
                </div>
                
                <div className={styles.detailItem}>
                  <h3>Rating</h3>
                  <p>{movie.rating} / 10</p>
                </div>
                
                <div className={styles.detailItem}>
                  <h3>Movie ID</h3>
                  <p className={styles.movieId}>{movie.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>

              <div className={styles.fileInfoGrid}>
                <div className={styles.detailItem}>
                  <h4>Date Added</h4>
                  <p>
                    {new Date(movie.created_at).toLocaleDateString()} at{' '}
                    {new Date(movie.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className={styles.detailItem}>
                  <h4>Last Updated</h4>
                  <p>
                    {new Date(movie.updated_at).toLocaleDateString()} at{' '}
                    {new Date(movie.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;