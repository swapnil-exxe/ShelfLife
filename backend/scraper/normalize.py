import re
import html
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "gclid", "fbclid", "msclkid", "ref", "mc_cid", "mc_eid"
}

def normalize_whitespace(text: str) -> str:
    if not text:
        return ""
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()

def normalize_url(url: str) -> str:
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        scheme = parsed.scheme.lower() or "https"
        netloc = parsed.netloc.lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]

        path = parsed.path
        if path.endswith("/") and len(path) > 1:
            path = path[:-1]

        # Strip tracking parameters safely
        query_params = parse_qs(parsed.query, keep_blank_values=True)
        filtered_params = {k: v for k, v in query_params.items() if k.lower() not in TRACKING_PARAMS}
        new_query = urlencode(filtered_params, doseq=True)

        return urlunparse((scheme, netloc, path, parsed.params, new_query, ""))
    except Exception:
        return url
