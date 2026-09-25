import os
import json
from datetime import datetime
from urllib.parse import urlparse
from scraper.config import SNAPSHOTS_ENABLED, SNAPSHOTS_DIR
from scraper.models import ScrapeResult

def save_snapshot(result: ScrapeResult) -> None:
    if not SNAPSHOTS_ENABLED or not result.success:
        return

    try:
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        domain = urlparse(result.final_url or result.url).netloc.replace(":", "_") or "unknown"

        dir_path = os.path.join(SNAPSHOTS_DIR, year, month, domain)
        os.makedirs(dir_path, exist_ok=True)

        filename = f"{result.content_hash[:16]}.json"
        file_path = os.path.join(dir_path, filename)

        snapshot_data = {
            "url": result.url,
            "final_url": result.final_url,
            "timestamp": now.isoformat(),
            "status_code": result.status_code,
            "content_hash": result.content_hash,
            "title": result.title,
            "text_length": len(result.text or ""),
            "fetch_method": result.fetch_method,
            "quality_score": result.quality_score,
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(snapshot_data, f, indent=2)
    except Exception:
        pass
