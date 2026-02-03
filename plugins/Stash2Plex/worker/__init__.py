"""
Worker module for background job processing.

Exports:
    SyncWorker: Background worker with retry orchestration
    CircuitBreaker: Circuit breaker for Plex outage protection
    CircuitState: Circuit breaker state enum
    calculate_delay: Exponential backoff delay calculator
    get_retry_params: Get retry parameters for error type
"""

from worker.processor import SyncWorker, TransientError, PermanentError
from worker.circuit_breaker import CircuitBreaker, CircuitState
from worker.backoff import calculate_delay, get_retry_params

__all__ = [
    'SyncWorker',
    'TransientError',
    'PermanentError',
    'CircuitBreaker',
    'CircuitState',
    'calculate_delay',
    'get_retry_params',
]
