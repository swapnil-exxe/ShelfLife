from scraper.models import ScrapeResult
from scraper.metadata import extract_metadata

def metadata_fallback_extract(url: str, html: str, status_code: int, elapsed_ms: int) -> ScrapeResult:
    meta = extract_metadata(html, url)
    title = meta.title or url
    description = meta.description or ""

    return ScrapeResult(
        url=url,
        final_url=url,
        status_code=status_code,
        html=html,
        text=description or title,
        title=title,
        description=description,
        author=meta.author,
        published_at=meta.published_at,
        canonical_url=meta.canonical_url or url,
        site_name=meta.site_name,
        language=meta.language or "en",
        image=meta.image,
        fetch_method="metadata_fallback",
        elapsed_ms=elapsed_ms,
        quality_score=35 if description else 15,
        content_hash="",
        success=bool(title),
    )
