import psycopg2
import json

# Connection parameters
conn_params = {
    "host": "localhost",
    "database": "movies",
    "user": "postgres",
    "password": "postgres",
    "port": 5432
}

try:
    # Connect to database
    conn = psycopg2.connect(**conn_params)
    cur = conn.cursor()
    
    # Test 1: Check pgvector is installed
    cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector';")
    version = cur.fetchone()
    print(f"pgvector version: {version[0]}")
    
    # Test 2: Count movies
    cur.execute("SELECT COUNT(*) FROM movies;")
    count = cur.fetchone()[0]
    print(f"Found {count} movies in database")
    
    # Test 3: Query sample data
    cur.execute("""
        SELECT metadata->>'title' as title, 
               metadata->>'rating' as rating 
        FROM movies;
    """)
    movies = cur.fetchall()
    print("Sample movies:")
    for movie in movies:
        print(f"   - {movie[0]} (Rating: {movie[1]})")
    
    # Test 4: Test vector operations
    cur.execute("""
        SELECT '[1,2,3]'::vector <-> '[4,5,6]'::vector as distance;
    """)
    distance = cur.fetchone()[0]
    print(f"Vector distance calculation works: {distance}")
    
    conn.close()
    print("\n Database is ready!")
    
except Exception as e:
    print(f"Error: {e}")