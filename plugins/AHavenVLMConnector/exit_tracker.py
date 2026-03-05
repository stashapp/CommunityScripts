"""
Comprehensive sys.exit tracking module
Instruments all sys.exit() calls with full call stack and context
"""

import sys
import traceback
from typing import Optional

# Store original sys.exit
original_exit = sys.exit

# Track if we've already patched
_exit_tracker_patched = False

def install_exit_tracker(logger=None) -> None:
    """
    Install the exit tracker by monkey-patching sys.exit
    
    Args:
        logger: Optional logger instance (will use fallback print if None)
    """
    global _exit_tracker_patched, original_exit
    
    if _exit_tracker_patched:
        return
    
    # Store original if not already stored
    if hasattr(sys, 'exit') and sys.exit is not original_exit:
        original_exit = sys.exit
    
    def tracked_exit(code: int = 0) -> None:
        """Track sys.exit() calls with full call stack"""
        # Get current stack trace (not from exception, but current call stack)
        stack = traceback.extract_stack()
        
        # Format the stack trace, excluding this tracking function
        stack_lines = []
        for frame in stack:
            # Skip internal Python frames and this tracker
            if ('tracked_exit' not in frame.filename and 
                '/usr/lib' not in frame.filename and 
                '/System/Library' not in frame.filename and 
                'exit_tracker.py' not in frame.filename):
                stack_lines.append(
                    f"  File \"{frame.filename}\", line {frame.lineno}, in {frame.name}\n    {frame.line}"
                )
        
        # Take last 15 frames to see the full call chain
        stack_str = '\n'.join(stack_lines[-15:])
        
        # Get current exception info if available
        exc_info = sys.exc_info()
        exc_str = ""
        if exc_info[0] is not None:
            exc_str = f"\n  Active Exception: {exc_info[0].__name__}: {exc_info[1]}"
        
        # Build the error message
        error_msg = f"""[DEBUG_EXIT_CODE] ==========================================
[DEBUG_EXIT_CODE] sys.exit() called with code: {code}
[DEBUG_EXIT_CODE] Call stack (last 15 frames):
{stack_str}
{exc_str}
[DEBUG_EXIT_CODE] =========================================="""
        
        # Log using provided logger or fallback to print
        if logger:
            try:
                logger.error(error_msg)
            except Exception as log_error:
                print(f"[EXIT_TRACKER_LOGGER_ERROR] Failed to log: {log_error}")
                print(error_msg)
        else:
            print(error_msg)
        
        # Call original exit
        original_exit(code)
    
    # Install the tracker
    sys.exit = tracked_exit
    _exit_tracker_patched = True
    
    if logger:
        logger.debug("[DEBUG_EXIT_CODE] Exit tracker installed successfully")
    else:
        print("[DEBUG_EXIT_CODE] Exit tracker installed successfully")

def uninstall_exit_tracker() -> None:
    """Uninstall the exit tracker and restore original sys.exit"""
    global _exit_tracker_patched, original_exit
    
    if _exit_tracker_patched:
        sys.exit = original_exit
        _exit_tracker_patched = False

# Auto-install on import (can be disabled by calling uninstall_exit_tracker())
if not _exit_tracker_patched:
    install_exit_tracker()