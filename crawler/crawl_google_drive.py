import os
import json
import psycopg2
import logging 
from psycopg2.extras import Json, execute_batch
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io
from datetime import datetime
from dotenv import load_dotenv
from tqdm import tqdm
import time
from concurrent.futures import ThreadPoolExecutor
import ssl
import httplib2
from googleapiclient.errors import HttpError
from time import sleep
import threading

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("crawler.log"), # Log to a file
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# The only scope needed for a service account reading files
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
SERVICE_ACCOUNT_FILE = 'service-account.json'
MAX_WORKERS = 1 # Note: Sequential processing to avoid SSL errors
DB_BATCH_SIZE = 100 # Number of records to insert at once
MAX_RETRIES = 3 
RETRY_DELAY = 2 # delay between retries in seconds

class GoogleDriveCrawler:
    def __init__(self):
        self.service = self.authenticate_google_drive()
        self.conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        self.cur = self.conn.cursor()
        self.pending_inserts = [] # Hold data for batch inserts to improve database performance
        self.insert_lock = threading.Lock() # Thread lock for batch inserts
        self.stats = {
            'files_processed': 0,
            'errors': 0,
            'folders_processed': 0,
            'db_batches_committed': 0,
            'changes_processed': 0
        }
    
    def authenticate_google_drive(self):
        """Authenticate using a service account."""
        logger.info("Authenticating with Google Drive using Service Account...")
        if not os.path.exists(SERVICE_ACCOUNT_FILE):
            logger.error(f"Service account file not found at: {SERVICE_ACCOUNT_FILE}")
            raise FileNotFoundError("You must provide a service-account.json file.")
            
        creds = Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        
        # Build the service with credentials only
        return build('drive', 'v3', credentials=creds, cache_discovery=False)
    
    def _retry_api_call(self, api_method, execute=True):
        """Retry an API call with exponential backoff."""
        for attempt in range(MAX_RETRIES):
            try:
                if execute:
                    return api_method.execute()
                else:
                    return api_method
            except (ssl.SSLError, HttpError, ConnectionError) as e:
                if attempt == MAX_RETRIES - 1:
                    logger.error(f"API call failed after {MAX_RETRIES} attempts: {str(e)}")
                    raise e
                wait_time = RETRY_DELAY * (2 ** attempt)
                logger.warning(f"API call failed (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}. Retrying in {wait_time}s...")
                sleep(wait_time)
            except Exception as e:
                logger.error(f"Unexpected error in API call: {str(e)}")
                raise e
    
    def test_folder_access(self, folder_id):
        """Test if the service account can access the folder."""
        logger.info(f"Testing access to folder: {folder_id}")
        try:
            folder = self._retry_api_call(
                self.service.files().get(
                    fileId=folder_id,
                    fields='id,name',
                    supportsAllDrives=True
                )
            )
            logger.info(f"✅ Successfully accessed folder: {folder['name']}")
            return True
        except Exception as e:
            logger.error(f"❌ Cannot access folder with ID: {folder_id}", exc_info=True)
            try:
                user_email = self.service.about().get(fields="user(emailAddress)").execute()['user']['emailAddress']
                logger.error(f"💡 The service account '{user_email}' may not have been granted access to this folder.")
            except:
                pass
            return False
    
    def crawl_folder(self, folder_id, path="root"):
        """Recursively crawl folders and find JSON files."""
        self.stats['folders_processed'] += 1
        logger.info(f"📁 Crawling folder: {path}")

        # Use ThreadPoolExecutor for concurrent file processing set to 1 worker to avoid SSL errors
        futures = []
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            try:
                query = f"'{folder_id}' in parents and trashed = false"
                results = self._retry_api_call(
                    self.service.files().list(
                        q=query,
                        fields="nextPageToken, files(id, name, mimeType)",
                        pageSize=1000,
                        supportsAllDrives=True,
                        includeItemsFromAllDrives=True
                    )
                )
                items = results.get('files', [])

                for item in tqdm(items, desc=f"Queuing items in {path}"):
                    if item['mimeType'] == 'application/vnd.google-apps.folder':
                        self.crawl_folder(item['id'], f"{path}/{item['name']}")
                    elif item['name'].endswith('.json'):
                        # Submit file processing task to the thread pool
                        future = executor.submit(self.process_json_file, item['id'], item['name'])
                        futures.append(future)
                
                # Wait for all futures to complete
                for future in futures:
                    try:
                        future.result()
                    except Exception as e:
                        logger.error(f"Error in thread execution: {e}")
                        
            except Exception as e:
                logger.error(f"Error crawling folder {path}: {e}", exc_info=True)
                self.stats['errors'] += 1
        
        # Commit any remaining items after processing a folder to ensure data is saved
        self._commit_batch()

    def process_json_file(self, file_id, filename):
        """Download and prepare a JSON file for batch insertion."""
        try:
            # Use retry logic for file download
            request = self._retry_api_call(
                self.service.files().get_media(
                    fileId=file_id, 
                    supportsAllDrives=True
                ),
                execute=False  # Don't execute, just return the request object
            )
            file_buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(file_buffer, request)
            done = False
            
            # Retry mechanism for downloading chunks
            while not done:
                for attempt in range(MAX_RETRIES):
                    try:
                        status, done = downloader.next_chunk()
                        break
                    except (ssl.SSLError, ConnectionError) as e:
                        if attempt == MAX_RETRIES - 1:
                            raise e
                        wait_time = RETRY_DELAY * (2 ** attempt)
                        logger.warning(f"Download chunk failed for {filename} (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}. Retrying in {wait_time}s...")
                        sleep(wait_time)
            
            movie_data = json.loads(file_buffer.getvalue().decode('utf-8'))
            
            # Validate and prepare data, but don't insert yet - batch for performance
            title = str(movie_data.get('title', 'N/A')).strip()
            year = int(movie_data.get('year', 0))
            rating = float(movie_data.get('rating', 0.0))
            genre = str(movie_data.get('genre', 'N/A')).strip()
            
            if not all([title, year, rating, genre]):
                raise ValueError(f"Missing or invalid core data in {filename}")

            # Store the complete movie data in metadata field
            # This ensures we don't lose any additional fields from the JSON
            
            # Add the prepared data tuple to our pending list (thread-safe)
            with self.insert_lock:
                self.pending_inserts.append(
                    (file_id, title, year, rating, genre, Json(movie_data))
                )
                self.stats['files_processed'] += 1
                
                # Commit when batch is full to optimize database performance
                if len(self.pending_inserts) >= DB_BATCH_SIZE:
                    self._commit_batch()

        except Exception as e:
            logger.error(f"Error processing file {filename} ({file_id}): {e}")
            self.stats['errors'] += 1
            
    def _commit_batch(self):
        """Commit the pending inserts to the database in a single batch."""
        if not self.pending_inserts:
            return

        try:
            sql = """
                INSERT INTO movies (drive_file_id, title, year, rating, genre, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (drive_file_id) DO UPDATE SET 
                    title = EXCLUDED.title,
                    year = EXCLUDED.year,
                    rating = EXCLUDED.rating,
                    genre = EXCLUDED.genre,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW();
            """
            execute_batch(self.cur, sql, self.pending_inserts)
            self.conn.commit()
            logger.info(f"✅ Committed a batch of {len(self.pending_inserts)} records to the database.")
            self.stats['db_batches_committed'] += 1
            # Clear the list after committing
            self.pending_inserts.clear()
        except Exception as e:
            logger.error("Database batch insert failed!", exc_info=True)
            self.conn.rollback()
            self.stats['errors'] += len(self.pending_inserts) # Count these as errors
            self.pending_inserts.clear()

    def get_latest_change_token(self):
        """Get the latest stored change token from database"""
        try:
            self.cur.execute("""
                SELECT token_value 
                FROM drive_change_tokens 
                ORDER BY created_at DESC 
                LIMIT 1
            """)
            result = self.cur.fetchone()
            return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting change token: {e}")
            return None
    
    def save_change_token(self, token):
        """Save the change token to database"""
        try:
            logger.info(f"Saving change token: {token} (type: {type(token)}, length: {len(str(token))})")
            self.cur.execute("""
                INSERT INTO drive_change_tokens (token_value)
                VALUES (%s)
            """, (token,))
            self.conn.commit()
            logger.info("Change token saved successfully")
        except Exception as e:
            logger.error(f"Error saving change token: {e}")
            self.conn.rollback()
    
    def get_initial_change_token(self):
        """Get the initial change token for starting change tracking"""
        try:
            response = self._retry_api_call(
                self.service.changes().getStartPageToken(
                    supportsAllDrives=True
                )
            )
            token = response.get('startPageToken')
            logger.info(f"Retrieved initial change token: {token} (type: {type(token)})")
            return token
        except Exception as e:
            logger.error(f"Error getting initial change token: {e}")
            return None
    
    def process_changes(self, start_token=None):
        """Process changes from Google Drive using the Changes API"""
        logger.info("🔄 Processing changes from Google Drive...")
        
        page_token = start_token or self.get_latest_change_token()
        
        if not page_token:
            logger.info("📍 No previous sync found. Getting initial token...")
            page_token = self.get_initial_change_token()
            if page_token:
                self.save_change_token(page_token)
                logger.info("✅ Initial token saved. Run crawler again to track changes.")
                return
            else:
                logger.error("❌ Could not get initial token")
                return
        
        logger.info(f"📍 Starting from page token: {page_token[:20]}...")
        changes_found = False
        
        try:
            while page_token:
                response = self._retry_api_call(
                    self.service.changes().list(
                        pageToken=page_token,
                        fields="changes(fileId,removed,file(id,name,mimeType,trashed),time),newStartPageToken,nextPageToken",
                        supportsAllDrives=True,
                        includeItemsFromAllDrives=True
                    )
                )
                
                changes = response.get('changes', [])
                
                for change in changes:
                    changes_found = True
                    file_data = change.get('file', {})
                    
                    # Process JSON files that were modified
                    if not change.get('removed') and file_data.get('name', '').endswith('.json'):
                        logger.info(f"📝 Processing changed file: {file_data.get('name')}")
                        self.process_json_file(
                            change['fileId'], 
                            file_data['name']
                        )
                        self.stats['changes_processed'] += 1
                
                # Check if there's a new start page token (we've processed all changes)
                if 'newStartPageToken' in response:
                    new_token = response['newStartPageToken']
                    self.save_change_token(new_token)
                    logger.info("✅ All changes processed. New token saved.")
                    break
                
                # Get next page token if there are more changes
                page_token = response.get('nextPageToken')
            
            # Commit any remaining batch inserts
            self._commit_batch()
            
            if not changes_found:
                logger.info("📭 No changes found since last sync")
                
        except Exception as e:
            logger.error(f"❌ Error processing changes: {e}")
            self.stats['errors'] += 1
    
    def run(self, folder_id, mode='full'):
        """Main crawler execution.
        
        Args:
            folder_id: Google Drive folder ID to crawl
            mode: 'full' for complete crawl, 'changes' for incremental updates
        """
        logger.info("🚀 Starting Google Drive crawler...")
        logger.info(f"📍 Root folder ID: {folder_id}")
        logger.info(f"🎯 Mode: {mode}")
        
        if mode == 'changes':
            # Process only changes since last sync
            self.process_changes()
        else:
            # Full crawl mode
            if not self.service or not self.test_folder_access(folder_id):
                logger.critical("Cannot proceed without folder access. Exiting.")
                return
            
            start_time = time.time()
            try:
                self.crawl_folder(folder_id)
                
                # Final commit for any remaining items
                self._commit_batch()
                
                # After full crawl, get initial token for future change tracking
                initial_token = self.get_initial_change_token()
                if initial_token:
                    self.save_change_token(initial_token)
                    logger.info("💾 Initial change token saved for future incremental updates")
                    
            finally:
                # Ensure resources are cleaned up
                pass
            
            elapsed_time = time.time() - start_time
        
        # Print summary
        logger.info("="*50)
        logger.info("📊 CRAWL SUMMARY")
        logger.info("="*50)
        logger.info(f"✅ Files processed: {self.stats['files_processed']}")
        logger.info(f"📁 Folders processed: {self.stats['folders_processed']}")
        logger.info(f"📦 DB batches committed: {self.stats['db_batches_committed']}")
        if mode == 'changes':
            logger.info(f"🔄 Changes processed: {self.stats['changes_processed']}")
        logger.info(f"❌ Errors: {self.stats['errors']}")
        if mode == 'full':
            logger.info(f"⏱️  Time elapsed: {elapsed_time:.2f} seconds")
    
    def close(self):
        """Clean up connections."""
        self.cur.close()
        self.conn.close()
        logger.info("Database connection closed.")

def main():
    """Main execution function."""
    import sys
    
    if not os.getenv('DATABASE_URL'):
        logger.critical("DATABASE_URL environment variable not set.")
        return

    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        logger.critical(f"'{SERVICE_ACCOUNT_FILE}' not found. Please follow setup instructions.")
        return

    # Check for command line argument
    mode = 'full'
    if len(sys.argv) > 1:
        if sys.argv[1] == '--changes':
            mode = 'changes'
        elif sys.argv[1] == '--help':
            print("Usage: python crawl_google_drive.py [--changes]")
            print("  --changes  : Run incremental update using Changes API")
            print("  (default)  : Run full crawl of the folder")
            return

    crawler = GoogleDriveCrawler()
    try:
        folder_id = os.getenv('GOOGLE_FOLDER_ID')
        if not folder_id:
            logger.critical("GOOGLE_FOLDER_ID environment variable not set.")
            return
        crawler.run(folder_id, mode=mode)
    except Exception as e:
        logger.critical("An uncaught exception occurred!", exc_info=True)
    finally:
        crawler.close()

if __name__ == "__main__":
    main()