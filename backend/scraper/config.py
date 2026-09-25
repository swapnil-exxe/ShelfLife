import os
from dotenv import load_dotenv

load_dotenv()

SCRAPER_PORT = int(os.getenv("SCRAPER_PORT", 8001))
SCRAPER_HOST = os.getenv("SCRAPER_HOST", "127.0.0.1")

REQUEST_TIMEOUT_SECONDS = int(os.getenv("SCRAPER_TIMEOUT", 30))
MAX_CONCURRENT_SCRAPES = int(os.getenv("SCRAPER_MAX_CONCURRENT", 5))
MAX_RETRIES = int(os.getenv("SCRAPER_MAX_RETRIES", 3))

DYNAMIC_BROWSER_ENABLED = os.getenv("SCRAPER_DYNAMIC_ENABLED", "true").lower() == "true"
SNAPSHOTS_ENABLED = os.getenv("SCRAPER_SNAPSHOT_ENABLED", "true").lower() == "true"
ROBOTS_CHECK_ENABLED = os.getenv("SCRAPER_ROBOTS_ENABLED", "true").lower() == "true"

MAX_HTML_SIZE = int(os.getenv("SCRAPER_MAX_HTML_SIZE", 5000000))
MAX_TEXT_SIZE = int(os.getenv("SCRAPER_MAX_TEXT_SIZE", 50000))
MAX_AI_INPUT = int(os.getenv("SCRAPER_MAX_AI_INPUT", 12000))

SNAPSHOTS_DIR = os.getenv("SCRAPER_SNAPSHOTS_DIR", "snapshots")
