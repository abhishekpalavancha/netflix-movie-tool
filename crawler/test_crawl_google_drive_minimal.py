import unittest
from unittest.mock import Mock, patch, MagicMock, call
import json
import io
import os
import sys


# Mock the required modules before importing
sys.modules['googleapiclient'] = MagicMock()
sys.modules['googleapiclient.discovery'] = MagicMock()
sys.modules['googleapiclient.http'] = MagicMock()
sys.modules['googleapiclient.errors'] = MagicMock()
sys.modules['google.oauth2.service_account'] = MagicMock()
sys.modules['psycopg2'] = MagicMock()
sys.modules['psycopg2.extras'] = MagicMock()
sys.modules['tqdm'] = MagicMock()
sys.modules['dotenv'] = MagicMock()
sys.modules['httplib2'] = MagicMock()

# Define mock classes
class MockHttpError(Exception):
    pass

sys.modules['googleapiclient.errors'].HttpError = MockHttpError


class TestGoogleDriveCrawlerMinimal(unittest.TestCase):
    
    @patch('os.path.exists', return_value=True)
    @patch('os.getenv')
    def test_initialization_with_mocks(self, mock_getenv, mock_exists):
        """Test basic initialization with all dependencies mocked"""
        mock_getenv.return_value = 'postgresql://test:test@localhost/test'
        
        # Import after mocking
        from crawl_google_drive import GoogleDriveCrawler
        
        with patch('crawl_google_drive.psycopg2.connect') as mock_connect:
            with patch('crawl_google_drive.Credentials.from_service_account_file'):
                with patch('crawl_google_drive.build'):
                    crawler = GoogleDriveCrawler()
                    
                    # Verify initialization
                    self.assertIsNotNone(crawler)
                    self.assertEqual(crawler.stats['files_processed'], 0)
                    self.assertEqual(crawler.stats['errors'], 0)
                    self.assertEqual(len(crawler.pending_inserts), 0)
    
    @patch('os.path.exists', return_value=True)
    @patch('os.getenv')
    def test_retry_logic(self, mock_getenv, mock_exists):
        """Test retry mechanism for API calls"""
        mock_getenv.return_value = 'postgresql://test:test@localhost/test'
        
        from crawl_google_drive import GoogleDriveCrawler
        
        with patch('crawl_google_drive.psycopg2.connect'):
            with patch('crawl_google_drive.Credentials.from_service_account_file'):
                with patch('crawl_google_drive.build'):
                    crawler = GoogleDriveCrawler()
                    
                    # Test successful call
                    mock_method = Mock()
                    mock_method.execute.return_value = {"success": True}
                    
                    result = crawler._retry_api_call(mock_method)
                    self.assertEqual(result, {"success": True})
                    self.assertEqual(mock_method.execute.call_count, 1)
    
    @patch('os.path.exists', return_value=True)
    @patch('os.getenv')
    def test_json_validation(self, mock_getenv, mock_exists):
        """Test JSON data validation logic"""
        mock_getenv.return_value = 'postgresql://test:test@localhost/test'
        
        from crawl_google_drive import GoogleDriveCrawler
        
        with patch('crawl_google_drive.psycopg2.connect'):
            with patch('crawl_google_drive.Credentials.from_service_account_file'):
                with patch('crawl_google_drive.build'):
                    crawler = GoogleDriveCrawler()
                    
                    # Test with valid data
                    valid_data = {
                        'title': 'Test Movie',
                        'year': 2023,
                        'rating': 8.5,
                        'genre': 'Action'
                    }
                    
                    # Mock the download process
                    with patch.object(crawler.service.files(), 'get_media'):
                        with patch('crawl_google_drive.MediaIoBaseDownload') as mock_download:
                            mock_downloader = Mock()
                            mock_download.return_value = mock_downloader
                            mock_downloader.next_chunk.return_value = (None, True)
                            
                            with patch('crawl_google_drive.io.BytesIO') as mock_io:
                                mock_buffer = Mock()
                                mock_io.return_value = mock_buffer
                                mock_buffer.getvalue.return_value = json.dumps(valid_data).encode()
                                
                                crawler.process_json_file('test_id', 'test.json')
                                
                                # Check that valid data was processed
                                self.assertEqual(len(crawler.pending_inserts), 1)
                                self.assertEqual(crawler.stats['files_processed'], 1)
    
    @patch('os.path.exists', return_value=True)
    @patch('os.getenv')
    def test_database_batch_operations(self, mock_getenv, mock_exists):
        """Test database batch insert operations"""
        mock_getenv.return_value = 'postgresql://test:test@localhost/test'
        
        from crawl_google_drive import GoogleDriveCrawler
        from psycopg2.extras import Json
        
        with patch('crawl_google_drive.psycopg2.connect') as mock_connect:
            mock_conn = Mock()
            mock_cur = Mock()
            mock_connect.return_value = mock_conn
            mock_conn.cursor.return_value = mock_cur
            
            with patch('crawl_google_drive.Credentials.from_service_account_file'):
                with patch('crawl_google_drive.build'):
                    crawler = GoogleDriveCrawler()
                    
                    # Add test data
                    test_data = ('id1', 'Movie 1', 2023, 8.0, 'Action', Json({}))
                    crawler.pending_inserts.append(test_data)
                    
                    # Test commit
                    with patch('crawl_google_drive.execute_batch') as mock_batch:
                        crawler._commit_batch()
                        
                        # Verify batch was executed
                        mock_batch.assert_called_once()
                        mock_conn.commit.assert_called_once()
                        self.assertEqual(len(crawler.pending_inserts), 0)
    
    @patch('os.path.exists', return_value=True)
    @patch('os.getenv')
    def test_error_handling(self, mock_getenv, mock_exists):
        """Test error handling and stats tracking"""
        mock_getenv.return_value = 'postgresql://test:test@localhost/test'
        
        from crawl_google_drive import GoogleDriveCrawler
        
        with patch('crawl_google_drive.psycopg2.connect'):
            with patch('crawl_google_drive.Credentials.from_service_account_file'):
                with patch('crawl_google_drive.build'):
                    crawler = GoogleDriveCrawler()
                    
                    # Test file processing error
                    with patch.object(crawler.service.files(), 'get_media') as mock_get:
                        mock_get.side_effect = Exception("Download failed")
                        
                        crawler.process_json_file('error_id', 'error.json')
                        
                        # Check error was counted
                        self.assertEqual(crawler.stats['errors'], 1)
                        self.assertEqual(len(crawler.pending_inserts), 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)