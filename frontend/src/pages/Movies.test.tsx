import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import Movies from './Movies';
import { movieService } from '../services/movieService';
import { Movie } from '../types/movie';

jest.mock('../services/movieService');
jest.mock('react-router-dom');

const mockMovieService = movieService as jest.Mocked<typeof movieService>;
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockSetSearchParams = jest.fn();

const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'Test Movie 1',
    year: 2023,
    rating: 8.5,
    genre: 'Action',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Test Movie 2',
    year: 2022,
    rating: 7.5,
    genre: 'Drama',
    created_at: '2022-01-01T00:00:00Z',
    updated_at: '2022-01-01T00:00:00Z'
  }
];

describe('Movies', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = jest.fn();
    jest.clearAllMocks();
    mockSetSearchParams.mockClear();
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), mockSetSearchParams]);
    mockMovieService.getAvailableYears.mockResolvedValue([2023, 2022, 2021]);
    mockMovieService.getAvailableGenres.mockResolvedValue(['Action', 'Drama', 'Comedy']);
    mockMovieService.getMovies.mockResolvedValue({
      movies: mockMovies,
      next_cursor: null,
      has_more: false,
      limit: 20
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Movies')).toBeInTheDocument();
    // Check for loading skeletons using a more specific query
    const loadingSkeletons = document.querySelectorAll('[class*="loadingSkeleton"]');
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('renders movies after loading', async () => {
    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
      expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
    });
  });

  it('renders error message when API fails', async () => {
    mockMovieService.getMovies.mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load movies. Please check if the backend is running.')).toBeInTheDocument();
    });
  });

  it('switches between grid and list view', async () => {
    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    });

    const listViewButton = screen.getByText('List View');
    fireEvent.click(listViewButton);
    
    // Check if the button has the active class
    expect(listViewButton.className).toContain('viewButtonActive');
  });

  it('filters movies by genre', async () => {
    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    });

    // Find the genre select by role and filter options
    const genreSelect = screen.getAllByRole('combobox')[0]; // First select is Genre
    fireEvent.change(genreSelect, { target: { value: 'Action' } });

    // Wait for the setSearchParams to be called
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  it('filters movies by minimum rating', async () => {
    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    });

    // Find the rating select by its parent label text
    const ratingLabel = screen.getByText('Minimum Rating');
    const ratingSelect = ratingLabel.parentElement?.querySelector('select');
    
    if (ratingSelect) {
      fireEvent.change(ratingSelect, { target: { value: '7' } });
    }

    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  it('filters movies by year', async () => {
    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    });

    // Find the year select by role - it's the third select (Genre, Rating, Year)
    const yearSelect = screen.getAllByRole('combobox')[2]; // Third select is Year
    fireEvent.change(yearSelect, { target: { value: '2023' } });

    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  it('renders empty state when no movies found', async () => {
    mockMovieService.getMovies.mockResolvedValue({
      movies: [],
      next_cursor: null,
      has_more: false,
      limit: 20
    });

    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No movies found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search criteria')).toBeInTheDocument();
    });
  });

  it('loads more movies when button is clicked', async () => {
    // First render with hasMore = true
    mockMovieService.getMovies.mockResolvedValue({
      movies: mockMovies,
      next_cursor: 'next-page',
      has_more: true,
      limit: 20
    });

    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    });

    // Mock the next page response
    const moreMovies: Movie[] = [
      {
        id: '3',
        title: 'Test Movie 3',
        year: 2021,
        rating: 9.0,
        genre: 'Comedy',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-01T00:00:00Z'
      }
    ];

    mockMovieService.getMovies.mockResolvedValue({
      movies: moreMovies,
      next_cursor: null,
      has_more: false,
      limit: 20
    });

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(mockMovieService.getMovies).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: 'next-page' })
      );
    });
  });

  it('retries loading movies when retry button is clicked after error', async () => {
    mockMovieService.getMovies.mockRejectedValueOnce(new Error('API Error'));

    render(
      <MemoryRouter>
        <Movies />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load movies. Please check if the backend is running.')).toBeInTheDocument();
    });

    // Mock successful response for retry
    mockMovieService.getMovies.mockResolvedValueOnce({
      movies: mockMovies,
      next_cursor: null,
      has_more: false,
      limit: 20
    });

    // Find and click retry button (assuming ErrorMessage component has one)
    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    });
  });
});