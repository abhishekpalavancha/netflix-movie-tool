import React from 'react';
import MovieCarousel from './MovieCarousel';
import { movieService } from '../../services/movieService';

interface RecentlyAddedCarouselProps {
  loading?: boolean;
}

const RecentlyAddedCarousel: React.FC<RecentlyAddedCarouselProps> = ({ loading }) => {
  return (
    <MovieCarousel
      title="Recently Added Movies"
      fetchMovies={(cursor) => movieService.getMovies({ cursor, limit: 20 })}
      loading={loading}
    />
  );
};

export default RecentlyAddedCarousel;