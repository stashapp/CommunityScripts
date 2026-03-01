"""
Timing utilities for performance measurement.

Provides decorators to log operation duration and identify bottlenecks.
"""

import logging
import sys
import time
from functools import wraps
from typing import Any, Callable

logger = logging.getLogger('Stash2Plex.plex.timing')


def timed(func: Callable) -> Callable:
    """
    Decorator to log function execution time.

    Logs at DEBUG level for fast operations (<1s),
    INFO level for slower operations (>=1s).

    Args:
        func: Function to wrap with timing

    Returns:
        Wrapped function that logs execution time

    Example:
        >>> @timed
        ... def slow_function():
        ...     time.sleep(0.5)
        ...     return "done"
        >>> slow_function()  # Logs: slow_function took 0.501s
    """
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            elapsed = time.perf_counter() - start
            level = logging.INFO if elapsed >= 1.0 else logging.DEBUG
            logger.log(level, f"{func.__name__} took {elapsed:.3f}s")
    return wrapper


class OperationTimer:
    """
    Context manager for timing code blocks.

    Logs at DEBUG level for fast operations (<1s),
    INFO level for slower operations (>=1s).

    Attributes:
        operation_name: Name of the operation being timed
        start_time: Time when context was entered
        elapsed: Elapsed time in seconds (available after exit)

    Example:
        >>> with OperationTimer("database query"):
        ...     result = db.query()
        # Logs: database query took 0.123s

        >>> timer = OperationTimer("fetch")
        >>> with timer:
        ...     data = fetch_data()
        >>> print(f"Fetch took {timer.elapsed:.3f}s")
    """

    def __init__(self, operation_name: str) -> None:
        """
        Initialize operation timer.

        Args:
            operation_name: Descriptive name for the operation
        """
        self.operation_name = operation_name
        self.start_time: float = 0.0
        self.elapsed: float = 0.0

    def __enter__(self) -> "OperationTimer":
        """Start timing the operation."""
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, *args) -> None:
        """Stop timing and log the duration."""
        self.elapsed = time.perf_counter() - self.start_time
        level = logging.INFO if self.elapsed >= 1.0 else logging.DEBUG
        logger.log(level, f"{self.operation_name} took {self.elapsed:.3f}s")


def log_timing(msg: str) -> None:
    """
    Log timing message with Stash plugin format.

    Uses Stash's plugin log format for DEBUG level timing messages.

    Args:
        msg: Timing message to log

    Example:
        >>> log_timing("Search completed in 0.5s")
        # Outputs: \x01d\x02[Stash2Plex Timing] Search completed in 0.5s
    """
    print(f"\x01d\x02[Stash2Plex Timing] {msg}", file=sys.stderr)
