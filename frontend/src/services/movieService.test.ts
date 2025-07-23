import { movieService } from './movieService';
import { api } from './api';

// Mock the api module
jest.mock('./api');

describe('movieService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummaryStats', () => {
    it('fetches summary statistics successfully', async () => {
      const mockStats = {
        totalMovies: 100,
        averageRating: 7.8,
        totalGenres: 5,
        topGenres: [{ genre: 'Action', count: 25 }],
      };

      (api.get as jest.Mock).mockResolvedValue(mockStats);

      const result = await movieService.getSummaryStats();

      expect(api.get).toHaveBeenCalledWith('/stats/summary');
      expect(result).toEqual(mockStats);
    });

    it('handles API errors', async () => {
      const error = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(movieService.getSummaryStats()).rejects.toThrow('Network error');
    });
  });

  describe('createMovie', () => {
    it('creates a movie successfully', async () => {
      const newMovie = {
        title: 'Inception',
        year: 2010,
        rating: 8.8,
        genre: 'Sci-Fi',
      };

      const mockResponse = { id: '123', ...newMovie };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await movieService.createMovie(newMovie);

      expect(api.post).toHaveBeenCalledWith('/movies', newMovie);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMovies', () => {
    it('fetches movies without filters', async () => {
      const mockMovies = {
        movies: [{ id: '1', title: 'The Dark Knight' }],
        cursor: null,
        hasMore: false,
      };

      (api.get as jest.Mock).mockResolvedValue(mockMovies);

      const result = await movieService.getMovies();

      expect(api.get).toHaveBeenCalledWith('/movies', undefined);
      expect(result).toEqual(mockMovies);
    });

    it('fetches movies with filters', async () => {
      const mockMovies = {
        movies: [],
        cursor: 'next-cursor',
        hasMore: true,
      };

      const filters = { search: 'action', cursor: 'some-cursor' };
      (api.get as jest.Mock).mockResolvedValue(mockMovies);

      const result = await movieService.getMovies(filters);

      expect(api.get).toHaveBeenCalledWith('/movies', filters);
      expect(result).toEqual(mockMovies);
    });
  });
});