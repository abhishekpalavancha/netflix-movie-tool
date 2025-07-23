from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import base64
from binascii import Error as BinasciiError
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

from models.movie import (
    Movie, MovieInput, CursorMovieListResponse
)
from database import db

router = APIRouter(prefix="/api/movies", tags=["movies"])


@router.post("", response_model=Movie)
async def create_movie(movie: MovieInput):
    """Add a new movie to the system"""
    query = """
        INSERT INTO movies (title, genre, rating, year, metadata)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING id, title, genre, rating, year, created_at, updated_at
    """
    
    # Use metadata from input if provided, otherwise empty dict
    metadata = movie.metadata if movie.metadata is not None else {}
    
    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchrow(
                query,
                movie.title,
                movie.genre,
                movie.rating,
                movie.year,
                json.dumps(metadata)
            )
            
            return Movie(
                id=str(row["id"]),
                title=row["title"],
                genre=row["genre"] or "",
                rating=float(row["rating"]) if row["rating"] is not None else 0.0,
                year=row["year"] or 0,
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=CursorMovieListResponse)
async def get_movies(
    genre: Optional[str] = None,
    min_rating: Optional[float] = Query(None, ge=0, le=10),
    year: Optional[int] = Query(None, ge=1900, le=2100),
    title: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """Get filtered list of movies with cursor-based pagination"""
    conditions = []
    params = []
    param_count = 0
    
    # Decode cursor if provided
    cursor_data = None
    if cursor:
        try:
            cursor_decoded = base64.b64decode(cursor).decode('utf-8')
            cursor_data = json.loads(cursor_decoded)
        except (ValueError, json.JSONDecodeError, BinasciiError):
            raise HTTPException(status_code=400, detail="Invalid cursor")
    
    base_query = "SELECT id, title, genre, rating, year, created_at, updated_at FROM movies WHERE 1=1"
    
    if genre:
        param_count += 1
        conditions.append(f" AND genre = ${param_count}")
        params.append(genre)
    
    if min_rating is not None:
        param_count += 1
        conditions.append(f" AND rating >= ${param_count}")
        params.append(min_rating)
    
    if year:
        param_count += 1
        conditions.append(f" AND year = ${param_count}")
        params.append(year)
    
    if title:
        param_count += 1
        conditions.append(f" AND title ILIKE ${param_count}")
        params.append(f"%{title}%")
    
    # Add cursor condition
    if cursor_data:
        param_count += 1
        conditions.append(f" AND (created_at, id) < (${param_count}::timestamptz, ${param_count + 1}::uuid)")
        # Parse the datetime string
        created_at = datetime.fromisoformat(cursor_data['created_at'])
        params.extend([created_at, cursor_data['id']])
        param_count += 1
    
    # Add limit + 1 to check if there are more results
    param_count += 1
    query = base_query + "".join(conditions) + f" ORDER BY created_at DESC, id DESC LIMIT ${param_count}"
    params.append(limit + 1)
    
    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            has_more = len(rows) > limit
            if has_more:
                rows = rows[:limit]
            
            movies = []
            next_cursor = None
            
            for i, row in enumerate(rows):
                movie = Movie(
                    id=str(row["id"]),
                    title=row["title"] or "",
                    genre=row["genre"] or "",
                    rating=float(row["rating"]) if row["rating"] is not None else 0.0,
                    year=row["year"] or 0,
                    created_at=row["created_at"],
                    updated_at=row["updated_at"]
                )
                movies.append(movie)
                
                # Set cursor for last item
                if i == len(rows) - 1 and has_more:
                    cursor_obj = {
                        "created_at": row["created_at"].isoformat(),
                        "id": str(row["id"])
                    }
                    next_cursor = base64.b64encode(json.dumps(cursor_obj).encode()).decode()
            
            return CursorMovieListResponse(
                movies=movies,
                next_cursor=next_cursor,
                has_more=has_more,
                limit=limit
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/top-rated", response_model=CursorMovieListResponse)
async def get_top_rated_movies(
    cursor: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """Get top-rated movies with cursor-based pagination"""
    params = []
    param_count = 0
    
    # Decode cursor if provided
    cursor_data = None
    if cursor:
        try:
            cursor_decoded = base64.b64decode(cursor).decode('utf-8')
            cursor_data = json.loads(cursor_decoded)
        except (ValueError, json.JSONDecodeError, BinasciiError):
            raise HTTPException(status_code=400, detail="Invalid cursor")
    
    base_query = """
        SELECT id, title, genre, rating, year, created_at, updated_at
        FROM movies 
        WHERE rating IS NOT NULL
    """
    
    # Add cursor condition for rating-based pagination
    if cursor_data:
        param_count += 1
        base_query += f" AND (rating < ${param_count} OR (rating = ${param_count + 1} AND id > ${param_count + 2}::uuid))"
        params.extend([cursor_data['rating'], cursor_data['rating'], cursor_data['id']])
        param_count += 2
    
    # Add limit + 1 to check if there are more results
    param_count += 1
    query = base_query + f" ORDER BY rating DESC, id ASC LIMIT ${param_count}"
    params.append(limit + 1)
    
    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
            has_more = len(rows) > limit
            if has_more:
                rows = rows[:limit]
            
            movies = []
            next_cursor = None
            
            for i, row in enumerate(rows):
                movie = Movie(
                    id=str(row["id"]),
                    title=row["title"] or "",
                    genre=row["genre"] or "",
                    rating=float(row["rating"]) if row["rating"] is not None else 0.0,
                    year=row["year"] or 0,
                    created_at=row["created_at"],
                    updated_at=row["updated_at"]
                )
                movies.append(movie)
                
                # Set cursor for last item
                if i == len(rows) - 1 and has_more:
                    cursor_obj = {
                        "rating": float(row["rating"]),
                        "id": str(row["id"])
                    }
                    next_cursor = base64.b64encode(json.dumps(cursor_obj).encode()).decode()
            
            return CursorMovieListResponse(
                movies=movies,
                next_cursor=next_cursor,
                has_more=has_more,
                limit=limit
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/years", response_model=list[int])
async def get_available_years():
    """Get all distinct years from movies"""
    query = """
        SELECT DISTINCT year 
        FROM movies 
        WHERE year IS NOT NULL 
        ORDER BY year DESC
    """
    
    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [row['year'] for row in rows]
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/genres", response_model=list[str])
async def get_available_genres():
    """Get all distinct genres from movies"""
    query = """
        SELECT DISTINCT genre 
        FROM movies 
        WHERE genre IS NOT NULL 
        ORDER BY genre ASC
    """
    
    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [row['genre'] for row in rows]
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{movie_id}", response_model=Movie)
async def get_movie_by_id(movie_id: str):
    """Get a single movie by ID"""
    query = "SELECT id, title, genre, rating, year, created_at, updated_at FROM movies WHERE id = $1"
    
    try:
        async with db.pool.acquire() as conn:
            row = await conn.fetchrow(query, movie_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Movie not found")
            
            return Movie(
                id=str(row["id"]),
                title=row["title"] or "",
                genre=row["genre"] or "",
                rating=float(row["rating"]) if row["rating"] is not None else 0.0,
                year=row["year"] or 0,
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")