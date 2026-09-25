import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel

from scraper.client import UnifiedScraperClient
from scraper.config import SCRAPER_HOST, SCRAPER_PORT
from scraper.snapshots import save_snapshot
from scraper.models import ScrapeResult
from scraper.logging_config import get_logger

logger = get_logger("ScraperAPI")
app = FastAPI(title="ShelfLife Python Scraper Service", version="2.0.0")

client = UnifiedScraperClient()

stats_counter = {
    "total_scrapes": 0,
    "successful_scrapes": 0,
    "failed_scrapes": 0,
    "dynamic_browser_fetches": 0,
    "start_time": time.time(),
}

class ScrapeRequest(BaseModel):
    url: str
    force_dynamic: bool = False

class BatchScrapeRequest(BaseModel):
    urls: List[str]

@app.get("/health")
def health():
    return {
        "status": "ONLINE",
        "service": "ShelfLife Scrapling Python Scraper",
        "uptime_seconds": int(time.time() - stats_counter["start_time"]),
    }

@app.get("/stats")
def stats():
    return stats_counter

@app.post("/scrape")
def scrape_endpoint(req: ScrapeRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL parameter is required")

    logger.info(f"Incoming scrape request for: {req.url}")
    stats_counter["total_scrapes"] += 1

    if req.force_dynamic:
        result = client.fetch_dynamic(req.url)
        if not result:
            result = client.fetch(req.url)
    else:
        result = client.fetch(req.url)

    if result.success:
        stats_counter["successful_scrapes"] += 1
        if result.fetch_method == "dynamic_browser":
            stats_counter["dynamic_browser_fetches"] += 1
        save_snapshot(result)
    else:
        stats_counter["failed_scrapes"] += 1

    res_data = result.model_dump() if hasattr(result, "model_dump") else result.dict()
    return {"success": result.success, "data": res_data}

@app.post("/scrape/batch")
def scrape_batch_endpoint(req: BatchScrapeRequest):
    results = []
    for url in req.urls:
        stats_counter["total_scrapes"] += 1
        res = client.fetch(url)
        if res.success:
            stats_counter["successful_scrapes"] += 1
            save_snapshot(res)
        else:
            stats_counter["failed_scrapes"] += 1
        results.append(res.model_dump() if hasattr(res, "model_dump") else res.dict())
    return {"count": len(results), "data": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SCRAPER_HOST, port=SCRAPER_PORT)
