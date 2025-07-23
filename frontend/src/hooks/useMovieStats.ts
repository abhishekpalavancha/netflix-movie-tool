import { useState, useEffect, useCallback } from 'react';
import { movieService } from '../services/movieService';
import { SummaryStats, YearStats } from '../types/movie';

interface UseMovieStatsResult {
  summary: SummaryStats | null;
  yearlyStats: YearStats[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMovieStats = (): UseMovieStatsResult => {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [yearlyStats, setYearlyStats] = useState<YearStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [summaryData, yearlyData] = await Promise.all([
        movieService.getSummaryStats(),
        movieService.getStatsByYear(),
      ]);
      
      setSummary(summaryData);
      setYearlyStats(yearlyData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    summary,
    yearlyStats,
    loading,
    error,
    refetch: fetchStats,
  };
};