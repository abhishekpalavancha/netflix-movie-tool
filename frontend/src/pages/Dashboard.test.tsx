import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { movieService } from '../services/movieService';

jest.mock('../services/movieService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/ui', () => ({
  StatCard: ({ title, value, loading }: any) => (
    <div data-testid={`stat-card-${title}`}>
      {loading ? 'Loading...' : `${title}: ${value}`}
    </div>
  ),
  TopRatedCarousel: () => <div>TopRatedCarousel</div>,
  RecentlyAddedCarousel: () => <div>RecentlyAddedCarousel</div>,
}));

jest.mock('../components/charts', () => ({
  GenresBarChart: () => <div>GenresBarChart</div>,
  YearLineChart: () => <div>YearLineChart</div>,
}));

jest.mock('../components/common', () => ({
  ErrorMessage: ({ message, onRetry }: any) => (
    <div>
      <span>{message}</span>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
}))

describe('Dashboard', () => {
  const mockSummaryStats = {
    totalMovies: 150,
    averageRating: 7.5,
    totalGenres: 3,
    topGenres: [
      { genre: 'Action', count: 45 },
      { genre: 'Drama', count: 38 },
      { genre: 'Comedy', count: 30 },
    ],
  };

  const mockYearStats = [
    { year: 2021, count: 25 },
    { year: 2022, count: 40 },
    { year: 2023, count: 35 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard and loads data successfully', async () => {
    (movieService.getSummaryStats as jest.Mock).mockResolvedValue(mockSummaryStats);
    (movieService.getStatsByYear as jest.Mock).mockResolvedValue(mockYearStats);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Movie Dashboard')).toBeInTheDocument();

    // Check that loading states are shown
    expect(screen.getAllByText('Loading...')).toHaveLength(3);

    await waitFor(() => {
      expect(screen.getByText('Total Movies: 150')).toBeInTheDocument();
      expect(screen.getByText('Average Rating: 7.5/10')).toBeInTheDocument();
      expect(screen.getByText('Genres Tracked: 3')).toBeInTheDocument();
    });

    expect(movieService.getSummaryStats).toHaveBeenCalledTimes(1);
    expect(movieService.getStatsByYear).toHaveBeenCalledTimes(1);
  });

  it('handles API errors gracefully', async () => {
    (movieService.getSummaryStats as jest.Mock).mockRejectedValue(new Error('API Error'));
    (movieService.getStatsByYear as jest.Mock).mockResolvedValue(mockYearStats);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load summary statistics. Please check if the backend is running.')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Total Movies: 0')).toBeInTheDocument();
      expect(screen.getByText('Average Rating: 0/10')).toBeInTheDocument();
    });
  });

  it('shows empty state when no movies exist', async () => {
    const emptyStats = {
      totalMovies: 0,
      averageRating: 0,
      totalGenres: 0,
      topGenres: [],
    };
    
    (movieService.getSummaryStats as jest.Mock).mockResolvedValue(emptyStats);
    (movieService.getStatsByYear as jest.Mock).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Movies in Database')).toBeInTheDocument();
      expect(screen.getByText('Start by adding some movies to see analytics and insights.')).toBeInTheDocument();
    });
  });
});