# Netflix Movie Tool Crawler

A Python-based Google Drive crawler that extracts movie metadata from JSON files and populates a PostgreSQL database. The crawler uses concurrent processing for optimal performance and supports incremental updates.

## Prerequisites

- Python 3.8+
- PostgreSQL database running (see database setup in parent directory)
- Google Service Account with Drive API access
- Virtual environment (recommended)

## Setup

### 1. Google Drive API Setup

1. Create a Google Cloud Project
2. Enable the Google Drive API
3. Create a Service Account and download the credentials
4. Save the credentials as `service-account.json` in the crawler directory
5. Share your Google Drive folder with the service account email

### 2. Installation

1. **Navigate to crawler directory**:
   ```bash
   cd crawler
   ```

2. **Create and activate virtual environment**:
   ```bash
   # Create virtual environment (if not exists)
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
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movies
   GOOGLE_FOLDER_ID=your-google-drive-folder-id
   ```

## Usage

### Running the Crawler

```bash
# Make sure you're in the crawler directory with venv activated
cd crawler
source venv/bin/activate
python crawl_google_drive.py
```

The crawler will:
1. Authenticate using the service account
2. Check existing files in the database
3. Crawl the specified folder recursively
4. Process JSON files concurrently
5. Insert/update records in batches
6. Log all operations to `crawler.log`