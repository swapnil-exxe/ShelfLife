from scraper.metadata import extract_metadata
from scraper.content import extract_content
from scraper.models import ScrapeResult
from scraper.validate import calculate_quality_score
from scraper.deduplicate import compute_hash
from scraper.normalize import normalize_url

def run_extraction(url: str, final_url: str, html: str, status_code: int, fetch_method: str, elapsed_ms: int) -> ScrapeResult:
    metadata = extract_metadata(html, final_url or url)
    content = extract_content(html)

    title = metadata.title or content.title or final_url or url
    description = metadata.description or content.description or ""
    text = content.clean_text
    canonical_url = normalize_url(metadata.canonical_url or final_url or url)

    quality_score = calculate_quality_score(title, text, description, status_code)
    content_hash = compute_hash(text or html)

    return ScrapeResult(
        url=url,
        final_url=final_url or url,
        status_code=status_code,
        html=html,
        text=text,
        title=title,
        description=description,
        author=metadata.author,
        published_at=metadata.published_at,
        canonical_url=canonical_url,
        site_name=metadata.site_name,
        language=metadata.language or "en",
        image=metadata.image,
        fetch_method=fetch_method,
        elapsed_ms=elapsed_ms,
        quality_score=quality_score,
        content_hash=content_hash,
        success=status_code == 200 and quality_score >= 20,
    )
