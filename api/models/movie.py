from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class MovieInput(BaseModel):
    title: str = Field(..., min_length=1)
    genre: str = Field(..., min_length=1)
    rating: float = Field(..., ge=0, le=10)
    year: int = Field(..., ge=1900, le=2100)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class Movie(BaseModel):
    id: str
    title: str
    genre: str
    rating: float
    year: int
    created_at: datetime
    updated_at: datetime


class MovieListResponse(BaseModel):
    movies: List[Movie]
    total: int
    page: int
    limit: int


class CursorMovieListResponse(BaseModel):
    movies: List[Movie]
    next_cursor: Optional[str]
    has_more: bool
    limit: int


class GenreStats(BaseModel):
    name: str
    count: int


class YearStats(BaseModel):
    year: int
    count: int


class SummaryStats(BaseModel):
    totalMovies: int
    averageRating: float
    topGenres: List[GenreStats]
    totalGenres: int