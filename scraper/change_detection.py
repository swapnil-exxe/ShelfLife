from scraper.deduplicate import compute_hash

def detect_changes(previous_hash: str, current_hash: str, text_length_diff: int = 0) -> str:
    if not previous_hash or not current_hash:
        return "MAJOR_CHANGE"
    if previous_hash == current_hash:
        return "UNCHANGED"
    if abs(text_length_diff) < 150:
        return "MINOR_CHANGE"
    return "MAJOR_CHANGE"
