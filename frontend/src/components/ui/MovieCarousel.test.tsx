import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import MovieCarousel from './MovieCarousel';
import { Movie } from '../../types/movie';

// Mock the MovieCard component
jest.mock('./MovieCard', () => ({
  __esModule: true,
  default: ({ movie }: { movie: Movie }) => (
    <div data-testid={`movie-card-${movie.id}`}>
      {movie.title}
    </div>
  ),
}));

// Mock the icons
jest.mock('../icons/ChevronLeftIcon', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <span className={className}>ChevronLeft</span>
  ),
}));

jest.mock('../icons/ChevronRightIcon', () => ({
  __esModule: true,
  default: ({ className }: { className?: string }) => (
    <span className={className}>ChevronRight</span>
  ),
}));

// Mock CSS module
jest.mock('./Carousel.module.css', () => ({
  carouselContainer: 'carouselContainer',
  carouselTitle: 'carouselTitle',
  loadingGrid: 'loadingGrid',
  loadingCard: 'loadingCard',
  carouselContent: 'carouselContent',
  navButton: 'navButton',
  navButtonPrevious: 'navButtonPrevious',
  navButtonNext: 'navButtonNext',
  navIcon: 'navIcon',
  moviesGrid: 'moviesGrid',
  movieWrapper: 'movieWrapper',
}));

describe('MovieCarousel', () => {
  const mockMovies: Movie[] = [
    { id: '1', title: 'Movie 1', genre: 'Action', rating: 8.0, year: 2023, created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '2', title: 'Movie 2', genre: 'Drama', rating: 7.5, year: 2023, created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '3', title: 'Movie 3', genre: 'Comedy', rating: 7.0, year: 2023, created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '4', title: 'Movie 4', genre: 'Thriller', rating: 8.5, year: 2023, created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '5', title: 'Movie 5', genre: 'Sci-Fi', rating: 7.8, year: 2023, created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: '6', title: 'Movie 6', genre: 'Horror', rating: 6.9, year: 2023, created_at: '2023-01-01', updated_at: '2023-01-01' },
  ];

  const mockFetchMovies = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    mockFetchMovies.mockResolvedValue({ movies: mockMovies });
    
    render(<MovieCarousel title="Top Rated" fetchMovies={mockFetchMovies} />);
    
    expect(screen.getByText('Top Rated')).toBeInTheDocument();
    expect(screen.getByText('Top Rated').parentElement?.querySelector('.loadingGrid')).toBeInTheDocument();
    
    // Wait for async operations to complete
    await act(async () => {
      await waitFor(() => expect(mockFetchMovies).toHaveBeenCalled());
    });
  });

  it('renders movies after successful fetch', async () => {
    mockFetchMovies.mockResolvedValue({ movies: mockMovies });
    
    render(<MovieCarousel title="Top Rated" fetchMovies={mockFetchMovies} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
      expect(screen.getByText('Movie 1')).toBeInTheDocument();
    });

    // Should show first 5 movies
    expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('movie-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('movie-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('movie-card-4')).toBeInTheDocument();
    expect(screen.getByTestId('movie-card-5')).toBeInTheDocument();
    
    // Should not show the 6th movie initially
    expect(screen.queryByTestId('movie-card-6')).not.toBeInTheDocument();
  });

  it('handles navigation between pages', async () => {
    mockFetchMovies.mockResolvedValue({ movies: mockMovies });
    
    render(<MovieCarousel title="Top Rated" fetchMovies={mockFetchMovies} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByRole('button', { name: /ChevronRight/i });
    fireEvent.click(nextButton);

    // Should now show the 6th movie
    expect(screen.getByTestId('movie-card-6')).toBeInTheDocument();
    
    // Should not show the first movie anymore
    expect(screen.queryByTestId('movie-card-1')).not.toBeInTheDocument();

    // Click previous button
    const prevButton = screen.getByRole('button', { name: /ChevronLeft/i });
    fireEvent.click(prevButton);

    // Should show first 5 movies again
    expect(screen.getByTestId('movie-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('movie-card-6')).not.toBeInTheDocument();
  });

  it('handles empty movie list', async () => {
    mockFetchMovies.mockResolvedValue({ movies: [] });
    
    const { container } = render(<MovieCarousel title="Top Rated" fetchMovies={mockFetchMovies} />);
    
    // Wait for the loading state to finish
    await act(async () => {
      await waitFor(() => {
        expect(mockFetchMovies).toHaveBeenCalled();
      });
    });

    // Wait for component to finish updating
    await waitFor(() => {
      // Should not render anything when no movies
      expect(container.firstChild).toBeNull();
    });
  });

  it('handles fetch error gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetchMovies.mockRejectedValue(new Error('Failed to fetch'));
    
    const { container } = render(<MovieCarousel title="Top Rated" fetchMovies={mockFetchMovies} />);
    
    // Wait for the error to be handled
    await act(async () => {
      await waitFor(() => {
        expect(mockFetchMovies).toHaveBeenCalled();
      });
    });

    // Wait for component to finish updating
    await waitFor(() => {
      // Should not render anything on error
      expect(container.firstChild).toBeNull();
    });

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('respects parentLoading prop', () => {
    mockFetchMovies.mockResolvedValue({ movies: mockMovies });
    
    render(<MovieCarousel title="Top Rated" fetchMovies={mockFetchMovies} loading={true} />);
    
    // Should show loading state when parentLoading is true
    expect(screen.getByText('Top Rated').parentElement?.querySelector('.loadingGrid')).toBeInTheDocument();
  });
});