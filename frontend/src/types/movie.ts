export interface MovieInput {
  title: string;
  genre: string;
  rating: number;
  year: number;
}

export interface Movie {
  id: string;
  title: string;
  genre: string;
  rating: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface CursorMovieListResponse {
  movies: Movie[];
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

export interface GenreStats {
  name: string;
  count: number;
}

export interface YearStats {
  year: number;
  count: number;
}

export interface SummaryStats {
  totalMovies: number;
  averageRating: number;
  topGenres: GenreStats[];
  totalGenres: number;
}

export interface MovieFilters {
  genre?: string;
  min_rating?: number;
  year?: number;
  title?: string;
  cursor?: string;
  limit?: number;
}