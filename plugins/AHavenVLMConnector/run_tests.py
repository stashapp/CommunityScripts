#!/usr/bin/env python3
"""
Test runner for A Haven VLM Connector
Runs all unit tests with coverage reporting
"""

import sys
import os
import subprocess
import unittest
from pathlib import Path

def install_test_dependencies():
    """Install test dependencies if not already installed"""
    test_deps = [
        'coverage',
        'pytest',
        'pytest-cov'
    ]
    
    for dep in test_deps:
        try:
            __import__(dep.replace('-', '_'))
        except ImportError:
            print(f"Installing {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])

def run_tests_with_coverage():
    """Run tests with coverage reporting"""
    # Install test dependencies
    install_test_dependencies()
    
    # Get the directory containing this script
    script_dir = Path(__file__).parent
    
    # Discover and run tests
    loader = unittest.TestLoader()
    start_dir = script_dir
    suite = loader.discover(start_dir, pattern='test_*.py')
    
    # Run tests with coverage
    import coverage
    
    # Start coverage measurement
    cov = coverage.Coverage(
        source=['haven_vlm_config.py', 'haven_vlm_engine.py', 'haven_media_handler.py', 
                'haven_vlm_connector.py', 'haven_vlm_utility.py'],
        omit=['*/test_*.py', '*/__pycache__/*', '*/venv/*', '*/env/*']
    )
    cov.start()
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Stop coverage measurement
    cov.stop()
    cov.save()
    
    # Generate coverage report
    print("\n" + "="*60)
    print("COVERAGE REPORT")
    print("="*60)
    cov.report()
    
    # Generate HTML coverage report
    cov.html_report(directory='htmlcov')
    print(f"\nHTML coverage report generated in: {script_dir}/htmlcov/index.html")
    
    return result.wasSuccessful()

def run_specific_test(test_file):
    """Run a specific test file"""
    if not test_file.endswith('.py'):
        test_file += '.py'
    
    test_path = Path(__file__).parent / test_file
    
    if not test_path.exists():
        print(f"Test file not found: {test_path}")
        return False
    
    # Run the specific test
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromName(test_file[:-3])
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        # Run specific test file
        test_file = sys.argv[1]
        success = run_specific_test(test_file)
    else:
        # Run all tests with coverage
        success = run_tests_with_coverage()
    
    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == '__main__':
    main() 