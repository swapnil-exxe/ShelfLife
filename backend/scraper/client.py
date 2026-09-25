import time
import httpx
from typing import Optional

from scrapling import Fetcher
from scraper.config import REQUEST_TIMEOUT_SECONDS, DYNAMIC_BROWSER_ENABLED
from scraper.robots import is_allowed_by_robots, classify_failure
from scraper.extraction import run_extraction
from scraper.fallback import metadata_fallback_extract
from scraper.models import ScrapeResult
from scraper.logging_config import get_logger

logger = get_logger("ScraperClient")

class UnifiedScraperClient:
    def __init__(self):
        self.fetcher = Fetcher()

    def fetch(self, url: str) -> ScrapeResult:
        start_time = time.time()
        
        # Check robots.txt policy
        if not is_allowed_by_robots(url):
            return ScrapeResult(
                url=url,
                final_url=url,
                status_code=403,
                success=False,
                error="Disallowed by robots.txt",
                failure_reason="ROBOTS_DISALLOWED",
                fetch_method="blocked",
            )

        # ── LEVEL 1: Fast HTTP Fetch ──
        try:
            logger.info(f"[Level 1 - Fast HTTP] Fetching: {url}")
            with httpx.Client(timeout=REQUEST_TIMEOUT_SECONDS, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"}) as client:
                resp = client.get(url)
                elapsed = int((time.time() - start_time) * 1000)
                
                if resp.status_code == 200:
                    result = run_extraction(
                        url=url,
                        final_url=str(resp.url),
                        html=resp.text,
                        status_code=200,
                        fetch_method="fast_http",
                        elapsed_ms=elapsed,
                    )
                    if result.quality_score >= 40 and len(result.text) >= 100:
                        logger.info(f"[Level 1 Success] Quality score: {result.quality_score}")
                        return result
        except Exception as e:
            logger.warn(f"[Level 1 Failed] {e}")

        # ── LEVEL 2: Scrapling Adaptive Extraction ──
        try:
            logger.info(f"[Level 2 - Scrapling Adaptive] Fetching: {url}")
            page = self.fetcher.get(url)
            elapsed = int((time.time() - start_time) * 1000)
            
            if page and hasattr(page, "html") and page.html:
                result = run_extraction(
                    url=url,
                    final_url=getattr(page, "url", url),
                    html=page.html,
                    status_code=getattr(page, "status", 200),
                    fetch_method="scrapling_adaptive",
                    elapsed_ms=elapsed,
                )
                if result.quality_score >= 35:
                    logger.info(f"[Level 2 Success] Quality score: {result.quality_score}")
                    return result
        except Exception as e:
            logger.warn(f"[Level 2 Failed] {e}")

        # ── LEVEL 3: Dynamic Browser Rendering (Only when necessary) ──
        if DYNAMIC_BROWSER_ENABLED:
            try:
                logger.info(f"[Level 3 - Dynamic Browser] Fetching: {url}")
                dynamic_res = self.fetch_dynamic(url)
                if dynamic_res and dynamic_res.success and dynamic_res.quality_score >= 30:
                    return dynamic_res
            except Exception as e:
                logger.warn(f"[Level 3 Failed] {e}")

        # ── LEVEL 4: Metadata Fallback ──
        try:
            logger.info(f"[Level 4 - Metadata Fallback] Fetching: {url}")
            resp = httpx.get(url, timeout=REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
            elapsed = int((time.time() - start_time) * 1000)
            fallback_res = metadata_fallback_extract(url, resp.text, resp.status_code, elapsed)
            if fallback_res.success:
                return fallback_res
        except Exception as e:
            logger.warn(f"[Level 4 Failed] {e}")

        # ── LEVEL 5: Return Structured Failure ──
        elapsed = int((time.time() - start_time) * 1000)
        failure_reason = classify_failure(0, "All fetch levels exhausted")
        return ScrapeResult(
            url=url,
            final_url=url,
            status_code=500,
            success=False,
            error="Extraction levels exhausted",
            failure_reason=failure_reason,
            fetch_method="failed",
            elapsed_ms=elapsed,
        )

    def fetch_dynamic(self, url: str) -> Optional[ScrapeResult]:
        start_time = time.time()
        try:
            # Scrapling Stealth Browser fetching
            from scrapling import StealthFetcher
            stealth = StealthFetcher()
            page = stealth.fetch(url)
            elapsed = int((time.time() - start_time) * 1000)
            if page and hasattr(page, "html"):
                return run_extraction(
                    url=url,
                    final_url=url,
                    html=page.html,
                    status_code=200,
                    fetch_method="dynamic_browser",
                    elapsed_ms=elapsed,
                )
        except Exception as e:
            logger.error(f"Dynamic browser exception: {e}")
        return None
