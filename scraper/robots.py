from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
import httpx
from scraper.config import ROBOTS_CHECK_ENABLED

_robot_cache = {}

def is_allowed_by_robots(url: str, user_agent: str = "ShelfLifeBot") -> bool:
    if not ROBOTS_CHECK_ENABLED:
        return True

    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        if not domain:
            return True

        if domain in _robot_cache:
            rfp = _robot_cache[domain]
        else:
            robots_url = f"{parsed.scheme}://{domain}/robots.txt"
            rfp = RobotFileParser()
            rfp.set_url(robots_url)
            try:
                resp = httpx.get(robots_url, timeout=5.0, follow_redirects=True)
                if resp.status_code == 200:
                    rfp.parse(resp.text.splitlines())
                else:
                    rfp.allow_all = True
            except Exception:
                rfp.allow_all = True
            _robot_cache[domain] = rfp

        return rfp.can_fetch(user_agent, url)
    except Exception:
        return True

def classify_failure(status_code: int, error_str: str) -> str:
    err_msg = (error_str or "").lower()
    if status_code == 429 or "rate limit" in err_msg or "too many requests" in err_msg:
        return "RATE_LIMITED"
    if status_code in (401, 403) or "unauthorized" in err_msg or "forbidden" in err_msg:
        return "AUTH_REQUIRED"
    if "cloudflare" in err_msg or "captcha" in err_msg or "access denied" in err_msg:
        return "BLOCKED"
    if "robots" in err_msg:
        return "ROBOTS_DISALLOWED"
    if "dns" in err_msg or "connect" in err_msg or "timeout" in err_msg or "name resolution" in err_msg:
        return "NETWORK_ERROR"
    if "parsing" in err_msg or "beautifulsoup" in err_msg:
        return "PARSING_FAILED"
    return "UNSUPPORTED_CONTENT"
