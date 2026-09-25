import asyncio
import time
from typing import Dict, Any, Callable
from scraper.config import MAX_RETRIES, REQUEST_TIMEOUT_SECONDS
from scraper.logging_config import get_logger

logger = get_logger("Scheduler")

class ScrapeScheduler:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.running = False

    async def add_task(self, url: str, callback: Callable):
        await self.queue.put({"url": url, "callback": callback, "retries": 0})

    async def run_worker(self, client):
        self.running = True
        logger.info("Scraper background scheduler worker started.")
        while self.running:
            try:
                task = await self.queue.get()
                url = task["url"]
                retries = task["retries"]

                logger.info(f"Executing scheduled scrape for: {url}")
                result = client.fetch(url)

                if not result.success and retries < MAX_RETRIES:
                    backoff = 2 ** (retries + 1)
                    logger.warn(f"Retrying {url} after {backoff}s (attempt {retries + 1}/{MAX_RETRIES})")
                    await asyncio.sleep(backoff)
                    task["retries"] += 1
                    await self.queue.put(task)
                else:
                    if task["callback"]:
                        await task["callback"](result)

                self.queue.task_done()
            except Exception as e:
                logger.error(f"Scheduler worker error: {e}")
                await asyncio.sleep(1)

    def stop(self):
        self.running = False
