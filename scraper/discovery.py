from bs4 import BeautifulSoup
from typing import List
from urllib.parse import urljoin, urlparse

def discover_contextual_links(html: str, base_url: str, max_pages: int = 5) -> List[str]:
    discovered = []
    if not html or not base_url:
        return discovered

    try:
        soup = BeautifulSoup(html, "html.parser")
        base_domain = urlparse(base_url).netloc

        for a in soup.find_all("a", href=True):
            rel = a.get("rel", [])
            rel_str = " ".join(rel) if isinstance(rel, list) else str(rel)

            # Discover canonical, next, or article links
            if "next" in rel_str or "canonical" in rel_str or "successor" in rel_str or "documentation" in a.get_text().lower():
                href = urljoin(base_url, a.get("href"))
                if urlparse(href).netloc == base_domain and href not in discovered:
                    discovered.append(href)
                    if len(discovered) >= max_pages:
                        break
    except Exception:
        pass

    return discovered
