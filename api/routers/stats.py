from fastapi import APIRouter, HTTPException
from typing import List

from models.movie import SummaryStats, YearStats, GenreStats
from database import db

router = APIRouter(prefix="/api/stats", tags=["statistics"])


@router.get("/summary", response_model=SummaryStats)
async def get_summary_stats():
    """Get dashboard summary statistics"""
    queries = {
        "total": "SELECT COUNT(*) FROM movies",
        "avg_rating": "SELECT AVG(rating) FROM movies WHERE rating IS NOT NULL",
        "genres": """
            SELECT genre, COUNT(*) as count
            FROM movies
            WHERE genre IS NOT NULL
            GROUP BY genre
            ORDER BY count DESC
            LIMIT 5
        """,
        "total_genres": "SELECT COUNT(DISTINCT genre) FROM movies WHERE genre IS NOT NULL"
    }
    
    try:
        async with db.pool.acquire() as conn:
            total = await conn.fetchval(queries["total"])
            avg_rating = await conn.fetchval(queries["avg_rating"])
            genre_rows = await conn.fetch(queries["genres"])
            total_genres = await conn.fetchval(queries["total_genres"])
            
            top_genres = [
                GenreStats(name=row["genre"], count=row["count"])
                for row in genre_rows
            ]
            
            return SummaryStats(
                totalMovies=total or 0,
                averageRating=round(avg_rating or 0, 2),
                topGenres=top_genres,
                totalGenres=total_genres or 0
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/by-year", response_model=List[YearStats])
async def get_stats_by_year():
    """Get movie counts by year"""
    query = """
        SELECT year, COUNT(*) as count
        FROM movies
        WHERE year IS NOT NULL
        GROUP BY year
        ORDER BY year DESC
    """
    
    try:
        async with db.pool.acquire() as conn:
            rows = await conn.fetch(query)
            
            return [
                YearStats(year=row["year"], count=row["count"])
                for row in rows
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")