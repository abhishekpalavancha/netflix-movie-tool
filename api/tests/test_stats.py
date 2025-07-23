import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestStatsAPI:
    
    async def test_get_summary_stats_empty_db(self, client: AsyncClient, clean_db):
        """Test summary stats with empty database"""
        response = await client.get("/api/stats/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert data["totalMovies"] == 0
        assert data["averageRating"] == 0
        assert data["topGenres"] == []
    
    
    async def test_get_summary_stats_with_data(self, client: AsyncClient, sample_movies):
        """Test summary stats with sample data"""
        response = await client.get("/api/stats/summary")
        
        assert response.status_code == 200
        data = response.json()
        assert data["totalMovies"] == 10
        assert 8.0 < data["averageRating"] < 9.0  # Average should be around 8.8
        assert len(data["topGenres"]) == 5
        
        # Check top genre
        top_genre = data["topGenres"][0]
        assert top_genre["name"] == "Crime"  # Crime appears 3 times in sample data
        assert top_genre["count"] == 3
    
    
    async def test_get_stats_by_year_empty_db(self, client: AsyncClient, clean_db):
        """Test year stats with empty database"""
        response = await client.get("/api/stats/by-year")
        
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    
    async def test_get_stats_by_year_with_data(self, client: AsyncClient, sample_movies):
        """Test year stats with sample data"""
        response = await client.get("/api/stats/by-year")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 8  # 8 distinct years in sample data
        
        # Check data is sorted by year descending
        years = [stat["year"] for stat in data]
        assert years == sorted(years, reverse=True)
        
        # Check 1994 has 3 movies
        year_1994 = next(stat for stat in data if stat["year"] == 1994)
        assert year_1994["count"] == 3
    
    
    async def test_stats_with_null_values(self, client: AsyncClient, clean_db, mock_db):
        """Test stats handling null values correctly"""
        # Insert movies with null values
        import uuid
        from datetime import datetime
        
        mock_db.movies = [
            {'id': uuid.uuid4(), 'title': 'Movie 1', 'genre': None, 'rating': 8.0, 'year': 2020, 'created_at': datetime.now(), 'updated_at': datetime.now()},
            {'id': uuid.uuid4(), 'title': 'Movie 2', 'genre': 'Action', 'rating': None, 'year': 2020, 'created_at': datetime.now(), 'updated_at': datetime.now()},
            {'id': uuid.uuid4(), 'title': 'Movie 3', 'genre': 'Action', 'rating': 7.5, 'year': None, 'created_at': datetime.now(), 'updated_at': datetime.now()}
        ]
        
        # Test summary stats
        response = await client.get("/api/stats/summary")
        assert response.status_code == 200
        data = response.json()
        assert data["totalMovies"] == 3
        assert data["averageRating"] == 7.75  # Average of 8.0 and 7.5
        
        # Test year stats
        response = await client.get("/api/stats/by-year")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1  # Only one non-null year
        assert data[0]["year"] == 2020
        assert data[0]["count"] == 2