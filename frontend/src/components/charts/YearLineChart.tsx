import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { YearStats } from '../../types/movie';
import styles from './Charts.module.css';

interface YearLineChartProps {
  data: YearStats[];
  loading?: boolean;
}

const YearLineChart: React.FC<YearLineChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>
          Loading chart data...
        </div>
      </div>
    );
  }

  // Sort data by year for proper line chart display
  const sortedData = [...data].sort((a, b) => a.year - b.year);

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.yearChartTitle}>
        Movies by Year
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={sortedData}
          margin={{ top: 10, right: 30, left: 30, bottom: 20 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#333" 
            strokeOpacity={0.3}
            horizontal={true}
            vertical={true}
          />
          <XAxis 
            dataKey="year" 
            stroke="#9e9e9e"
            tick={{ fill: '#9e9e9e' }}
            padding={{ left: 30, right: 10 }}
            axisLine={{ stroke: 'transparent' }}
          />
          <YAxis 
            stroke="#9e9e9e"
            tick={{ fill: '#9e9e9e' }}
            axisLine={{ stroke: 'transparent' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2e2e2e',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
            labelStyle={{ color: '#ffffff' }}
            itemStyle={{ color: '#E50914' }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#E50914"
            strokeWidth={2}
            dot={{ fill: '#E50914', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YearLineChart;