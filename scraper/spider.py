from scrapling import Fetcher
from scraper.models import ScrapeResult
from scraper.extraction import run_extraction
import time

class ScraplingSpider:
    def __init__(self):
        self.fetcher = Fetcher()

    def crawl_url(self, url: str) -> ScrapeResult:
        start_time = time.time()
        try:
            page = self.fetcher.get(url)
            elapsed = int((time.time() - start_time) * 1000)
            if page and hasattr(page, "html"):
                return run_extraction(
                    url=url,
                    final_url=getattr(page, "url", url),
                    html=page.html,
                    status_code=getattr(page, "status", 200),
                    fetch_method="scrapling_spider",
                    elapsed_ms=elapsed,
                )
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            return ScrapeResult(
                url=url,
                final_url=url,
                status_code=500,
                success=False,
                error=str(e),
                failure_reason="PARSING_FAILED",
                fetch_method="spider_error",
                elapsed_ms=elapsed,
            )
