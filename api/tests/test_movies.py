import pytest
import base64
import json
from httpx import AsyncClient


@pytest.mark.asyncio
class TestMoviesAPI:
    
    async def test_create_movie(self, client: AsyncClient, clean_db):
        """Test creating a new movie"""
        movie_data = {
            "title": "Test Movie",
            "genre": "Action",
            "rating": 8.5,
            "year": 2023,
            "metadata": {"director": "Test Director"}
        }
        
        response = await client.post("/api/movies", json=movie_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == movie_data["title"]
        assert data["genre"] == movie_data["genre"]
        assert data["rating"] == movie_data["rating"]
        assert data["year"] == movie_data["year"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    
    async def test_create_movie_minimal(self, client: AsyncClient, clean_db):
        """Test creating movie with minimal required data"""
        movie_data = {
            "title": "Minimal Movie",
            "genre": "Unknown",
            "rating": 0.0,
            "year": 2023
        }
        
        response = await client.post("/api/movies", json=movie_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == movie_data["title"]
        assert data["genre"] == movie_data["genre"]
        assert data["rating"] == movie_data["rating"]
        assert data["year"] == movie_data["year"]
    
    
    async def test_get_movies_no_filters(self, client: AsyncClient, sample_movies):
        """Test getting movies without filters"""
        response = await client.get("/api/movies")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 10
        assert data["limit"] == 10
        assert data["has_more"] is False
        assert data["next_cursor"] is None
    
    
    async def test_get_movies_with_pagination(self, client: AsyncClient, sample_movies):
        """Test cursor-based pagination"""
        # First page
        response = await client.get("/api/movies?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 5
        assert data["has_more"] is True
        assert data["next_cursor"] is not None
        
        # Second page
        response = await client.get(f"/api/movies?limit=5&cursor={data['next_cursor']}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 5
        assert data["has_more"] is False
        assert data["next_cursor"] is None
    
    
    async def test_get_movies_by_genre(self, client: AsyncClient, sample_movies):
        """Test filtering movies by genre"""
        response = await client.get("/api/movies?genre=Crime")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 3
        assert all(movie["genre"] == "Crime" for movie in data["movies"])
    
    
    async def test_get_movies_by_rating(self, client: AsyncClient, sample_movies):
        """Test filtering movies by minimum rating"""
        response = await client.get("/api/movies?min_rating=9.0")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 3
        assert all(movie["rating"] >= 9.0 for movie in data["movies"])
    
    
    async def test_get_movies_by_year(self, client: AsyncClient, sample_movies):
        """Test filtering movies by year"""
        response = await client.get("/api/movies?year=1994")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 3
        assert all(movie["year"] == 1994 for movie in data["movies"])
    
    
    async def test_get_movies_by_title(self, client: AsyncClient, sample_movies):
        """Test filtering movies by title (partial match)"""
        response = await client.get("/api/movies?title=The")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) > 0
        assert all("The" in movie["title"] for movie in data["movies"])
    
    
    async def test_get_movie_by_id(self, client: AsyncClient, sample_movies):
        """Test getting a single movie by ID"""
        movie_id = sample_movies[0]["id"]
        
        response = await client.get(f"/api/movies/{movie_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(movie_id)
        assert data["title"] == sample_movies[0]["title"]
    
    
    async def test_get_movie_by_id_not_found(self, client: AsyncClient, clean_db):
        """Test getting non-existent movie"""
        fake_id = "123e4567-e89b-12d3-a456-426614174000"
        
        response = await client.get(f"/api/movies/{fake_id}")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Movie not found"
    
    
    async def test_get_top_rated_movies(self, client: AsyncClient, sample_movies):
        """Test getting top-rated movies"""
        response = await client.get("/api/movies/top-rated?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["movies"]) == 5
        
        # Check movies are sorted by rating descending
        ratings = [movie["rating"] for movie in data["movies"]]
        assert ratings == sorted(ratings, reverse=True)
    
    
    async def test_get_available_years(self, client: AsyncClient, sample_movies):
        """Test getting distinct years"""
        response = await client.get("/api/movies/years")
        
        assert response.status_code == 200
        years = response.json()
        assert len(years) == 8  # Distinct years in sample data
        assert years == sorted(years, reverse=True)
    
    
    async def test_get_available_genres(self, client: AsyncClient, sample_movies):
        """Test getting distinct genres"""
        response = await client.get("/api/movies/genres")
        
        assert response.status_code == 200
        genres = response.json()
        assert len(genres) == 5  # Distinct genres in sample data
        assert genres == sorted(genres)
    
    
    async def test_invalid_cursor(self, client: AsyncClient, clean_db):
        """Test invalid cursor handling"""
        response = await client.get("/api/movies?cursor=invalid_base64")
        
        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid cursor"
    
    
    async def test_cursor_decoding(self, client: AsyncClient, sample_movies):
        """Test cursor encoding/decoding works correctly"""
        # Get first page
        response = await client.get("/api/movies?limit=1")
        data = response.json()
        cursor = data["next_cursor"]
        
        # Decode cursor to verify format
        decoded = json.loads(base64.b64decode(cursor).decode('utf-8'))
        assert "created_at" in decoded
        assert "id" in decoded