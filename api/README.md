# Netflix Movie Tool API

A FastAPI backend service for movie search and statistics. This API provides endpoints to search movies, retrieve movie details, and view aggregated statistics from the movie database.

## Prerequisites

- Python 3.8+
- PostgreSQL database running (see database setup in parent directory)
- Virtual environment (recommended)

## Installation

1. **Navigate to the API directory**:
   ```bash
   cd api
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Create virtual environment
   python3 -m venv venv
   
   # Activate virtual environment
   source venv/bin/activate  # On macOS/Linux
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**:
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movies
   ```

## Running the API

1. **Start the development server**:
   ```bash
   python -m uvicorn api.main:app --reload
   ```

   The API will be available at `http://localhost:8000`

2. **Access the interactive documentation**:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
   - OpenAPI schema: `http://localhost:8000/openapi.json`

## API Endpoints

### Movies
- `GET /api/movies/search` - Search movies with filters
- `GET /api/movies/{movie_id}` - Get movie by ID
- `GET /api/movies/recent` - Get recently added movies
- `GET /api/movies/top-rated` - Get top-rated movies

### Statistics
- `GET /api/stats/summary` - Get overall statistics
- `GET /api/stats/genres` - Get genre distribution
- `GET /api/stats/years` - Get yearly movie counts