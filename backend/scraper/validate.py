from scraper.models import ScrapeResult

def calculate_quality_score(title: str, text: str, description: str, status_code: int) -> int:
    if status_code != 200:
        return 0

    score = 0

    # Title score (0 - 30)
    if title:
        if len(title) > 5 and "404" not in title.lower() and "access denied" not in title.lower():
            score += 30
        else:
            score += 10

    # Text length score (0 - 50)
    text_len = len(text or "")
    if text_len >= 500:
        score += 50
    elif text_len >= 200:
        score += 35
    elif text_len >= 50:
        score += 20
    else:
        score += 5

    # Description score (0 - 20)
    if description and len(description) > 10:
        score += 20
    elif description:
        score += 10

    return min(100, max(0, score))

def validate_scrape_result(result: ScrapeResult) -> bool:
    if result.status_code != 200:
        return False
    if result.quality_score < 30 and len(result.text) < 50:
        return False
    return True
