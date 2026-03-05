"""
Unit tests for dependency management functionality using PythonDepManager
"""

import unittest
import sys
from unittest.mock import patch, MagicMock, mock_open
import tempfile
import os

class TestPythonDepManagerIntegration(unittest.TestCase):
    """Test cases for PythonDepManager integration"""

    def setUp(self):
        """Set up test fixtures"""
        # Mock PythonDepManager module
        self.mock_python_dep_manager = MagicMock()
        sys.modules['PythonDepManager'] = self.mock_python_dep_manager

    def tearDown(self):
        """Clean up after tests"""
        if 'PythonDepManager' in sys.modules:
            del sys.modules['PythonDepManager']

    @patch('builtins.print')
    def test_dependency_import_failure(self, mock_print):
        """Test dependency import failure handling"""
        # Mock ensure_import to raise ImportError
        self.mock_python_dep_manager.ensure_import = MagicMock(side_effect=ImportError("Package not found"))
        
        # Test that the error is handled gracefully
        with self.assertRaises(SystemExit):
            import haven_vlm_connector

    def test_error_messages(self):
        """Test that appropriate error messages are displayed"""
        # Mock ensure_import to raise ImportError
        self.mock_python_dep_manager.ensure_import = MagicMock(side_effect=ImportError("Package not found"))
        
        with patch('builtins.print') as mock_print:
            with self.assertRaises(SystemExit):
                import haven_vlm_connector
            
            # Check that appropriate error messages were printed
            print_calls = [call[0][0] for call in mock_print.call_args_list]
            self.assertTrue(any("Failed to import PythonDepManager" in msg for msg in print_calls if isinstance(msg, str)))
            self.assertTrue(any("Please ensure PythonDepManager is installed" in msg for msg in print_calls if isinstance(msg, str)))


class TestDependencyManagementEdgeCases(unittest.TestCase):
    """Test edge cases in dependency management"""

    def setUp(self):
        """Set up test fixtures"""
        self.mock_python_dep_manager = MagicMock()
        sys.modules['PythonDepManager'] = self.mock_python_dep_manager

    def tearDown(self):
        """Clean up after tests"""
        if 'PythonDepManager' in sys.modules:
            del sys.modules['PythonDepManager']

    def test_missing_python_dep_manager(self):
        """Test behavior when PythonDepManager is not available"""
        # Remove PythonDepManager from sys.modules
        if 'PythonDepManager' in sys.modules:
            del sys.modules['PythonDepManager']
        
        with patch('builtins.print') as mock_print:
            with self.assertRaises(SystemExit):
                import haven_vlm_connector
            
            # Check that appropriate error message was printed
            print_calls = [call[0][0] for call in mock_print.call_args_list]
            self.assertTrue(any("Failed to import PythonDepManager" in msg for msg in print_calls if isinstance(msg, str)))

    def test_partial_dependency_failure(self):
        """Test behavior when some dependencies fail to import"""
        # Mock ensure_import to succeed but some imports to fail
        self.mock_python_dep_manager.ensure_import = MagicMock()
        
        # Mock some successful imports but not all
        mock_stashapi = MagicMock()
        sys.modules['stashapi.log'] = mock_stashapi
        sys.modules['stashapi.stashapp'] = mock_stashapi
        
        # Don't mock aiohttp, so it should fail
        with patch('builtins.print') as mock_print:
            with self.assertRaises(SystemExit):
                import haven_vlm_connector
            
            # Check that appropriate error message was printed
            print_calls = [call[0][0] for call in mock_print.call_args_list]
            self.assertTrue(any("Error during dependency management" in msg for msg in print_calls if isinstance(msg, str)))


if __name__ == '__main__':
    unittest.main() 