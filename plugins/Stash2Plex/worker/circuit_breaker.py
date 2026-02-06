"""
Circuit breaker pattern for resilient Plex API calls.

Prevents retry exhaustion during Plex outages by pausing
job processing when consecutive failures occur.

States:
- CLOSED: Normal operation, count failures
- OPEN: Block all requests until recovery timeout
- HALF_OPEN: Allow one test request to check recovery
"""

import time
from enum import Enum


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """
    Circuit breaker state machine.

    Tracks consecutive failures and blocks execution when
    a failure threshold is reached. Allows recovery testing
    after a timeout period.

    Args:
        failure_threshold: Consecutive failures before opening (default: 5)
        recovery_timeout: Seconds before transitioning to HALF_OPEN (default: 60.0)
        success_threshold: Successes in HALF_OPEN to close (default: 1)

    Usage:
        breaker = CircuitBreaker()

        if breaker.can_execute():
            try:
                result = call_plex_api()
                breaker.record_success()
            except Exception:
                breaker.record_failure()
        else:
            # Circuit is open, skip execution
            pass
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        success_threshold: int = 1
    ):
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._success_threshold = success_threshold

        # Internal state
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._opened_at: float | None = None

    @property
    def state(self) -> CircuitState:
        """Current circuit state (may transition to HALF_OPEN if timeout elapsed)."""
        if self._state == CircuitState.OPEN and self._opened_at is not None:
            if time.time() - self._opened_at >= self._recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._success_count = 0
        return self._state

    def can_execute(self) -> bool:
        """
        Check if execution is allowed.

        Returns:
            True if circuit is CLOSED or HALF_OPEN, False if OPEN
        """
        current_state = self.state  # Property call handles OPEN -> HALF_OPEN transition
        return current_state != CircuitState.OPEN

    def record_success(self) -> None:
        """
        Record a successful execution.

        In CLOSED state: resets failure count.
        In HALF_OPEN state: increments success count, closes if threshold reached.
        """
        if self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            if self._success_count >= self._success_threshold:
                self._close()
        else:
            # CLOSED state - just reset failure count
            self._failure_count = 0

    def record_failure(self) -> None:
        """
        Record a failed execution.

        In CLOSED state: increments failure count, opens if threshold reached.
        In HALF_OPEN state: immediately reopens the circuit.
        """
        if self._state == CircuitState.HALF_OPEN:
            # HALF_OPEN failure -> reopen immediately
            self._open()
        else:
            # CLOSED state - count failures
            self._failure_count += 1
            if self._failure_count >= self._failure_threshold:
                self._open()

    def reset(self) -> None:
        """
        Force reset to CLOSED state.

        Useful for testing or manual recovery.
        """
        self._close()

    def _open(self) -> None:
        """Transition to OPEN state."""
        self._state = CircuitState.OPEN
        self._opened_at = time.time()
        self._failure_count = 0
        self._success_count = 0

    def _close(self) -> None:
        """Transition to CLOSED state."""
        self._state = CircuitState.CLOSED
        self._opened_at = None
        self._failure_count = 0
        self._success_count = 0


__all__ = ['CircuitBreaker', 'CircuitState']
