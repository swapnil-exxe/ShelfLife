import hashlib
from scraper.normalize import normalize_url, normalize_whitespace

def compute_hash(text: str) -> str:
    cleaned = normalize_whitespace(text or "")
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def is_duplicate_url(url1: str, url2: str) -> bool:
    return normalize_url(url1) == normalize_url(url2)

def is_duplicate_content(hash1: str, hash2: str) -> bool:
    return hash1 and hash2 and hash1 == hash2
