# Netflix Movie Tool

A full-stack monorepo application for managing movie metadata from Google Drive. This project provides a complete solution for crawling, storing, searching, and visualizing movie information.

## Overview

The Netflix Movie Tool consists of four main components:

1. **Database**: PostgreSQL with pgvector for storing movie data and embeddings
2. **Crawler**: Python service to extract movie metadata from Google Drive
3. **API**: FastAPI backend providing RESTful endpoints for movie data
4. **Frontend**: React application for browsing and searching movies


## Features

- **Movie Search**: Full-text search with filters for year, genre, director, and ratings
- **Movie Details**: Comprehensive information including cast, plot, and ratings
- **Statistics Dashboard**: Visual analytics with genre distribution and yearly trends
- **Top Rated & Recent**: Curated lists of highly-rated and recently added movies
- **Responsive Design**: Works on desktop and mobile devices

## Architecture 

![Architecture](./project-images/Architecture.png)

## Dashboard page

![Dashboard](./project-images/Dashboard.png)

## Movies page

![Movies](./project-images/Movies.png)

## APIs page

![APIs](./project-images/Apis.png)

## Add movies page

![Add](./project-images/Add.png)

## Quick Start

### Prerequisites

- Docker Desktop
- Python 3.8+
- Node.js 16+ and npm
- Google Service Account JSON file

### Step-by-Step Setup

#### Step 1: Initial Setup (One-time only)

Run the setup script to install all dependencies:

```bash
./setup.sh
```

#### Step 2: Run the Crawler

If you have configured the service account, populate the database:

```bash
./run-crawler.sh
```

This process may take time depending on the number of files in your Google Drive.

#### Step 3: Start the Application

Start both the API server and frontend:

```bash
./run.sh
```

#### Step 4: Access the Application

Once started, you can access:
- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Database**: PostgreSQL on localhost:5432

### Manual Setup (Alternative)

If you prefer to run components individually:

1. **Start the Database**:
   ```bash
   cd database
   docker-compose up -d
   ```

2. **Run the Crawler** (optional):
   ```bash
   cd crawler
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/movies"
   python crawl_google_drive.py
   ```

3. **Start the API Server**:
   ```bash
   cd api
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/movies"
   python -m uvicorn main:app --reload
   ```

4. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run start
   ```

## Services

### Database (PostgreSQL with pgvector)
- **Port**: 5432
- **Features**: Vector embeddings, full-text search, optimized indexes
- **Admin UI**: pgAdmin at http://localhost:5050
- [Database README](./database/README.md)

### Crawler (Python)
- **Purpose**: Extract movie metadata from Google Drive JSON files
- **Features**: Concurrent processing, batch operations, incremental updates
- **Requirements**: Google Service Account credentials
- [Crawler README](./crawler/README.md)

### API (FastAPI)
- **Port**: 8000
- **Endpoints**: Movie search, details, statistics
- **Docs**: http://localhost:8000/docs
- **Features**: Async operations, auto-generated documentation
- [API README](./api/README.md)

### Frontend (React)
- **Port**: 3000
- **Features**: Movie search, filtering, statistics dashboard
- **Tech Stack**: React, TypeScript, Recharts
- [Frontend README](./frontend/README.md)
