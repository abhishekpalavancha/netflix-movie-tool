import pytest
import asyncpg
import asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

import sys
import os

# Add the parent directory (netflix-movie-tool) to the path
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from api.main import app
from api.database import db
from api.config import settings


# Mock the database for testing
class MockConnection:
    def __init__(self, mock_db):
        self.mock_db = mock_db
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass
        
    async def fetchval(self, query, *args):
        return await self.mock_db.fetchval(query, *args)
        
    async def fetch(self, query, *args):
        return await self.mock_db.fetch(query, *args)
        
    async def fetchrow(self, query, *args):
        return await self.mock_db.fetchrow(query, *args)
        
    async def execute(self, query, *args):
        return await self.mock_db.execute(query, *args)


class MockDB:
    def __init__(self):
        self.data = {}
        self.movies = []
        
    def acquire(self):
        # Return a context manager that yields MockConnection
        class AcquireContext:
            def __init__(ctx_self):
                pass
                
            async def __aenter__(ctx_self):
                return MockConnection(self)
                
            async def __aexit__(ctx_self, exc_type, exc_val, exc_tb):
                pass
                
        return AcquireContext()
        
    async def fetchval(self, query, *args):
        if "COUNT(*)" in query:
            return len(self.movies)
        elif "AVG(rating)" in query:
            if self.movies:
                ratings = [m['rating'] for m in self.movies if m.get('rating')]
                return sum(ratings) / len(ratings) if ratings else 0
            return 0
        return None
        
    async def fetch(self, query, *args):
        if "genre, COUNT(*)" in query:
            # Mock genre stats
            genres = {}
            for movie in self.movies:
                if movie.get('genre'):
                    genres[movie['genre']] = genres.get(movie['genre'], 0) + 1
            return [{'genre': g, 'count': c} for g, c in sorted(genres.items(), key=lambda x: x[1], reverse=True)[:5]]
        elif "year, COUNT(*)" in query:
            # Mock year stats
            years = {}
            for movie in self.movies:
                if movie.get('year'):
                    years[movie['year']] = years.get(movie['year'], 0) + 1
            return [{'year': y, 'count': c} for y, c in sorted(years.items(), key=lambda x: x[0], reverse=True)]
        elif "SELECT id, title" in query:
            # Mock movie list with filtering
            result = list(self.movies)
            
            # Check if it's a top-rated query
            if "WHERE rating IS NOT NULL" in query and "ORDER BY rating DESC" in query:
                # Filter out movies without ratings and sort by rating descending, id ascending
                result = [m for m in result if m.get('rating') is not None]
                result.sort(key=lambda x: (-x.get('rating', 0), str(x.get('id'))))
            else:
                # Apply filters based on query string and args
                if "genre = $" in query and args:
                    genre_filter = args[0]
                    result = [m for m in result if m.get('genre') == genre_filter]
                    
                if "rating >= $" in query and args:
                    # Find the rating value in args
                    rating_filter = None
                    for arg in args:
                        if isinstance(arg, (int, float)) and 0 <= arg <= 10:
                            rating_filter = arg
                            break
                    if rating_filter is not None:
                        result = [m for m in result if m.get('rating', 0) >= rating_filter]
                    
                if "year = $" in query and args:
                    # Find the year value in args
                    year_filter = None
                    for arg in args:
                        if isinstance(arg, int) and 1900 <= arg <= 2100:
                            year_filter = arg
                            break
                    if year_filter is not None:
                        result = [m for m in result if m.get('year') == year_filter]
                    
                if "title ILIKE $" in query and args:
                    # Find the title pattern in args
                    title_pattern = None
                    for arg in args:
                        if isinstance(arg, str) and '%' in arg:
                            title_pattern = arg.replace('%', '')
                            break
                    if title_pattern:
                        result = [m for m in result if title_pattern.lower() in m.get('title', '').lower()]
                
                # Handle cursor-based pagination
                if "(created_at, id) < " in query and args:
                    # Find cursor values in args
                    from datetime import datetime
                    cursor_created_at = None
                    cursor_id = None
                    for i, arg in enumerate(args):
                        if isinstance(arg, datetime):
                            cursor_created_at = arg
                            if i + 1 < len(args):
                                cursor_id = str(args[i + 1])
                            break
                    
                    if cursor_created_at and cursor_id:
                        # Filter results based on cursor
                        filtered_result = []
                        for movie in result:
                            movie_created_at = movie.get('created_at')
                            movie_id = str(movie.get('id'))
                            if movie_created_at < cursor_created_at or (movie_created_at == cursor_created_at and movie_id < cursor_id):
                                filtered_result.append(movie)
                        result = filtered_result
                
                # Sort by created_at DESC, id DESC
                result.sort(key=lambda x: (x.get('created_at'), str(x.get('id'))), reverse=True)
            
            # Apply limit (last arg is usually the limit)
            limit = args[-1] if args and isinstance(args[-1], int) else 10
            return result[:limit]
            
        elif "DISTINCT year" in query:
            return [{'year': y} for y in sorted(set(m['year'] for m in self.movies if m.get('year')), reverse=True)]
        elif "DISTINCT genre" in query:
            return [{'genre': g} for g in sorted(set(m['genre'] for m in self.movies if m.get('genre')))]
        return []
        
    async def fetchrow(self, query, *args):
        if "INSERT INTO movies" in query:
            # Mock movie creation
            import uuid
            from datetime import datetime
            movie = {
                'id': uuid.uuid4(),
                'title': args[0],
                'genre': args[1] or '',
                'rating': args[2] or 0.0,
                'year': args[3] or 0,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            self.movies.append(movie)
            return movie
        elif "WHERE id = $1" in query:
            # Mock get by ID
            for movie in self.movies:
                if str(movie['id']) == args[0]:
                    return movie
            return None
        return None
        
    async def execute(self, query, *args):
        if "TRUNCATE" in query:
            self.movies = []
        return None


@pytest.fixture
async def mock_db():
    """Create mock database"""
    mock = MockDB()
    db.pool = mock
    yield mock
    

@pytest.fixture
async def clean_db(mock_db):
    """Clean database before each test"""
    mock_db.movies = []
    yield


@pytest.fixture
async def client(mock_db):
    """Create test client"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def sample_movies(clean_db, mock_db):
    """Insert sample movies for testing"""
    import uuid
    from datetime import datetime
    
    movies = [
        ("The Shawshank Redemption", "Drama", 9.3, 1994),
        ("The Godfather", "Crime", 9.2, 1972),
        ("The Dark Knight", "Action", 9.0, 2008),
        ("Pulp Fiction", "Crime", 8.9, 1994),
        ("Forrest Gump", "Drama", 8.8, 1994),
        ("Inception", "Sci-Fi", 8.8, 2010),
        ("The Matrix", "Sci-Fi", 8.7, 1999),
        ("Goodfellas", "Crime", 8.7, 1990),
        ("Se7en", "Thriller", 8.6, 1995),
        ("The Silence of the Lambs", "Thriller", 8.6, 1991),
    ]
    
    inserted = []
    for title, genre, rating, year in movies:
        movie = {
            'id': uuid.uuid4(),
            'title': title,
            'genre': genre,
            'rating': rating,
            'year': year,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        mock_db.movies.append(movie)
        inserted.append(movie)
    
    return inserted