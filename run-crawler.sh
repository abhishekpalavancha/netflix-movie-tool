#!/bin/bash

echo "Netflix Movie Tool - Crawler"
# Function to check if PostgreSQL is running
check_postgres_running() {
    docker exec movie_db pg_isready -U postgres > /dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

# Check if venv exists
if [ ! -d "crawler/venv" ]; then
    echo "Crawler virtual environment not found. Please run ./setup.sh first"
    exit 1
fi

# Check if service account exists
if [ ! -f "crawler/service-account.json" ]; then
    echo "service-account.json not found in crawler directory!"
    echo ""
    echo "Please add your Google Drive service account credentials:"
    echo "1. Create a service account in Google Cloud Console"
    echo "2. Download the JSON key file"
    echo "3. Save it as: crawler/service-account.json"
    echo ""
    exit 1
fi

# Check if PostgreSQL is running
if ! check_postgres_running; then
    echo "PostgreSQL is not running. Please run ./run.sh first"
    exit 1
fi

echo "All prerequisites met!"

# Run the crawler
echo ""
echo "Starting crawler..."
echo "Note: This process may take a while depending on the number of files in your Google Drive."


cd crawler
source venv/bin/activate
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/movies"

# Run the crawler
python crawl_google_drive.py

# Check exit status
if [ $? -eq 0 ]; then
    echo ""
    echo "Crawler completed successfully!"
    echo ""
    echo "Database has been populated with movie data."
    echo "Check crawler.log for detailed information."
    echo ""
    echo "You can now access the data through:"
    echo "   API: http://localhost:8000"
    echo "   Frontend: http://localhost:3000"
    echo ""
else
    echo ""
    echo "Crawler failed. Check crawler.log for details."
fi

deactivate