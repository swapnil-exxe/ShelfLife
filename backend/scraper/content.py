from bs4 import BeautifulSoup
from typing import List
from scraper.models import ExtractedContent
from scraper.normalize import normalize_whitespace
from scraper.config import MAX_AI_INPUT, MAX_TEXT_SIZE

# Selectors to strip
STRIP_TAGS = ["script", "style", "noscript", "iframe", "svg", "header", "footer", "nav", "form"]
STRIP_CLASSES = ["nav", "footer", "sidebar", "cookie", "banner", "ad-container", "advertisement", "newsletter", "popup"]

def extract_content(html: str) -> ExtractedContent:
    res = ExtractedContent()
    if not html:
        return res

    try:
        soup = BeautifulSoup(html, "html.parser")

        # 1. Strip unwanted boilerplate elements
        for tag in soup(STRIP_TAGS):
            tag.decompose()

        for class_kw in STRIP_CLASSES:
            for el in soup.find_all(class_=lambda c: c and class_kw in str(c).lower()):
                el.decompose()

        # 2. Priority extraction strategy: <article> -> <main> -> semantic HTML -> headings + p -> body
        target_container = (
            soup.find("article") or
            soup.find("main") or
            soup.find(id=lambda i: i and "content" in str(i).lower()) or
            soup.body or
            soup
        )

        # 3. Extract Headings
        headings = []
        for h in target_container.find_all(["h1", "h2", "h3"]):
            text = normalize_whitespace(h.get_text())
            if text and len(text) > 3:
                headings.append(text)
        res.headings = headings[:10]

        # 4. Extract Links
        links = []
        for a in target_container.find_all("a", href=True):
            href = a.get("href").strip()
            if href.startswith("http://") or href.startswith("https://"):
                links.append(href)
        res.links = list(set(links))[:20]

        # 5. Extract Main Text
        paragraphs = []
        for p in target_container.find_all(["p", "li", "pre", "code"]):
            t = normalize_whitespace(p.get_text())
            if len(t) > 15:
                paragraphs.append(t)

        full_text = "\n\n".join(paragraphs) if paragraphs else normalize_whitespace(target_container.get_text())

        res.text = full_text[:MAX_TEXT_SIZE]
        res.clean_text = normalize_whitespace(full_text)
        res.ai_input_text = res.clean_text[:MAX_AI_INPUT]

        if soup.title:
            res.title = normalize_whitespace(soup.title.get_text())

    except Exception:
        pass

    return res
