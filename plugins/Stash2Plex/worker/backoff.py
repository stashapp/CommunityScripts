"""
Exponential backoff with full jitter for retry delay calculation.

Provides crash-safe delay calculation for retry orchestration.
Full jitter prevents thundering herd when multiple jobs retry
simultaneously after Plex outage.

Functions:
    calculate_delay: Calculate retry delay with full jitter
    get_retry_params: Get backoff parameters based on error type
"""

import random
from typing import Optional, Tuple


def calculate_delay(
    retry_count: int,
    base: float,
    cap: float,
    jitter_seed: Optional[int] = None
) -> float:
    """
    Calculate retry delay using exponential backoff with full jitter.

    Full jitter formula: random.uniform(0, min(cap, base * 2^retry_count))

    This distributes retries randomly within the delay window,
    preventing thundering herd when multiple jobs retry after an outage.

    Args:
        retry_count: Number of previous retry attempts (0 for first retry)
        base: Base delay in seconds (e.g., 5.0)
        cap: Maximum delay cap in seconds (e.g., 80.0)
        jitter_seed: Optional seed for deterministic testing

    Returns:
        Delay in seconds, in range [0, min(cap, base * 2^retry_count)]

    Example:
        >>> from worker.backoff import calculate_delay
        >>> delay = calculate_delay(retry_count=3, base=1.0, cap=60.0,
        ...                         jitter_seed=42)
        >>> 0 <= delay <= 8.0  # 2^3 = 8, with jitter
        True
    """
    # Create seeded random generator for deterministic testing
    rng = random.Random(jitter_seed)

    # Calculate exponential delay: base * 2^retry_count
    exponential_delay = base * (2 ** retry_count)

    # Apply cap
    max_delay = min(cap, exponential_delay)

    # Full jitter: random value in [0, max_delay]
    return rng.uniform(0, max_delay)


def get_retry_params(error: Exception) -> Tuple[float, float, int]:
    """
    Get backoff parameters based on error type.

    PlexNotFound errors use longer delays and more retries because
    Plex library scanning can take minutes to hours.

    Args:
        error: The exception that triggered the retry

    Returns:
        Tuple of (base_delay, max_delay, max_retries)
        - PlexNotFound: (30.0, 600.0, 12) for ~2 hour window
        - Other errors: (5.0, 80.0, 5) for standard backoff
    """
    # Import lazily to avoid circular imports
    from plex.exceptions import PlexNotFound

    if isinstance(error, PlexNotFound):
        # Library scanning: longer delays, more retries
        # 30s base -> 60 -> 120 -> 240 -> 480 -> capped at 600 (10 min)
        # 12 retries gives ~2 hour total retry window
        return (30.0, 600.0, 12)
    else:
        # Standard transient errors: normal backoff
        # 5s base -> 10 -> 20 -> 40 -> 80 (capped)
        return (5.0, 80.0, 5)
