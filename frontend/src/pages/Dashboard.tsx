import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard, TopRatedCarousel, RecentlyAddedCarousel } from '../components/ui';
import { GenresBarChart, YearLineChart } from '../components/charts';
import { ErrorMessage } from '../components/common';
import { movieService } from '../services/movieService';
import { SummaryStats, YearStats } from '../types/movie';
import styles from './Dashboard.module.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [yearStats, setYearStats] = useState<YearStats[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingYears, setLoadingYears] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaryStats = async () => {
    try {
      setLoadingSummary(true);
      setError(null);
      const data = await movieService.getSummaryStats();
      setSummaryStats(data);
    } catch (err) {
      setError('Failed to load summary statistics. Please check if the backend is running.');
      console.error('Error fetching summary stats:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchYearStats = async () => {
    try {
      setLoadingYears(true);
      const data = await movieService.getStatsByYear();
      setYearStats(data);
    } catch (err) {
      console.error('Error fetching year stats:', err);
    } finally {
      setLoadingYears(false);
    }
  };

  useEffect(() => {
    fetchSummaryStats();
    fetchYearStats();
  }, []);

  const handleRetry = () => {
    fetchSummaryStats();
    fetchYearStats();
  };

  return (
    <div>
      <h1 className={styles.title}>
        Movie Dashboard
      </h1>

      {error && (
        <ErrorMessage message={error} onRetry={handleRetry} />
      )}

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Total Movies"
          value={summaryStats?.totalMovies || 0}
          loading={loadingSummary}
          onClick={() => navigate('/movies')}
        />
        <StatCard
          title="Average Rating"
          value={summaryStats ? `${summaryStats.averageRating}/10` : '0/10'}
          loading={loadingSummary}
        />
        <StatCard
          title="Genres Tracked"
          value={summaryStats?.totalGenres || 0}
          loading={loadingSummary}
        />
      </div>

      {/* Charts */}
      <div className={styles.chartsContainer}>
         <YearLineChart 
          data={yearStats} 
          loading={loadingYears}
        />
        <GenresBarChart 
          data={summaryStats?.topGenres || []} 
          loading={loadingSummary}
        />
      </div>

      {/* Top Rated Movies Carousel */}
      <TopRatedCarousel loading={loadingSummary} />

      {/* Recently Added Movies Carousel */}
      <RecentlyAddedCarousel loading={loadingSummary} />

      {/* Info Section */}
      {!loadingSummary && summaryStats && summaryStats.totalMovies === 0 && (
        <div className={styles.emptyStateContainer}>
          <h3 className={styles.emptyStateTitle}>
            No Movies in Database
          </h3>
          <p className={styles.emptyStateText}>
            Start by adding some movies to see analytics and insights.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;