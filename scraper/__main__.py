import sys
import json
import argparse
from scraper.client import UnifiedScraperClient

def main():
    parser = argparse.ArgumentParser(description="ShelfLife Scrapling-based Python Scraper")
    parser.add_argument("url", nargs="?", help="URL to scrape")
    parser.add_argument("--json", action="store_true", help="Output raw JSON format")
    parser.add_argument("--dynamic", action="store_true", help="Force dynamic browser rendering")
    parser.add_argument("--test", action="store_true", help="Run test scrape against example.com")

    args = parser.parse_args()

    url = args.url
    if args.test or not url:
        url = "https://example.com"

    client = UnifiedScraperClient()
    if args.dynamic:
        result = client.fetch_dynamic(url)
    else:
        result = client.fetch(url)

    if result:
        res_dict = result.model_dump() if hasattr(result, "model_dump") else result.dict()
        if args.json:
            print(json.dumps(res_dict, indent=2))
        else:
            print(f"=== Scrape Result for {url} ===")
            print(f"Success: {result.success}")
            print(f"Title: {result.title}")
            print(f"Method: {result.fetch_method}")
            print(f"Quality Score: {result.quality_score}/100")
            print(f"Content Length: {len(result.text)} chars")
            print(f"Content Hash: {result.content_hash}")

if __name__ == "__main__":
    main()
