import { api } from './api';
import { 
  Movie, 
  MovieInput, 
  CursorMovieListResponse, 
  MovieFilters,
  SummaryStats,
  YearStats
} from '../types/movie';

export const movieService = {
  async createMovie(movie: MovieInput): Promise<Movie> {
    return api.post<Movie>('/movies', movie);
  },

  async getMovies(filters?: MovieFilters): Promise<CursorMovieListResponse> {
    return api.get<CursorMovieListResponse>('/movies', filters);
  },

  async getTopRatedMovies(cursor?: string, limit?: number): Promise<CursorMovieListResponse> {
    return api.get<CursorMovieListResponse>('/movies/top-rated', { cursor, limit });
  },

  async getMovieById(id: string): Promise<Movie> {
    return api.get<Movie>(`/movies/${id}`);
  },

  async getSummaryStats(): Promise<SummaryStats> {
    return api.get<SummaryStats>('/stats/summary');
  },

  async getStatsByYear(): Promise<YearStats[]> {
    return api.get<YearStats[]>('/stats/by-year');
  },

  async getAvailableYears(): Promise<number[]> {
    return api.get<number[]>('/movies/years');
  },

  async getAvailableGenres(): Promise<string[]> {
    return api.get<string[]>('/movies/genres');
  },
};