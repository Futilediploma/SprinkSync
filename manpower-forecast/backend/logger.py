"""Logging configuration for the application."""
import logging
import sys
from config import settings

# Create logger
logger = logging.getLogger("manpower_forecast")

# Set level based on environment
log_level = getattr(settings, 'log_level', 'INFO')
logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

# Create console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)

# Create formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(formatter)

# Add handler to logger (avoid duplicates)
if not logger.handlers:
    logger.addHandler(console_handler)

# Convenience functions
def info(message: str) -> None:
    """Log info message."""
    logger.info(message)

def warning(message: str) -> None:
    """Log warning message."""
    logger.warning(message)

def error(message: str) -> None:
    """Log error message."""
    logger.error(message)

def debug(message: str) -> None:
    """Log debug message."""
    logger.debug(message)

def exception(message: str) -> None:
    """Log exception with traceback."""
    logger.exception(message)
