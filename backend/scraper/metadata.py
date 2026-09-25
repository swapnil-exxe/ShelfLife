import json
from bs4 import BeautifulSoup
from typing import Dict, Any, List
from scraper.models import ExtractedMetadata
from scraper.normalize import normalize_whitespace

JSON_LD_TARGET_TYPES = {
    "Article", "NewsArticle", "BlogPosting", "Product",
    "WebPage", "TechArticle", "SoftwareApplication"
}

def extract_metadata(html: str, url: str) -> ExtractedMetadata:
    meta = ExtractedMetadata()
    if not html:
        return meta

    try:
        soup = BeautifulSoup(html, "html.parser")

        # 1. Standard HTML Title
        if soup.title and soup.title.string:
            meta.title = normalize_whitespace(soup.title.string)

        # 2. Meta Description & OpenGraph / Twitter Cards
        for tag in soup.find_all("meta"):
            name = tag.get("name", "").lower()
            prop = tag.get("property", "").lower()
            content = tag.get("content", "")
            if not content:
                continue

            content = normalize_whitespace(content)

            if prop == "og:title" or name == "twitter:title":
                meta.title = meta.title or content
            elif name == "description" or prop == "og:description" or name == "twitter:description":
                meta.description = meta.description or content
            elif prop == "og:image" or name == "twitter:image":
                meta.image = meta.image or content
            elif prop == "og:site_name":
                meta.site_name = content
            elif name == "author" or prop == "article:author":
                meta.author = content
            elif prop == "article:published_time":
                meta.published_at = content
            elif prop == "article:modified_time":
                meta.modified_at = content

        # Canonical Link
        canonical_link = soup.find("link", rel=lambda r: r and "canonical" in r.lower())
        if canonical_link and canonical_link.get("href"):
            meta.canonical_url = canonical_link.get("href")

        # 3. JSON-LD Extraction
        json_ld_blocks = []
        for script in soup.find_all("script", type="application/ld+json"):
            if not script.string:
                continue
            try:
                data = json.loads(script.string.strip())
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        item_type = item.get("@type", "")
                        if any(t in str(item_type) for t in JSON_LD_TARGET_TYPES):
                            json_ld_blocks.append(item)
                            if not meta.title and item.get("headline"):
                                meta.title = normalize_whitespace(item.get("headline"))
                            if not meta.description and item.get("description"):
                                meta.description = normalize_whitespace(item.get("description"))
                            if not meta.author and item.get("author"):
                                auth = item.get("author")
                                meta.author = auth.get("name") if isinstance(auth, dict) else str(auth)
            except Exception:
                continue

        meta.json_ld = json_ld_blocks
    except Exception:
        pass

    return meta
