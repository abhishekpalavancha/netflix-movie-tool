# Netflix Movie Tool Database

PostgreSQL database setup with pgvector extension for storing movie metadata and embeddings. This database serves as the central data store for the Netflix Movie Tool application.

## Quick Start

1. **Navigate to the project root directory**:
   ```bash
   cd netflix-movie-tool
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

## Manual Setup

If you prefer manual setup or the script doesn't work:

1. **Navigate to database directory**:
   ```bash
   cd database
   ```

2. **Start the services**:
   ```bash
   docker-compose up -d
   ```

3. **Wait for PostgreSQL to be ready**:
   ```bash
   docker exec movie_db pg_isready -U postgres
   ```

4. **Initialize the database** (if tables don't exist):
   ```bash
   docker exec -i movie_db psql -U postgres -d movies < init.sql
   ```

## Database Schema

### Tables

1. **movies**
   - Primary table for movie metadata
   - Includes title, year, genre, director, actors, plot, ratings
   - Full-text search support on title and plot

2. **drive_change_tokens**
   - Tracks Google Drive sync state
   - Stores page tokens for incremental updates

## Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: movies
- **Username**: postgres
- **Password**: postgres

Connection string:
```
postgresql://postgres:postgres@localhost:5432/movies
```