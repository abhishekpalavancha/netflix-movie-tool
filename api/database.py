import asyncpg
from config import settings


class Database:
    pool: asyncpg.Pool = None


db = Database()


async def connect_db():
    """Initialize database connection pool"""
    db.pool = await asyncpg.create_pool(settings.DATABASE_URL)


async def disconnect_db():
    """Close database connection pool"""
    if db.pool:
        await db.pool.close()