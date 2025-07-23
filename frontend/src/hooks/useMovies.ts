import { useState, useEffect, useCallback } from 'react';
import { movieService } from '../services/movieService';
import { Movie } from '../types/movie';

interface UseMoviesOptions {
  search?: string;
  year?: number;
  genre?: string;
  sortBy?: 'title' | 'year' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMovies = (options: UseMoviesOptions = {}): UseMoviesResult => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await movieService.getMovies({
        title: options.search,
        year: options.year,
        genre: options.genre,
      });
      setMovies(response.movies);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.year, options.genre, options.sortBy, options.sortOrder]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return {
    movies,
    loading,
    error,
    refetch: fetchMovies,
  };
};