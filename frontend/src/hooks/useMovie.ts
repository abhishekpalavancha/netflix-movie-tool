import { useState, useEffect, useCallback } from 'react';
import { movieService } from '../services/movieService';
import { Movie } from '../types/movie';

interface UseMovieResult {
  movie: Movie | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMovie = (id: string): UseMovieResult => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await movieService.getMovieById(id);
      setMovie(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch movie');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  return {
    movie,
    loading,
    error,
    refetch: fetchMovie,
  };
};