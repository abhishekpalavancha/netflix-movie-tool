import React from 'react';
import MovieCarousel from './MovieCarousel';
import { movieService } from '../../services/movieService';

interface TopRatedCarouselProps {
  loading?: boolean;
}

const TopRatedCarousel: React.FC<TopRatedCarouselProps> = ({ loading }) => {
  return (
    <MovieCarousel
      title="Top Rated Movies"
      fetchMovies={(cursor) => movieService.getTopRatedMovies(cursor, 20)}
      loading={loading}
    />
  );
};

export default TopRatedCarousel;